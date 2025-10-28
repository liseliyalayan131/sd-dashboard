'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  icon?: React.ReactNode
  showCloseButton?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  icon,
  showCloseButton = true
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className={`relative glass-card ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden animate-scale-in`}>
        <div className="sticky top-0 z-10 p-6 flex items-center justify-between border-b border-white/10 bg-[#111118]/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 flex-1">
            {icon && (
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-blue-500/30 shrink-0">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{title}</h2>
              {description && (
                <p className="text-sm text-gray-400 truncate">{description}</p>
              )}
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors shrink-0 ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-88px)] scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  )
}
