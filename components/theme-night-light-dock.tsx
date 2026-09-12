'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Sunset } from 'lucide-react'

export function ThemeNightLightDock() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [nightLight, setNightLight] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const storedNightLight = localStorage.getItem('ishara-night-light') === 'true'
    setNightLight(storedNightLight)
    if (storedNightLight) {
      document.documentElement.classList.add('night-light')
    } else {
      document.documentElement.classList.remove('night-light')
    }
  }, [])

  const toggleNightLight = () => {
    const nextState = !nightLight
    setNightLight(nextState)
    if (nextState) {
      document.documentElement.classList.add('night-light')
      localStorage.setItem('ishara-night-light', 'true')
    } else {
      document.documentElement.classList.remove('night-light')
      localStorage.setItem('ishara-night-light', 'false')
    }
  }

  const handleSelectTheme = (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode)
  }

  if (!mounted) {
    return null
  }

  return (
    <aside
      aria-label="Display Controls"
      className="fixed bottom-3.5 left-3.5 sm:bottom-4 sm:left-4 z-50 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-lg shadow-slate-900/10 dark:shadow-black/50 transition-all hover:scale-[1.02]"
    >
      {/* 3-State Theme Switcher (Light / Dark / System) */}
      <div
        role="radiogroup"
        aria-label="Theme mode"
        className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
      >
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'light'}
          title="Switch to Light Mode"
          aria-label="Light Mode"
          onClick={() => handleSelectTheme('light')}
          className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
            theme === 'light'
              ? 'bg-white text-amber-600 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={theme === 'dark'}
          title="Switch to Dark Mode"
          aria-label="Dark Mode"
          onClick={() => handleSelectTheme('dark')}
          className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-slate-950 text-indigo-400 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={theme === 'system'}
          title="Match System Preference"
          aria-label="System Theme"
          onClick={() => handleSelectTheme('system')}
          className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-950 text-teal-600 dark:text-teal-400 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Divider */}
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

      {/* Blue Light Cut / Night Light Filter Toggle */}
      <button
        type="button"
        onClick={toggleNightLight}
        aria-pressed={nightLight}
        title={
          nightLight
            ? 'Night Light is ON: Blue light cut active for night shifts'
            : 'Night Light is OFF: Click to reduce blue light glare'
        }
        aria-label="Toggle Night Light (Blue light filter)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
          nightLight
            ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400'
        }`}
      >
        <Sunset className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px] font-semibold">Night Light</span>
        {nightLight && (
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
        )}
      </button>
    </aside>
  )
}
