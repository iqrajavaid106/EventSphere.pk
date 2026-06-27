"use client"

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function TicketQR({ data }: { data: string }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    QRCode.toDataURL(data, {
      width: 250,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setSrc(url))
      .catch(err => console.error(err))
  }, [data])

  if (!src) return <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />

  return (
    <img src={src} alt="Ticket QR Code" className="rounded-lg w-full h-full object-contain" />
  )
}
