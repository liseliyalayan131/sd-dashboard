'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginPage from '@/components/LoginPage'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth')
      const data = await response.json()
      
      if (data.authenticated) {
        router.push('/dashboard')
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl ios-shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return null
}
