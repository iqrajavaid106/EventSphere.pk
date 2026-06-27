import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  const userId = searchParams.get('userId')
  const tier = searchParams.get('tier')
  const price = searchParams.get('price')
  const couponCode = searchParams.get('couponCode')
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    if (!eventId || !userId || !tier || !price) {
      return NextResponse.redirect(`${siteUrl}/dashboard?error=Missing+Parameters`)
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let supabase: any

    if (serviceKey) {
      // Use admin client if service role key is available
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        serviceKey
      )
    } else {
      console.warn("SUPABASE_SERVICE_ROLE_KEY is not set in environment. Falling back to session-based client.")
      // Fallback to cookie-based authenticated client
      supabase = await createServerClient()
    }

    // Insert the ticket into the database because payment succeeded
    const { error: ticketError } = await supabase.from('tickets').insert({
      event_id: eventId,
      profile_id: userId,
      ticket_type: tier,
      price: Number(price),
      status: 'active',
      qr_code_data: `stripe-qr-${eventId}-${userId}-${Date.now()}`
    })

    if (ticketError) {
      console.error('Failed to insert ticket:', ticketError)
      return NextResponse.redirect(`${siteUrl}/dashboard?error=Ticket+Creation+Failed&details=${encodeURIComponent(ticketError.message)}`)
    }

    // Increment coupon used_count in events table
    if (couponCode) {
      if (!serviceKey) {
        console.warn("Skipping coupon increment because SUPABASE_SERVICE_ROLE_KEY is not configured.")
      } else {
        const { data: event, error: fetchError } = await supabase
          .from('events')
          .select('coupons')
          .eq('id', eventId)
          .single()

        if (!fetchError && event && Array.isArray(event.coupons)) {
          const targetCode = couponCode.trim().toUpperCase()
          const updatedCoupons = event.coupons.map((c: any) => {
            if (c.code.trim().toUpperCase() === targetCode) {
              return {
                ...c,
                used_count: (Number(c.used_count) || 0) + 1
              }
            }
            return c
          })

          await supabase
            .from('events')
            .update({ coupons: updatedCoupons })
            .eq('id', eventId)
        }
      }
    }

    let successUrl = `${siteUrl}/dashboard?payment=success`
    if (!serviceKey) {
      successUrl += `&warning=Missing_SUPABASE_SERVICE_ROLE_KEY_In_Local_Env_File`
    }
    return NextResponse.redirect(successUrl)

  } catch (err: any) {
    console.error('Unhandled success route exception:', err)
    return NextResponse.redirect(`${siteUrl}/dashboard?error=InternalServerError&message=${encodeURIComponent(err.message)}`)
  }
}
