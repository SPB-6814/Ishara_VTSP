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
        <TabsList className="w-full grid grid-cols-4 h-12 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger
            value="emergency"
            className="text-xs sm:text-sm font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all"
          >
            🚨 Emergency (P0)
          </TabsTrigger>
          <TabsTrigger
            value="basic"
            className="text-xs sm:text-sm font-semibold data-[state=active]:bg-[#084C5B] data-[state=active]:text-white"
          >
            Needs / जरूरतें
          </TabsTrigger>
          <TabsTrigger
            value="pain"
            className="text-xs sm:text-sm font-semibold data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            Pain / दर्द
          </TabsTrigger>
          <TabsTrigger
            value="allergies"
            className="text-xs sm:text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white"
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
