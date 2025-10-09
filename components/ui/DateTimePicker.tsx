'use client'

import { useState } from 'react'
import { Calendar, Clock, X } from 'lucide-react'
import Modal from './Modal'
import { ModalBody, ModalFooter } from './ModalParts'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export default function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(value || '')

  const formatToLocalDateTime = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const quickOptions = [
    {
      label: '30 Dakika Sonra',
      getValue: () => {
        const date = new Date()
        date.setMinutes(date.getMinutes() + 30)
        return formatToLocalDateTime(date)
      }
    },
    {
      label: '1 Saat Sonra',
      getValue: () => {
        const date = new Date()
        date.setHours(date.getHours() + 1)
        return formatToLocalDateTime(date)
      }
    },
    {
      label: '3 Saat Sonra',
      getValue: () => {
        const date = new Date()
        date.setHours(date.getHours() + 3)
        return formatToLocalDateTime(date)
      }
    },
    {
      label: 'Yarın',
      getValue: () => {
        const date = new Date()
        date.setDate(date.getDate() + 1)
        date.setHours(9, 0, 0, 0)
        return formatToLocalDateTime(date)
      }
    },
    {
      label: '3 Gün Sonra',
      getValue: () => {
        const date = new Date()
        date.setDate(date.getDate() + 3)
        date.setHours(9, 0, 0, 0)
        return formatToLocalDateTime(date)
      }
    },
    {
      label: '1 Hafta Sonra',
      getValue: () => {
        const date = new Date()
        date.setDate(date.getDate() + 7)
        date.setHours(9, 0, 0, 0)
        return formatToLocalDateTime(date)
      }
    },
    {
      label: '1 Ay Sonra',
      getValue: () => {
        const date = new Date()
        date.setMonth(date.getMonth() + 1)
        date.setHours(9, 0, 0, 0)
        return formatToLocalDateTime(date)
      }
    }
  ]

  const handleQuickSelect = (getValue: () => string) => {
    const newValue = getValue()
    setSelectedDate(newValue)
  }

  const handleConfirm = () => {
    onChange(selectedDate)
    setShowModal(false)
  }

  const handleClear = () => {
    setSelectedDate('')
    onChange('')
    setShowModal(false)
  }

  const handleCancel = () => {
    setSelectedDate(value || '')
    setShowModal(false)
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Hatırlatıcı ekle'
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        )}
        
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setSelectedDate(value || '')
              setShowModal(true)
            }}
            className="w-full input-glass flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={value ? 'text-white' : 'text-gray-400'}>
                {formatDisplayDate(value)}
              </span>
            </div>
          </button>
          {value && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title="Hatırlatıcı Tarihi"
        description="Tarih ve saat seçin"
        icon={<Calendar className="w-6 h-6 text-blue-400" />}
        size="md"
      >
        <ModalBody>
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hızlı Seçim
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quickOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleQuickSelect(option.getValue)}
                    className={`glass px-4 py-3 rounded-xl text-sm transition-all ${
                      selectedDate === option.getValue()
                        ? 'border-blue-500/50 text-blue-400'
                        : 'text-gray-300 hover:text-white hover:border-blue-500/30 border-white/10'
                    } border`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Manuel Tarih Seçimi
              </div>
              <input
                type="datetime-local"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-glass w-full"
              />
            </div>

            {selectedDate && (
              <div className="glass-card border border-blue-500/30 p-4 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">Seçili Tarih:</div>
                <div className="text-lg font-bold text-blue-400">
                  {formatDisplayDate(selectedDate)}
                </div>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 glass-button bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
          >
            Temizle
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 glass-button btn-secondary"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 glass-button btn-primary"
          >
            Kaydet
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}
