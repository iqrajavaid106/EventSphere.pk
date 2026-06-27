// components/events/MapPicker.tsx
'use client'

import { useState, useRef } from 'react'

interface MapPickerProps {
  defaultLat: number
  defaultLng: number
  onLocationSelect: (lat: number, lng: number) => void
}

export default function MapPicker({ defaultLat, defaultLng, onLocationSelect }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [marker, setMarker] = useState<{ x: number; y: number } | null>({ x: 120, y: 90 })
  const [coords, setCoords] = useState({ lat: defaultLat, lng: defaultLng })

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert pixel mapping to coordinate points
    const computedLat = parseFloat((defaultLat + (90 - y) * 0.01).toFixed(4))
    const computedLng = parseFloat((defaultLng + (x - 120) * 0.01).toFixed(4))

    setMarker({ x, y })
    setCoords({ lat: computedLat, lng: computedLng })
    onLocationSelect(computedLat, computedLng)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Geographical Marker Position Anchor
      </label>
      
      <div 
        ref={containerRef}
        onClick={handleMapClick}
        className="relative w-full h-48 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden cursor-crosshair group shadow-inner"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      >
        {/* Helper Center Hint text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 text-[10px] text-zinc-400 tracking-wider uppercase font-bold">
          Click canvas grid to drop anchor marker
        </div>

        {/* Dynamic Interactive Dot Marker Indicator */}
        {marker && (
          <div 
            className="absolute w-4 h-4 -ml-2 -mt-2 bg-blue-600 rounded-full border-2 border-white shadow-md animate-ping-once flex items-center justify-center"
            style={{ left: marker.x, top: marker.y }}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        )}
      </div>

      {/* Metric feedback strip */}
      <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
        <span>Latitude: <strong className="text-zinc-800 dark:text-zinc-200">{coords.lat}</strong></span>
        <span>Longitude: <strong className="text-zinc-800 dark:text-zinc-200">{coords.lng}</strong></span>
      </div>
    </div>
  )
}