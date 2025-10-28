'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Wrench, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  Phone,
  Bell
} from 'lucide-react'
import Link from 'next/link'
import { useRefreshStore } from '@/store/useRefreshStore'

interface DashboardStats {
  totalCustomers: number
  totalProducts: number
  lowStockProducts: number
  todaySales: number
  pendingServices: number
  totalTransactions: number
  recentTransactions: any[]
  lowStockItems: any[]
  pendingServicesList: any[]
  upcomingReceivables: any[]
  longWaitingServices: any[]
  stockAlerts: any[]
}

export default function DashboardContent() {
  const { shouldRefreshCustomers, shouldRefreshProducts, resetCustomersRefresh, resetProductsRefresh } = useRefreshStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    todaySales: 0,
    pendingServices: 0,
    totalTransactions: 0,
    recentTransactions: [],
    lowStockItems: [],
    pendingServicesList: [],
    upcomingReceivables: [],
    longWaitingServices: [],
    stockAlerts: []
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [userName] = useState('Admin')

  useEffect(() => {
    fetchDashboardData()
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (shouldRefreshCustomers || shouldRefreshProducts) {
      fetchDashboardData()
      if (shouldRefreshCustomers) resetCustomersRefresh()
      if (shouldRefreshProducts) resetProductsRefresh()
    }
  }, [shouldRefreshCustomers, shouldRefreshProducts])

  const fetchDashboardData = async () => {
    try {
      const [customersRes, productsRes, transactionsRes, servicesRes, receivablesRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products'),
        fetch('/api/transactions'),
        fetch('/api/services'),
        fetch('/api/receivables')
      ])

      const customers = customersRes.ok ? await customersRes.json() : []
      const products = productsRes.ok ? await productsRes.json() : []
      const transactions = transactionsRes.ok ? await transactionsRes.json() : []
      const services = servicesRes.ok ? await servicesRes.json() : []
      const receivables = receivablesRes.ok ? await receivablesRes.json() : []

      const today = new Date().toDateString()
      const todayTransactions = transactions.filter((t: any) => 
        new Date(t.createdAt).toDateString() === today && t.type === 'satis'
      )
      const todaySales = todayTransactions.reduce((sum: number, t: any) => sum + t.totalPrice, 0)

      const lowStockItems = products.filter((p: any) => p.stock <= p.minStock).slice(0, 5)
      const pendingServicesList = services
        .filter((s: any) => s.status === 'beklemede' || s.status === 'devam-ediyor')
        .slice(0, 5)

      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      
      const upcomingReceivables = receivables
        .filter((r: any) => {
          if (!r.dueDate || r.status === 'odendi') return false
          const dueDate = new Date(r.dueDate)
          return dueDate <= sevenDaysFromNow && dueDate >= new Date()
        })
        .slice(0, 5)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const longWaitingServices = services
        .filter((s: any) => {
          if (s.status === 'cozuldu' || s.status === 'cozulmedi') return false
          const receivedDate = new Date(s.receivedDate)
          return receivedDate <= thirtyDaysAgo
        })
        .slice(0, 5)

      const stockAlerts = products
        .filter((p: any) => p.stock > 0 && p.stock <= p.minStock)
        .map((p: any) => {
          const salesLast30Days = transactions.filter((t: any) => {
            const transactionDate = new Date(t.createdAt)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return t.productCode === p.code && transactionDate >= thirtyDaysAgo && t.type === 'satis'
          }).reduce((sum: number, t: any) => sum + t.quantity, 0)
          
          const dailySales = salesLast30Days / 30
          const daysUntilEmpty = dailySales > 0 ? Math.floor(p.stock / dailySales) : 999
          
          return {
            ...p,
            daysUntilEmpty,
            avgDailySales: dailySales.toFixed(2)
          }
        })
        .filter((p: any) => p.daysUntilEmpty < 14)
        .slice(0, 5)

      setStats({
        totalCustomers: customers.length,
        totalProducts: products.length,
        lowStockProducts: products.filter((p: any) => p.stock <= p.minStock).length,
        todaySales,
        pendingServices: services.filter((s: any) => 
          s.status === 'beklemede' || s.status === 'devam-ediyor'
        ).length,
        totalTransactions: transactions.length,
        recentTransactions: transactions.slice(0, 5),
        lowStockItems,
        pendingServicesList,
        upcomingReceivables,
        longWaitingServices,
        stockAlerts
      })
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTodaySummary = () => {
    const pendingCount = stats.pendingServices
    const lowStockCount = stats.lowStockProducts
    const upcomingCount = stats.upcomingReceivables.length
    
    if (pendingCount === 0 && lowStockCount === 0 && upcomingCount === 0) {
      return 'Her şey yolunda! ✨'
    }
    
    const messages = []
    if (pendingCount > 0) messages.push(`${pendingCount} bekleyen servis`)
    if (lowStockCount > 0) messages.push(`${lowStockCount} düşük stok`)
    if (upcomingCount > 0) messages.push(`${upcomingCount} yaklaşan ödeme`)
    
    return messages.join(', ') + ' var'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="glass-card ios-shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Hoşgeldin, {userName}! 👋
            </h1>
            <p className="text-gray-400 text-lg">{getTodaySummary()}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-400">{formatTime(currentTime)}</div>
            <div className="text-sm text-gray-400 mt-1">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {(stats.upcomingReceivables.length > 0 || stats.longWaitingServices.length > 0 || stats.stockAlerts.length > 0) && (
        <div className="glass-card ios-shadow p-6 border-2 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-6 h-6 text-yellow-400 animate-gentle-pulse" />
            <h2 className="text-xl font-bold text-yellow-400">Bildirimler & Uyarılar</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.upcomingReceivables.length > 0 && (
              <div className="glass rounded-xl p-4 border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-white">Vadesi Yaklaşan ({stats.upcomingReceivables.length})</h3>
                </div>
                <div className="space-y-2">
                  {stats.upcomingReceivables.map((r: any) => (
                    <div key={r._id} className="text-sm">
                      <div className="text-white font-medium">{r.customerName}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {new Date(r.dueDate).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="text-red-400 font-bold">{formatCurrency(r.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.longWaitingServices.length > 0 && (
              <div className="glass rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold text-white">Uzun Bekleyen ({stats.longWaitingServices.length})</h3>
                </div>
                <div className="space-y-2">
                  {stats.longWaitingServices.map((s: any) => (
                    <div key={s._id} className="text-sm">
                      <div className="text-white font-medium">{s.brand} {s.model}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{s.customerName}</span>
                        <span className="text-orange-400">
                          {Math.floor((new Date().getTime() - new Date(s.receivedDate).getTime()) / (1000 * 60 * 60 * 24))} gün
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.stockAlerts.length > 0 && (
              <div className="glass rounded-xl p-4 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold text-white">Stok Bitmek Üzere ({stats.stockAlerts.length})</h3>
                </div>
                <div className="space-y-2">
                  {stats.stockAlerts.map((p: any) => (
                    <div key={p._id} className="text-sm">
                      <div className="text-white font-medium">{p.name}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{p.stock} {p.unit} kaldı</span>
                        <span className="text-yellow-400">~{p.daysUntilEmpty} gün</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/musteriler">
          <div className="glass-card ios-shadow p-6 hover:border-blue-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-blue-500/30">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Toplam Müşteri</h3>
            <p className="text-3xl font-bold text-blue-400 mt-2">{stats.totalCustomers}</p>
          </div>
        </Link>

        <Link href="/stoklar">
          <div className="glass-card ios-shadow p-6 hover:border-green-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-green-500/30">
                <Package className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Toplam Ürün</h3>
            <p className="text-3xl font-bold text-green-400 mt-2">{stats.totalProducts}</p>
          </div>
        </Link>

        <Link href="/islemler">
          <div className="glass-card ios-shadow p-6 hover:border-purple-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-purple-500/30">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Bugünkü Satış</h3>
            <p className="text-3xl font-bold text-purple-400 mt-2">{formatCurrency(stats.todaySales)}</p>
          </div>
        </Link>

        <Link href="/stoklar">
          <div className="glass-card ios-shadow p-6 hover:border-red-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Düşük Stok Uyarısı</h3>
            <p className="text-3xl font-bold text-red-400 mt-2">{stats.lowStockProducts}</p>
          </div>
        </Link>

        <Link href="/servis">
          <div className="glass-card ios-shadow p-6 hover:border-yellow-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-yellow-500/30">
                <Wrench className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Bekleyen Servis</h3>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.pendingServices}</p>
          </div>
        </Link>

        <Link href="/raporlar">
          <div className="glass-card ios-shadow p-6 hover:border-cyan-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-cyan-500/30">
                <ShoppingCart className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Toplam İşlem</h3>
            <p className="text-3xl font-bold text-cyan-400 mt-2">{stats.totalTransactions}</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card ios-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
              Son İşlemler
            </h2>
            <Link href="/raporlar" className="text-sm text-blue-400 hover:text-blue-300">
              Tümünü Gör
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((transaction: any) => (
                <div key={transaction._id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass rounded-lg flex items-center justify-center border border-blue-500/30">
                      <Package className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{transaction.productName}</div>
                      <div className="text-xs text-gray-400">{transaction.customerName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${transaction.type === 'satis' ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(transaction.totalPrice)}
                    </div>
                    <div className="text-xs text-gray-400">{formatDateShort(transaction.createdAt)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                Henüz işlem yok
              </div>
            )}
          </div>
        </div>

        <div className="glass-card ios-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              Düşük Stok Uyarısı
            </h2>
            <Link href="/stoklar" className="text-sm text-red-400 hover:text-red-300">
              Tümünü Gör
            </Link>
          </div>

          <div className="space-y-4">
            {stats.lowStockItems.length > 0 ? (
              stats.lowStockItems.map((product: any) => (
                <div key={product._id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass rounded-lg flex items-center justify-center border border-red-500/30">
                      <Package className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{product.name}</div>
                      <div className="text-xs text-gray-400">{product.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-400">
                      {product.stock} {product.unit}
                    </div>
                    <div className="text-xs text-gray-400">Min: {product.minStock}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                Düşük stok yok
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card ios-shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="w-6 h-6 text-yellow-400" />
            Bekleyen Servisler
          </h2>
          <Link href="/servis" className="text-sm text-yellow-400 hover:text-yellow-300">
            Tümünü Gör
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.pendingServicesList.length > 0 ? (
            stats.pendingServicesList.map((service: any) => (
              <div key={service._id} className="glass rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 glass rounded-lg flex items-center justify-center border border-yellow-500/30">
                    <Wrench className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{service.brand} {service.model}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {service.customerPhone}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-300 line-clamp-2 mb-2">{service.problem}</div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    service.status === 'beklemede' 
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {service.status === 'beklemede' ? 'Beklemede' : 'Devam Ediyor'}
                  </span>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateShort(service.receivedDate)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-400">
              Bekleyen servis yok
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
