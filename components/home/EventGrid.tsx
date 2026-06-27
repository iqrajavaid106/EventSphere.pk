import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { calculateDistance } from '@/lib/utils'
import moment from 'moment'

export default function EventGrid({ events, userLat, userLng }: { events: any[], userLat?: number, userLng?: number }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-zinc-100 p-6 dark:bg-zinc-900">
          <svg className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">No events found</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Try adjusting your filters or search criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event) => {
        let distanceStr = ''
        if (userLat && userLng && event.latitude && event.longitude) {
          const dist = calculateDistance(userLat, userLng, event.latitude, event.longitude)
          distanceStr = `${dist.toFixed(1)} km away`
        }

        return (
          <Link href={`/events/${event.id}`} key={event.id} className="group flex flex-col">
            <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-zinc-900/20 hover:-translate-y-1">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                {event.banner_url ? (
                  <img 
                    src={event.banner_url} 
                    alt={event.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    <span className="text-zinc-400 font-medium">No Image</span>
                  </div>
                )}
                
                {/* Category Badge */}
                {event.event_categories && (
                  <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-900 shadow-sm backdrop-blur-md">
                    {event.event_categories.name}
                  </div>
                )}
              </div>
              
              <CardHeader className="p-4 flex-none">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                  <time dateTime={event.start_date}>
                    {moment(event.start_date).format('MMM D, YYYY')}
                  </time>
                  <span>•</span>
                  <span>{moment(event.start_date).format('h:mm A')}</span>
                </div>
                <h3 className="line-clamp-2 text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {event.title}
                </h3>
              </CardHeader>
              
              <CardContent className="px-4 pb-4 flex-1 flex flex-col gap-3 justify-end text-sm text-zinc-500 dark:text-zinc-400">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span className="line-clamp-2">{event.location_name || 'Online Event'}</span>
                </div>
                
                {distanceStr && (
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                    </svg>
                    <span>{distanceStr}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
