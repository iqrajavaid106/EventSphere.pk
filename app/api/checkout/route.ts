import Stripe from 'stripe'
import { NextResponse } from 'next/server'

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-05-27.dahlia', // Or your stripe version
})

export async function POST(req: Request) {
  try {
    const { eventId, userId, tier, price, couponCode } = await req.json()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: `EventSphere Ticket: ${tier} Pass`,
            description: `Access to event ID: ${eventId}`
          },
          unit_amount: Math.round(price * 100), // Stripe expects the price in cents (e.g. $50 = 5000), round to handle decimal coupons
        },
        quantity: 1,
      }],
      mode: 'payment',
      // Pass the ticket data and coupon in the URL so we can process it in the database after they pay
      success_url: `${siteUrl}/api/success?eventId=${eventId}&userId=${userId}&tier=${tier}&price=${price}${couponCode ? `&couponCode=${couponCode}` : ''}`,
      cancel_url: `${siteUrl}/events/${eventId}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
