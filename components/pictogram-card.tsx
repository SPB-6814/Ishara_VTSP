'use client'

import React from 'react'
import type { DetailedPictogram } from '@/lib/pictograms'
import {
  HeartPulse,
  Wind,
  Stethoscope,
  Activity,
  ShieldAlert,
  Sparkles,
  Droplets,
  Navigation,
  AlertTriangle,
  Sun,
  Flame,
  Utensils,
  Brain,
  CircleDot,
  Clock,
  HandMetal,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  Wind,
  Stethoscope,
  Activity,
  ShieldAlert,
  Sparkles,
  Droplets,
  Navigation,
  AlertTriangle,
  Sun,
  Flame,
  Utensils,
  Brain,
  CircleDot,
  Clock,
  HandMetal,
  CheckCircle,
}

interface PictogramCardProps {
  pictogram: DetailedPictogram
  onSelect: (pictogram: DetailedPictogram) => void
  disabled?: boolean
  selected?: boolean
}

export function PictogramCard({
  pictogram,
  onSelect,
  disabled = false,
  selected = false,
}: PictogramCardProps) {
  const IconComponent = ICON_MAP[pictogram.icon] || HelpCircle

  return (
    <button
      type="button"
      onClick={() => onSelect(pictogram)}
      disabled={disabled}
      aria-label={`${pictogram.label} - ${pictogram.description}`}
      className={`
        relative flex flex-col items-center justify-between p-4 rounded-xl border-2
        transition-all duration-150 select-none
        min-h-[110px] sm:min-h-[130px] w-full text-center
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#084C5B]
        active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none
        shadow-sm hover:shadow-md
        ${pictogram.color}
        ${selected ? 'ring-4 ring-offset-2 ring-[#084C5B] scale-[1.02]' : ''}
      `}
    >
      {/* Priority Pill */}
      {pictogram.priority === 'P0' && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-600 text-white uppercase">
          Urgent
        </span>
      )}

      {/* Icon */}
      <div className="flex-1 flex items-center justify-center my-1">
        <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
      </div>

      {/* Label and Hindi annotation */}
      <div className="w-full">
        <div className="font-bold text-base sm:text-lg leading-snug line-clamp-1">
          {pictogram.label}
        </div>
        {pictogram.hindiText && (
          <div className="text-xs sm:text-sm font-medium opacity-80 line-clamp-1 mt-0.5">
            {pictogram.hindiText}
          </div>
        )}
      </div>
    </button>
  )
}
