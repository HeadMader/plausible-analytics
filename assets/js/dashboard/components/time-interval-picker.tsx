import React, { useState, useRef, useEffect } from 'react'
import { useAppNavigate } from '../navigation/use-app-navigate'
import { notifyIntervalChange } from '../util/realtime-update-timer'

interface TimeIntervalOption {
  value: string
  label: string
}

const TIME_INTERVAL_OPTIONS: TimeIntervalOption[] = [
  { value: '60', label: '1min' },
  { value: '30', label: '30s' },
  { value: '20', label: '20s' },
  { value: '10', label: '10s' },
  { value: '5', label: '5s' }
]

export function TimeIntervalPicker() {
  const navigate = useAppNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) 
        setIsOpen(false)
    }

    if (isOpen) 
      document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (value: string) => {
    navigate({
      search: (currentSearch) => ({
        ...currentSearch,
        interval: value
      })
    })
    setIsOpen(false)

    notifyIntervalChange()
  }

  const getCurrentIntervalLabel = () => {
    const params = new URLSearchParams(window.location.search)
    const currentInterval = params.get('interval')
    const selected = TIME_INTERVAL_OPTIONS.find(option => option.value === currentInterval)
    return selected?.label || 'Interval'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 rounded p-2"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {getCurrentIntervalLabel()}
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20">
          <div className="py-1">
            {TIME_INTERVAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}