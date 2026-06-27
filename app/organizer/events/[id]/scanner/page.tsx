"use client"

import { useState, useRef, use } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/hooks/useUser'
import moment from 'moment'
import jsQR from 'jsqr'
import { Upload, QrCode } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export default function ScannerPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const eventId = params.id
  const [qrHash, setQrHash] = useState('')
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | 'used', message: string, ticket?: any } | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()
  const { data: userObj, isLoading: isUserLoading } = useUser()
  const user = userObj?.id ? userObj : null

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ['scanner-event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      if (error) throw error
      return data
    }
  })

  const verifyTicketHash = async (hash: string) => {
    if (!hash) return
    if (!user) return

    setScanResult(null)

    let ticket: any = null

    // 1. Try matching full qr_code_data string
    const { data: byQrData } = await supabase
      .from('tickets')
      .select('*, profiles(full_name)')
      .eq('event_id', eventId)
      .eq('qr_code_data', hash)
      .maybeSingle()

    if (byQrData) {
      ticket = byQrData
    } else {
      // 2. Try matching full UUID ticket ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hash)
      if (isUuid) {
        const { data: byId } = await supabase
          .from('tickets')
          .select('*, profiles(full_name)')
          .eq('event_id', eventId)
          .eq('id', hash)
          .maybeSingle()
        if (byId) ticket = byId
      } else {
        // 3. Try matching the partial UUID segment printed under the QR code
        const { data: allTickets } = await supabase
          .from('tickets')
          .select('*, profiles(full_name)')
          .eq('event_id', eventId)

        if (allTickets) {
          ticket = allTickets.find((t: any) => t.id.toLowerCase().startsWith(hash.toLowerCase()))
        }
      }
    }

    if (!ticket) {
      setScanResult({ status: 'error', message: 'Invalid Ticket! Does not exist for this event.' })
      setQrHash('')
      return
    }

    if (ticket.status === 'used') {
      setScanResult({ status: 'used', message: 'Ticket already scanned!', ticket })
      setQrHash('')
      return
    }

    // Mark as used and log attendance
    const ticketsTable = supabase.from('tickets') as any
    const { error: updateError } = await ticketsTable
      .update({ status: 'used' })
      .eq('id', ticket.id)

    if (updateError) {
      setScanResult({ status: 'error', message: 'Failed to update ticket status.' })
      return
    }

    // Insert attendance log
    const attendanceTable = supabase.from('attendance_logs') as any
    await attendanceTable.insert({
      ticket_id: ticket.id,
      scanned_by: user.id
    })

    setScanResult({ status: 'success', message: 'Ticket Verified & Checked In!', ticket })
    setQrHash('')
  }

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await verifyTicketHash(qrHash)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanResult(null)
    setIsProcessingFile(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          
          if (code) {
            setQrHash(code.data)
            verifyTicketHash(code.data)
          } else {
            setScanResult({
              status: 'error',
              message: 'Failed to find/decode any QR code from the uploaded image. Please make sure the code is clearly visible.'
            })
          }
        } else {
          setScanResult({ status: 'error', message: 'Could not create image context for scanning.' })
        }
        setIsProcessingFile(false)
        if (fileInputRef.current) fileInputRef.current.value = '' // Clear input
      }
      img.onerror = () => {
        setScanResult({ status: 'error', message: 'Failed to load uploaded image file.' })
        setIsProcessingFile(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const roleName = (userObj as any)?.profile?.roles?.name
  const isAdmin = roleName === 'admin'
  const isAuthorized = isAdmin || (event && (event as any).organizer_id === user?.id)

  if (isUserLoading || isEventLoading) {
    return <div className="p-12 text-center animate-pulse">Loading QR Scanner...</div>
  }

  if (!user) {
    return <div className="p-12 text-center text-zinc-500">Please log in to view this page.</div>
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-800 text-center max-w-md w-full shadow-sm">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm">You are not authorized to access the scanner for this event.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">QR Scanner Simulator</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Scan event attendee tickets using manual hashes or by uploading a ticket QR code image.</p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Scan QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Manual Hash Form */}
            <form onSubmit={handleScanSubmit} className="space-y-2">
              <Label htmlFor="hash-input">Simulate camera scan with hash string</Label>
              <div className="flex gap-4">
                <Input 
                  id="hash-input"
                  type="text" 
                  placeholder="Scan or paste QR hash..." 
                  value={qrHash}
                  onChange={(e) => setQrHash(e.target.value)}
                  autoFocus
                />
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shrink-0"
                >
                  Scan
                </button>
              </div>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-400 text-xs font-semibold uppercase">Or</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>

            {/* Upload QR Image section */}
            <div className="space-y-2">
              <Label>Upload ticket QR code image</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer transition-all bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex flex-col items-center justify-center gap-3"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden"
                />
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                  <Upload className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {isProcessingFile ? 'Decoding QR...' : 'Click to upload image'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Supports PNG, JPG, JPEG or screenshots</p>
                </div>
              </div>
            </div>

            {/* Scan Results */}
            {scanResult && (
              <div className={`p-4 rounded-xl border ${
                scanResult.status === 'success' ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' :
                scanResult.status === 'used' ? 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300' :
                'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
              }`}>
                <h3 className="font-bold text-lg mb-1">{scanResult.message}</h3>
                {scanResult.ticket && (
                  <div className="text-sm space-y-1 mt-3 opacity-90">
                    <p><strong>Attendee:</strong> {scanResult.ticket.profiles?.full_name || 'Anonymous'}</p>
                    <p><strong>Ticket ID:</strong> {scanResult.ticket.id}</p>
                    <p><strong>Type:</strong> <span className="capitalize">{scanResult.ticket.ticket_type}</span></p>
                    <p><strong>Purchased:</strong> {moment(scanResult.ticket.created_at).format('MMM Do YYYY, h:mm A')}</p>
                  </div>
                )}
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
