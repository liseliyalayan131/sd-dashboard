'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({ value, onChange, options, placeholder, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-glass w-full flex items-center justify-between gap-2"
      >
        <span className="text-sm truncate">
          {selectedOption?.label || placeholder || 'Seçin'}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 glass rounded-xl border border-white/10 shadow-2xl z-50 animate-scale-in max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between first:rounded-t-xl last:rounded-b-xl ${
                value === option.value
                  ? 'bg-blue-950/50 text-blue-400'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
