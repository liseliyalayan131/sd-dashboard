'use client'

import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
  confirmText?: string
  isLoading?: boolean
}

export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onClose,
  confirmText = 'Sil',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

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
      <div className="relative glass-card p-6 max-w-md w-full animate-scale-in">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-950/50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="glass-button btn-secondary"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="glass-button bg-red-600 hover:bg-red-700 text-white border-none flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
