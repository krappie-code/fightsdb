'use client'

import { ReactNode } from 'react'

interface TimelineProps {
  items: {
    date: string
    key: string
    content: ReactNode
  }[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Vertical line */}
      <div className="absolute left-[0.95rem] top-2 bottom-2 w-0.5 bg-zinc-800" />

      <div className="flex flex-col gap-6">
        {items.map((item) => (
          <div key={item.key} className="relative flex items-start gap-4">
            {/* Dot */}
            <div className="relative flex-shrink-0 mt-5">
              <div className="w-[0.5rem] h-[0.5rem] ml-[0.45rem] bg-red-500 rounded-full ring-[3px] ring-zinc-950" />
            </div>

            {/* Card */}
            <div className="flex-1 min-w-0">
              <p className="text-zinc-500 text-xs font-mono mb-1.5">{item.date}</p>
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
