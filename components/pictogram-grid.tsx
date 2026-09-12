'use client'

import React, { useState } from 'react'
import { PictogramCard } from './pictogram-card'
import { PainScale } from './pain-scale'
import {
  EMERGENCY_P0_PICTOGRAMS,
  ALL_CATEGORY_PICTOGRAMS,
  type DetailedPictogram,
} from '@/lib/pictograms'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface PictogramGridProps {
  onTriggerAlert: (pictogram: DetailedPictogram, extraNote?: string) => void
  disabled?: boolean
}

export function PictogramGrid({ onTriggerAlert, disabled = false }: PictogramGridProps) {
  const [activeTab, setActiveTab] = useState('emergency')
  const [painScaleOpen, setPainScaleOpen] = useState(false)
  const [lastTappedKey, setLastTappedKey] = useState<string | null>(null)

  const handlePictogramSelect = (pictogram: DetailedPictogram) => {
    setLastTappedKey(pictogram.key)

    if (pictogram.key === 'pain-level') {
      setPainScaleOpen(true)
      return
    }

    onTriggerAlert(pictogram)
  }

  const handlePainScaleSubmit = (level: number, label: string) => {
    const painPictogram = EMERGENCY_P0_PICTOGRAMS.find((p) => p.key === 'pain-level')!
    onTriggerAlert(painPictogram, `Pain Level: ${level}/10 (${label})`)
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-13 sm:h-14 p-1.5 rounded-2xl bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700/80 gap-1.5 sm:gap-2 shadow-inner">
          <TabsTrigger
            value="emergency"
            className="rounded-xl text-xs sm:text-sm font-black transition-all border shadow-xs h-full bg-white/80 dark:bg-slate-900/60 border-slate-300/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white data-active:!bg-red-600 data-active:!text-white data-active:!border-red-600 data-active:!shadow-md data-[state=active]:!bg-red-600 data-[state=active]:!text-white after:hidden"
          >
            🚨 Emergency (P0)
          </TabsTrigger>
          <TabsTrigger
            value="basic"
            className="rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-xs h-full bg-white/80 dark:bg-slate-900/60 border-slate-300/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white data-active:!bg-[#084C5B] data-active:!text-white data-active:!border-[#084C5B] data-active:!shadow-md data-[state=active]:!bg-[#084C5B] data-[state=active]:!text-white after:hidden"
          >
            Needs / जरूरतें
          </TabsTrigger>
          <TabsTrigger
            value="pain"
            className="rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-xs h-full bg-white/80 dark:bg-slate-900/60 border-slate-300/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white data-active:!bg-amber-600 data-active:!text-white data-active:!border-amber-600 data-active:!shadow-md data-[state=active]:!bg-amber-600 data-[state=active]:!text-white after:hidden"
          >
            Pain / दर्द
          </TabsTrigger>
          <TabsTrigger
            value="allergies"
            className="rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-xs h-full bg-white/80 dark:bg-slate-900/60 border-slate-300/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white data-active:!bg-purple-600 data-active:!text-white data-active:!border-purple-600 data-active:!shadow-md data-[state=active]:!bg-purple-600 data-[state=active]:!text-white after:hidden"
          >
            Allergies / एलर्जी
          </TabsTrigger>
        </TabsList>

        {/* Emergency P0 Grid (3x3 on tablets) */}
        <TabsContent value="emergency" className="mt-2 outline-none">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {EMERGENCY_P0_PICTOGRAMS.map((item) => (
              <PictogramCard
                key={item.key}
                pictogram={item}
                onSelect={handlePictogramSelect}
                disabled={disabled}
                selected={lastTappedKey === item.key}
              />
            ))}
          </div>
        </TabsContent>

        {/* Basic Needs Grid */}
        <TabsContent value="basic" className="mt-2 outline-none">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {ALL_CATEGORY_PICTOGRAMS['Basic Needs'].map((item) => (
              <PictogramCard
                key={item.key}
                pictogram={item}
                onSelect={handlePictogramSelect}
                disabled={disabled}
                selected={lastTappedKey === item.key}
              />
            ))}
          </div>
        </TabsContent>

        {/* Pain Grid */}
        <TabsContent value="pain" className="mt-2 outline-none">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {ALL_CATEGORY_PICTOGRAMS['Pain'].map((item) => (
              <PictogramCard
                key={item.key}
                pictogram={item}
                onSelect={handlePictogramSelect}
                disabled={disabled}
                selected={lastTappedKey === item.key}
              />
            ))}
          </div>
        </TabsContent>

        {/* Allergies Grid */}
        <TabsContent value="allergies" className="mt-2 outline-none">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {ALL_CATEGORY_PICTOGRAMS['Allergies'].map((item) => (
              <PictogramCard
                key={item.key}
                pictogram={item}
                onSelect={handlePictogramSelect}
                disabled={disabled}
                selected={lastTappedKey === item.key}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pain scale dialog modal */}
      <PainScale
        open={painScaleOpen}
        onOpenChange={setPainScaleOpen}
        onSubmit={handlePainScaleSubmit}
      />
    </div>
  )
}
