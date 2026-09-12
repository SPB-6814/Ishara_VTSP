'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PainScaleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (level: number, label: string) => void
}

const PAIN_LEVELS = [
  { level: 1, emoji: '😊', label: 'Very Mild', color: 'bg-emerald-100 border-emerald-400 text-emerald-800' },
  { level: 2, emoji: '🙂', label: 'Discomfort', color: 'bg-emerald-100 border-emerald-400 text-emerald-800' },
  { level: 3, emoji: '😐', label: 'Tolerable', color: 'bg-lime-100 border-lime-400 text-lime-800' },
  { level: 4, emoji: '🙁', label: 'Distressing', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { level: 5, emoji: '😟', label: 'Moderate', color: 'bg-amber-100 border-amber-400 text-amber-800' },
  { level: 6, emoji: '😣', label: 'Severe', color: 'bg-amber-200 border-amber-500 text-amber-900' },
  { level: 7, emoji: '😖', label: 'Very Severe', color: 'bg-orange-100 border-orange-500 text-orange-900' },
  { level: 8, emoji: '😫', label: 'Intense', color: 'bg-orange-200 border-orange-600 text-orange-900' },
  { level: 9, emoji: '😭', label: 'Excruciating', color: 'bg-red-100 border-red-500 text-red-800' },
  { level: 10, emoji: '😱', label: 'Unbearable', color: 'bg-red-200 border-red-600 text-red-900 font-bold' },
]

export function PainScale({ open, onOpenChange, onSubmit }: PainScaleProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  const handleSelect = (item: typeof PAIN_LEVELS[0]) => {
    setSelectedLevel(item.level)
    onSubmit(item.level, item.label)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-[#084C5B] dark:text-teal-300">
            Pain Scale Rating / दर्द का स्तर
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-300">
            Tap the number that matches how much pain you feel right now.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-2 sm:gap-3 my-4">
          {PAIN_LEVELS.map((item) => (
            <button
              key={item.level}
              type="button"
              onClick={() => handleSelect(item)}
              className={`
                flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2
                transition-all min-h-[85px] sm:min-h-[105px]
                active:scale-95 focus-visible:ring-2 focus-visible:ring-[#084C5B]
                ${item.color}
                ${selectedLevel === item.level ? 'ring-4 ring-[#084C5B]' : ''}
              `}
            >
              <span className="text-2xl sm:text-3xl mb-1">{item.emoji}</span>
              <span className="text-lg sm:text-xl font-black">{item.level}</span>
              <span className="text-[10px] sm:text-xs font-semibold leading-tight text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
