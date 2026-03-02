'use client'

import { ReactNode } from 'react'

interface TimelineItemProps {
  date: string
  side: 'left' | 'right'
  children: ReactNode
}

function TimelineItem({ date, side, children }: TimelineItemProps) {
  return (
    <div className={`relative flex items-start gap-4 md:gap-8 ${side === 'right' ? 'md:flex-row-reverse' : ''}`}>
      {/* Connector dot */}
      <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-6 w-3 h-3 bg-red-500 rounded-full z-10 ring-4 ring-zinc-950" />

      {/* Date label - visible on md+ */}
      <div className={`hidden md:block w-[calc(50%-2rem)] flex-shrink-0 ${side === 'left' ? 'text-right' : 'text-left'}`}>
        <p className="text-zinc-500 text-sm font-mono mt-5">{date}</p>
      </div>

      {/* Card */}
      <div className="ml-10 md:ml-0 md:w-[calc(50%-2rem)] flex-shrink-0">
        {/* Mobile date */}
        <p className="text-zinc-500 text-xs font-mono mb-1 md:hidden">{date}</p>
        {children}
      </div>
    </div>
  )
}

interface TimelineProps {
  items: {
    date: string
    key: string
    content: ReactNode
  }[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[1.3rem] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-zinc-800" />

      <div className="flex flex-col gap-6">
        {items.map((item, i) => (
          <TimelineItem
            key={item.key}
            date={item.date}
            side={i % 2 === 0 ? 'left' : 'right'}
          >
            {item.content}
          </TimelineItem>
        ))}
      </div>
    </div>
  )
}
