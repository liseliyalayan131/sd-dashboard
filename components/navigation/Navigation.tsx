'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  CreditCard,
  Users,
  Package,
  FileText,
  Wrench,
  Menu,
  X,
  Sparkles,
  LogOut,
  BarChart3,
  Trash2
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { ModalBody, ModalFooter } from '@/components/ui/ModalParts'

const navigationItems = [
  {
    title: 'Anasayfa',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Hesap Takibi',
    href: '/hesap-takibi',
    icon: CreditCard,
  },
  {
    title: 'Müşteriler',
    href: '/musteriler',
    icon: Users,
  },
  {
    title: 'Stoklar',
    href: '/stoklar',
    icon: Package,
  },
  {
    title: 'İşlemler',
    href: '/islemler',
    icon: FileText,
  },
  {
    title: 'Raporlar',
    href: '/raporlar',
    icon: BarChart3,
  },
  {
    title: 'Servis',
    href: '/servis',
    icon: Wrench,
  },
]

interface NavigationProps {
  onLogout?: () => void
}

export default function Navigation({ onLogout }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState('')
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const AUTO_LOGOUT_TIME = 15 * 60 * 1000

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        handleLogout()
      }, AUTO_LOGOUT_TIME)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']

    events.forEach(event => {
      document.addEventListener(event, resetTimer)
    })

    resetTimer()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth', { method: 'DELETE' })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowResetModal(false)
    setShowConfirmModal(true)
  }

  const handleResetDatabase = async () => {
    setIsResetting(true)
    setError('')
    try {
      const response = await fetch('/api/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Tüm veriler başarıyla silindi!')
        window.location.reload()
      } else {
        setError(data.error || 'Bir hata oluştu!')
        setShowConfirmModal(false)
        setShowResetModal(true)
      }
    } catch (error) {
      setError('Bir hata oluştu!')
      setShowConfirmModal(false)
      setShowResetModal(true)
    } finally {
      setIsResetting(false)
      setAdminPassword('')
    }
  }

  const resetModals = () => {
    setShowResetModal(false)
    setShowConfirmModal(false)
    setAdminPassword('')
    setError('')
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10 animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 glass rounded-xl flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block"></span>
            </Link>

            <div className="hidden lg:flex items-center gap-2">
              {navigationItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 animate-fade-in ${
                        isActive
                          ? 'glass border border-blue-500/30 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetModal(true)}
                className="glass p-2 rounded-xl text-yellow-400 border border-white/10 hover:border-yellow-500/30 transition-all duration-200"
                title="Veritabanını Sıfırla"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="glass p-2 rounded-xl text-red-400 border border-white/10 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50"
                title="Çıkış"
              >
                {isLoggingOut ? (
                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden glass p-2 rounded-xl border border-white/10 transition-all duration-200"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-30 lg:hidden animate-fade-in">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-16 right-0 w-64 glass border-l border-white/10 h-[calc(100vh-4rem)] overflow-y-auto animate-slide-in-right">
            <div className="p-4 space-y-2">
              {navigationItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 animate-fade-in ${
                        isActive
                          ? 'glass border border-blue-500/30 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showResetModal}
        onClose={resetModals}
        title="Veritabanını Sıfırla"
        description="Bu işlem tüm verileri kalıcı olarak silecektir"
        icon={<Trash2 className="w-6 h-6 text-yellow-400" />}
        size="sm"
      >
        <form onSubmit={handlePasswordSubmit}>
          <ModalBody>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Admin Şifresi</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-glass w-full"
                placeholder="Şifreyi girin"
                required
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={resetModals}
              className="glass-button btn-secondary flex-1"
            >
              İptal
            </button>
            <button
              type="submit"
              className="glass-button btn-primary flex-1"
            >
              Devam Et
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={resetModals}
        title="Son Uyarı!"
        description="Bu işlem geri alınamaz"
        icon={<Trash2 className="w-6 h-6 text-red-400" />}
        size="sm"
      >
        <ModalBody>
          <div className="space-y-3">
            <p className="text-gray-300">Aşağıdaki tüm veriler kalıcı olarak silinecek:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Tüm müşteriler</li>
              <li>Tüm ürünler ve stok bilgileri</li>
              <li>Tüm satış işlemleri</li>
              <li>Tüm servis kayıtları</li>
              <li>Tüm alacak/verecek kayıtları</li>
            </ul>
            <div className="glass-card border border-red-500/30 p-4 rounded-xl">
              <p className="text-red-400 font-bold text-center">Bu işlem geri alınamaz!</p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            onClick={resetModals}
            disabled={isResetting}
            className="glass-button btn-secondary flex-1"
          >
            İptal
          </button>
          <button
            onClick={handleResetDatabase}
            disabled={isResetting}
            className="glass-button bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 flex-1 disabled:opacity-50"
          >
            {isResetting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                Siliniyor...
              </div>
            ) : (
              'Tüm Verileri Sil'
            )}
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}
