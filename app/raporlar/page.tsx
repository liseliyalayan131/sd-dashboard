'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation/Navigation'
import { useRefreshStore } from '@/store/useRefreshStore'
import CustomSelect from '@/components/ui/CustomSelect'
import Modal from '@/components/ui/Modal'
import { ModalBody, ModalFooter } from '@/components/ui/ModalParts'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Wrench,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  AlertCircle,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react'

interface ReportData {
  sales: {
    total: number
    count: number
    revenue: number
    cost: number
    profit: number
    profitMargin: number
  }
  services: {
    total: number
    revenue: number
    profit: number
    avgTicket: number
  }
  customers: {
    total: number
    newCustomers: number
    topCustomers: any[]
  }
  products: {
    total: number
    lowStock: number
    topSelling: any[]
    stockValue: number
  }
  payments: {
    cash: number
    card: number
    transfer: number
  }
  comparison: {
    salesGrowth: number
    revenueGrowth: number
    profitGrowth: number
  }
}

export default function RaporlarPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reportPeriod, setReportPeriod] = useState<string>('month')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [showProfitModal, setShowProfitModal] = useState(false)
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [showCostModal, setShowCostModal] = useState(false)
  const [detailedTransactions, setDetailedTransactions] = useState<any[]>([])
  const [detailedServices, setDetailedServices] = useState<any[]>([])

  const { 
    shouldRefreshReports, 
    shouldRefreshTransactions,
    shouldRefreshServices,
    shouldRefreshCustomers,
    shouldRefreshProducts,
    resetReportsRefresh,
    resetTransactionsRefresh,
    resetServicesRefresh,
    resetCustomersRefresh,
    resetProductsRefresh
  } = useRefreshStore()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchReportData()
    }
  }, [isAuthenticated, reportPeriod, customStartDate, customEndDate])

  useEffect(() => {
    if (shouldRefreshReports || shouldRefreshTransactions || shouldRefreshServices || shouldRefreshCustomers || shouldRefreshProducts) {
      fetchReportData()
      resetReportsRefresh()
      resetTransactionsRefresh()
      resetServicesRefresh()
      resetCustomersRefresh()
      resetProductsRefresh()
    }
  }, [shouldRefreshReports, shouldRefreshTransactions, shouldRefreshServices, shouldRefreshCustomers, shouldRefreshProducts])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth')
      const data = await response.json()
      
      if (!data.authenticated) {
        router.push('/')
      } else {
        setIsAuthenticated(true)
      }
    } catch (error) {
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReportData = async () => {
    setIsLoading(true)
    try {
      const [transactionsRes, servicesRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/transactions', { cache: 'no-store' }),
        fetch('/api/services', { cache: 'no-store' }),
        fetch('/api/customers', { cache: 'no-store' }),
        fetch('/api/products', { cache: 'no-store' })
      ])

      const transactions = transactionsRes.ok ? await transactionsRes.json() : []
      const services = servicesRes.ok ? await servicesRes.json() : []
      const customers = customersRes.ok ? await customersRes.json() : []
      const products = productsRes.ok ? await productsRes.json() : []

      const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange()

      const currentTransactions = filterByDateRange(transactions, startDate, endDate)
      const prevTransactions = filterByDateRange(transactions, prevStartDate, prevEndDate)
      const currentServices = filterByDateRange(services, startDate, endDate)
      const currentCustomers = filterByDateRange(customers, startDate, endDate)

      const salesData = calculateSalesData(currentTransactions, products)
      const servicesData = calculateServicesData(currentServices)
      const customersData = calculateCustomersData(customers, currentCustomers, currentTransactions)
      const productsData = calculateProductsData(products, currentTransactions)
      const paymentsData = calculatePaymentsData(currentTransactions)
      const comparisonData = calculateComparison(currentTransactions, prevTransactions, products)

      setDetailedTransactions(currentTransactions)
      setDetailedServices(currentServices)
      
      setReportData({
        sales: salesData,
        services: servicesData,
        customers: customersData,
        products: productsData,
        payments: paymentsData,
        comparison: comparisonData
      })
    } catch (error) {
      console.error('Rapor verileri alınamadı:', error)
      setReportData({
        sales: { total: 0, count: 0, revenue: 0, cost: 0, profit: 0, profitMargin: 0 },
        services: { total: 0, revenue: 0, profit: 0, avgTicket: 0 },
        customers: { total: 0, newCustomers: 0, topCustomers: [] },
        products: { total: 0, lowStock: 0, topSelling: [], stockValue: 0 },
        payments: { cash: 0, card: 0, transfer: 0 },
        comparison: { salesGrowth: 0, revenueGrowth: 0, profitGrowth: 0 }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()
    let prevStartDate = new Date()
    let prevEndDate = new Date()

    if (reportPeriod === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
      const duration = endDate.getTime() - startDate.getTime()
      prevEndDate = new Date(startDate.getTime() - 1)
      prevStartDate = new Date(prevEndDate.getTime() - duration)
    } else {
      switch (reportPeriod) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
          prevEndDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          const dayOfWeek = now.getDay()
          startDate.setDate(now.getDate() - dayOfWeek)
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          prevEndDate = new Date(startDate.getTime() - 1)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate.setHours(23, 59, 59, 999)
          prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate.setHours(23, 59, 59, 999)
          prevStartDate = new Date(now.getFullYear() - 1, 0, 1)
          prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
          break
      }
    }

    return { startDate, endDate, prevStartDate, prevEndDate }
  }

  const filterByDateRange = (items: any[], startDate: Date, endDate: Date) => {
    return items.filter(item => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  const calculateSalesData = (transactions: any[], products: any[]) => {
    const sales = transactions.filter(t => t.type === 'satis')
    const returns = transactions.filter(t => t.type === 'iade')
    
    const salesRevenue = sales.reduce((sum, t) => sum + t.totalPrice, 0)
    const returnsRevenue = returns.reduce((sum, t) => sum + t.totalPrice, 0)
    const revenue = salesRevenue - returnsRevenue
    
    let cost = 0
    sales.forEach(sale => {
      const product = products.find(p => p.code === sale.productCode)
      if (product) {
        cost += product.costPrice * sale.quantity
      }
    })

    const profit = revenue - cost
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

    return {
      total: sales.length,
      count: sales.length - returns.length,
      revenue,
      cost,
      profit,
      profitMargin
    }
  }

  const calculateServicesData = (services: any[]) => {
    const revenue = services.reduce((sum, s) => sum + s.totalCost, 0)
    const profit = services.reduce((sum, s) => sum + s.laborCost, 0)
    const avgTicket = services.length > 0 ? revenue / services.length : 0

    return {
      total: services.length,
      revenue,
      profit,
      avgTicket
    }
  }

  const calculateCustomersData = (allCustomers: any[], newCustomers: any[], transactions: any[]) => {
    const customerSpending: { [key: string]: { name: string, total: number } } = {}
    
    transactions.forEach(t => {
      if (t.type === 'satis') {
        if (!customerSpending[t.customerPhone]) {
          customerSpending[t.customerPhone] = { name: t.customerName, total: 0 }
        }
        customerSpending[t.customerPhone].total += t.totalPrice
      }
    })

    const topCustomers = Object.entries(customerSpending)
      .map(([phone, data]) => ({ phone, name: data.name, total: data.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return {
      total: allCustomers.length,
      newCustomers: newCustomers.length,
      topCustomers
    }
  }

  const calculateProductsData = (products: any[], transactions: any[]) => {
    const productSales: { [key: string]: { name: string, code: string, quantity: number, revenue: number } } = {}
    
    transactions.forEach(t => {
      if (t.type === 'satis') {
        if (!productSales[t.productCode]) {
          productSales[t.productCode] = { 
            name: t.productName, 
            code: t.productCode, 
            quantity: 0, 
            revenue: 0 
          }
        }
        productSales[t.productCode].quantity += t.quantity
        productSales[t.productCode].revenue += t.totalPrice
      }
    })

    const topSelling = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const lowStock = products.filter(p => p.stock <= p.minStock).length
    const stockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0)

    return {
      total: products.length,
      lowStock,
      topSelling,
      stockValue
    }
  }

  const calculatePaymentsData = (transactions: any[]) => {
    const sales = transactions.filter(t => t.type === 'satis')
    return {
      cash: sales.filter(t => t.paymentMethod === 'nakit').reduce((sum, t) => sum + t.totalPrice, 0),
      card: sales.filter(t => t.paymentMethod === 'kart').reduce((sum, t) => sum + t.totalPrice, 0),
      transfer: sales.filter(t => t.paymentMethod === 'havale').reduce((sum, t) => sum + t.totalPrice, 0)
    }
  }

  const calculateComparison = (current: any[], previous: any[], products: any[]) => {
    const currentSales = current.filter(t => t.type === 'satis')
    const prevSales = previous.filter(t => t.type === 'satis')

    const currentRevenue = currentSales.reduce((sum, t) => sum + t.totalPrice, 0)
    const prevRevenue = prevSales.reduce((sum, t) => sum + t.totalPrice, 0)

    let currentCost = 0
    currentSales.forEach(sale => {
      const product = products.find(p => p.code === sale.productCode)
      if (product) currentCost += product.costPrice * sale.quantity
    })

    let prevCost = 0
    prevSales.forEach(sale => {
      const product = products.find(p => p.code === sale.productCode)
      if (product) prevCost += product.costPrice * sale.quantity
    })

    const currentProfit = currentRevenue - currentCost
    const prevProfit = prevRevenue - prevCost

    const salesGrowth = prevSales.length > 0 
      ? ((currentSales.length - prevSales.length) / prevSales.length) * 100 
      : 0

    const revenueGrowth = prevRevenue > 0 
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
      : 0

    const profitGrowth = prevProfit > 0 
      ? ((currentProfit - prevProfit) / prevProfit) * 100 
      : 0

    return { salesGrowth, revenueGrowth, profitGrowth }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const periodOptions = [
    { value: 'today', label: 'Bugün' },
    { value: 'week', label: 'Bu Hafta' },
    { value: 'month', label: 'Bu Ay' },
    { value: 'year', label: 'Bu Yıl' },
    { value: 'custom', label: 'Özel Tarih' }
  ]

  if (isLoading && isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl ios-shadow-lg animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-random-1" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-random-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float-random-3" />
        </div>
        <Navigation />
        <div className="main-content container-glass">
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-random-1" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-random-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float-random-3" />
      </div>
      <Navigation />
      <div className="main-content container-glass">
        <div className="space-y-6 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                Gelişmiş Raporlar
              </h1>
              <p className="text-gray-400 mt-2">Detaylı iş analitiği ve performans raporları</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <CustomSelect
                value={reportPeriod}
                onChange={setReportPeriod}
                options={periodOptions}
                className="w-full sm:w-48"
              />
              
              {reportPeriod === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input-glass"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input-glass"
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className="glass-card ios-shadow p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowRevenueModal(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-blue-500/30">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${reportData.comparison.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {reportData.comparison.revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {formatPercent(reportData.comparison.revenueGrowth)}
                </div>
              </div>
              <h3 className="text-gray-400 text-sm">Toplam Gelir</h3>
              <p className="text-2xl font-bold text-blue-400 mt-2">{formatCurrency(reportData.sales.revenue + reportData.services.revenue)}</p>
              <div className="text-xs text-gray-400 mt-2">
                Satış: {formatCurrency(reportData.sales.revenue)} | Servis: {formatCurrency(reportData.services.revenue)}
              </div>
            </div>

            <div 
              className="glass-card ios-shadow p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowProfitModal(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-green-500/30">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${reportData.comparison.profitGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {reportData.comparison.profitGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {formatPercent(reportData.comparison.profitGrowth)}
                </div>
              </div>
              <h3 className="text-gray-400 text-sm">Toplam Kar</h3>
              <p className="text-2xl font-bold text-green-400 mt-2">{formatCurrency(reportData.sales.profit + reportData.services.profit)}</p>
              <div className="text-xs text-gray-400 mt-2">
                Kar Marjı: {reportData.sales.profitMargin.toFixed(1)}%
              </div>
            </div>

            <div 
              className="glass-card ios-shadow p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowSalesModal(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-purple-500/30">
                  <ShoppingCart className="w-6 h-6 text-purple-400" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${reportData.comparison.salesGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {reportData.comparison.salesGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {formatPercent(reportData.comparison.salesGrowth)}
                </div>
              </div>
              <h3 className="text-gray-400 text-sm">Satış İşlemleri</h3>
              <p className="text-2xl font-bold text-purple-400 mt-2">{reportData.sales.count}</p>
              <div className="text-xs text-gray-400 mt-2">
                Ortalama: {formatCurrency(reportData.sales.count > 0 ? reportData.sales.revenue / reportData.sales.count : 0)}
              </div>
            </div>

            <div 
              className="glass-card ios-shadow p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowCostModal(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-orange-500/30">
                  <TrendingDown className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <h3 className="text-gray-400 text-sm">Toplam Maliyet</h3>
              <p className="text-2xl font-bold text-orange-400 mt-2">{formatCurrency(reportData.sales.cost + reportData.services.revenue - reportData.services.profit)}</p>
              <div className="text-xs text-gray-400 mt-2">
                Ürün: {formatCurrency(reportData.sales.cost)} | Servis Parça: {formatCurrency(reportData.services.revenue - reportData.services.profit)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card ios-shadow p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-400" />
                En İyi Müşteriler
              </h2>
              <div className="space-y-4">
                {reportData.customers.topCustomers.length > 0 ? (
                  reportData.customers.topCustomers.map((customer, index) => (
                    <div key={customer.phone} className="glass rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 glass rounded-lg flex items-center justify-center border border-blue-500/30">
                          <span className="text-blue-400 font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{customer.name}</div>
                          <div className="text-xs text-gray-400">{customer.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">{formatCurrency(customer.total)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">Bu dönemde işlem yok</div>
                )}
              </div>
            </div>

            <div className="glass-card ios-shadow p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-green-400" />
                En Çok Satan Ürünler
              </h2>
              <div className="space-y-4">
                {reportData.products.topSelling.length > 0 ? (
                  reportData.products.topSelling.map((product, index) => (
                    <div key={product.code} className="glass rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 glass rounded-lg flex items-center justify-center border border-green-500/30">
                          <span className="text-green-400 font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{product.name}</div>
                          <div className="text-xs text-gray-400">{product.code}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">{formatCurrency(product.revenue)}</div>
                        <div className="text-xs text-gray-400">{product.quantity} adet</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">Bu dönemde satış yok</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card ios-shadow p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <PieChart className="w-6 h-6 text-purple-400" />
                Ödeme Yöntemleri
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass rounded-lg flex items-center justify-center border border-green-500/30">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-sm text-gray-300">Nakit</span>
                  </div>
                  <div className="text-sm font-bold text-green-400">{formatCurrency(reportData.payments.cash)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass rounded-lg flex items-center justify-center border border-blue-500/30">
                      <DollarSign className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300">Kart</span>
                  </div>
                  <div className="text-sm font-bold text-blue-400">{formatCurrency(reportData.payments.card)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass rounded-lg flex items-center justify-center border border-purple-500/30">
                      <DollarSign className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-sm text-gray-300">Havale</span>
                  </div>
                  <div className="text-sm font-bold text-purple-400">{formatCurrency(reportData.payments.transfer)}</div>
                </div>
              </div>
            </div>

            <div className="glass-card ios-shadow p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-cyan-400" />
                Müşteri İstatistikleri
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Toplam Müşteri</span>
                  <span className="text-lg font-bold text-cyan-400">{reportData.customers.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Yeni Müşteri</span>
                  <span className="text-lg font-bold text-green-400">{reportData.customers.newCustomers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Müşteri Başına Ort.</span>
                  <span className="text-lg font-bold text-blue-400">
                    {formatCurrency(reportData.customers.topCustomers.length > 0 
                      ? reportData.customers.topCustomers.reduce((sum, c) => sum + c.total, 0) / reportData.customers.topCustomers.length
                      : 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card ios-shadow p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-yellow-400" />
                Servis İstatistikleri
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Toplam Servis</span>
                  <span className="text-lg font-bold text-yellow-400">{reportData.services.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Servis Geliri</span>
                  <span className="text-lg font-bold text-green-400">{formatCurrency(reportData.services.revenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Ortalama Fatura</span>
                  <span className="text-lg font-bold text-blue-400">{formatCurrency(reportData.services.avgTicket)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-400" />
              Stok Durumu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between glass rounded-xl p-4">
                <div>
                  <div className="text-sm text-gray-400">Toplam Ürün</div>
                  <div className="text-2xl font-bold text-blue-400 mt-1">{reportData.products.total}</div>
                </div>
                <Package className="w-10 h-10 text-blue-400" />
              </div>
              <div className="flex items-center justify-between glass rounded-xl p-4">
                <div>
                  <div className="text-sm text-gray-400">Düşük Stok</div>
                  <div className="text-2xl font-bold text-red-400 mt-1">{reportData.products.lowStock}</div>
                </div>
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <div className="flex items-center justify-between glass rounded-xl p-4">
                <div>
                  <div className="text-sm text-gray-400">Stok Değeri</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(reportData.products.stockValue)}</div>
                </div>
                <DollarSign className="w-10 h-10 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {showRevenueModal && (
          <Modal
            isOpen={showRevenueModal}
            onClose={() => setShowRevenueModal(false)}
            title="Gelir Detay Analizi"
            size="lg"
          >
            <ModalBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Satış Geliri</div>
                    <div className="text-2xl font-bold text-blue-400">{formatCurrency(reportData.sales.revenue)}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Servis Geliri</div>
                    <div className="text-2xl font-bold text-green-400">{formatCurrency(reportData.services.revenue)}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Toplam Gelir</div>
                    <div className="text-2xl font-bold text-purple-400">{formatCurrency(reportData.sales.revenue + reportData.services.revenue)}</div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                    Satış İşlemleri
                  </h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {detailedTransactions.filter(t => t.type === 'satis').map((trans) => (
                      <div key={trans._id} className="flex justify-between items-center p-3 glass-soft rounded-lg">
                        <div>
                          <div className="text-sm font-medium">{trans.productName}</div>
                          <div className="text-xs text-gray-400">{trans.customerName} - {new Date(trans.createdAt).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">{formatCurrency(trans.totalPrice)}</div>
                          <div className="text-xs text-gray-400">{trans.quantity} adet × {formatCurrency(trans.unitPrice)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-yellow-400" />
                    Servis İşlemleri
                  </h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {detailedServices.map((service) => (
                      <div key={service._id} className="flex justify-between items-center p-3 glass-soft rounded-lg">
                        <div>
                          <div className="text-sm font-medium">{service.brand} {service.model}</div>
                          <div className="text-xs text-gray-400">{service.customerName} - {new Date(service.createdAt).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">{formatCurrency(service.totalCost)}</div>
                          <div className="text-xs text-gray-400">İşçilik: {formatCurrency(service.laborCost)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-400" />
                    Ödeme Yöntemleri Dağılımı
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Nakit</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 glass-soft rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(reportData.payments.cash / (reportData.sales.revenue + reportData.services.revenue)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-400 w-24 text-right">{formatCurrency(reportData.payments.cash)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Kart</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 glass-soft rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(reportData.payments.card / (reportData.sales.revenue + reportData.services.revenue)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-blue-400 w-24 text-right">{formatCurrency(reportData.payments.card)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Havale</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 glass-soft rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${(reportData.payments.transfer / (reportData.sales.revenue + reportData.services.revenue)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-purple-400 w-24 text-right">{formatCurrency(reportData.payments.transfer)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => setShowRevenueModal(false)}
                className="btn-glass-danger w-full"
              >
                Kapat
              </button>
            </ModalFooter>
          </Modal>
        )}

        {showProfitModal && (
          <Modal
            isOpen={showProfitModal}
            onClose={() => setShowProfitModal(false)}
            title="Kar Detay Analizi"
            size="lg"
          >
            <ModalBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Toplam Gelir</div>
                    <div className="text-xl font-bold text-blue-400">{formatCurrency(reportData.sales.revenue + reportData.services.revenue)}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Toplam Maliyet</div>
                    <div className="text-xl font-bold text-red-400">{formatCurrency(reportData.sales.cost + (reportData.services.revenue - reportData.services.profit))}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Net Kar</div>
                    <div className="text-xl font-bold text-green-400">{formatCurrency(reportData.sales.profit + reportData.services.profit)}</div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4">Satış Kar Analizi</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Satış Geliri</span>
                      <span className="text-sm font-bold text-blue-400">{formatCurrency(reportData.sales.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Ürün Maliyeti</span>
                      <span className="text-sm font-bold text-red-400">-{formatCurrency(reportData.sales.cost)}</span>
                    </div>
                    <div className="h-px bg-gray-700 my-2" />
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">Satış Karı</span>
                      <span className="text-sm font-bold text-green-400">{formatCurrency(reportData.sales.profit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Kar Marjı</span>
                      <span className="text-sm font-bold text-purple-400">{reportData.sales.profitMargin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4">Servis Kar Analizi</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Toplam Gelir</span>
                      <span className="text-sm font-bold text-blue-400">{formatCurrency(reportData.services.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Parça Maliyeti</span>
                      <span className="text-sm font-bold text-red-400">-{formatCurrency(reportData.services.revenue - reportData.services.profit)}</span>
                    </div>
                    <div className="h-px bg-gray-700 my-2" />
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">İşçilik Karı</span>
                      <span className="text-sm font-bold text-green-400">{formatCurrency(reportData.services.profit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Ortalama Fatura</span>
                      <span className="text-sm font-bold text-purple-400">{formatCurrency(reportData.services.avgTicket)}</span>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4">Kar Trendi</h3>
                  <div className="flex items-center justify-between p-4 glass-soft rounded-lg">
                    <div className="flex items-center gap-3">
                      {reportData.comparison.profitGrowth >= 0 ? (
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      ) : (
                        <TrendingDown className="w-8 h-8 text-red-400" />
                      )}
                      <div>
                        <div className="text-sm text-gray-400">Önceki Döneme Göre</div>
                        <div className={`text-xl font-bold ${reportData.comparison.profitGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(reportData.comparison.profitGrowth)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => setShowProfitModal(false)}
                className="btn-glass-danger w-full"
              >
                Kapat
              </button>
            </ModalFooter>
          </Modal>
        )}

        {showSalesModal && (
          <Modal
            isOpen={showSalesModal}
            onClose={() => setShowSalesModal(false)}
            title="Satış Detay Analizi"
            size="lg"
          >
            <ModalBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Toplam Satış</div>
                    <div className="text-2xl font-bold text-purple-400">{reportData.sales.count}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Toplam Gelir</div>
                    <div className="text-2xl font-bold text-green-400">{formatCurrency(reportData.sales.revenue)}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Ortalama Sepet</div>
                    <div className="text-2xl font-bold text-blue-400">{formatCurrency(reportData.sales.count > 0 ? reportData.sales.revenue / reportData.sales.count : 0)}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Büyüme</div>
                    <div className={`text-2xl font-bold ${reportData.comparison.salesGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(reportData.comparison.salesGrowth)}
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4">Tüm Satış İşlemleri</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {detailedTransactions.filter(t => t.type === 'satis').map((trans) => (
                      <div key={trans._id} className="flex justify-between items-center p-3 glass-soft rounded-lg hover:bg-white/5 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium">{trans.productName}</div>
                            <div className="text-xs glass-soft px-2 py-0.5 rounded">{trans.productCode}</div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {trans.customerName} • {trans.customerPhone}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(trans.createdAt).toLocaleString('tr-TR')}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-bold text-green-400">{formatCurrency(trans.totalPrice)}</div>
                          <div className="text-xs text-gray-400">{trans.quantity} × {formatCurrency(trans.unitPrice)}</div>
                          <div className="text-xs glass-soft px-2 py-0.5 rounded mt-1">
                            {trans.paymentMethod === 'nakit' ? 'Nakit' : trans.paymentMethod === 'kart' ? 'Kart' : 'Havale'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => setShowSalesModal(false)}
                className="btn-glass-danger w-full"
              >
                Kapat
              </button>
            </ModalFooter>
          </Modal>
        )}

        {showCostModal && (
          <Modal
            isOpen={showCostModal}
            onClose={() => setShowCostModal(false)}
            title="Maliyet Detay Analizi"
            size="lg"
          >
            <ModalBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Ürün Maliyeti</div>
                    <div className="text-2xl font-bold text-red-400">{formatCurrency(reportData.sales.cost)}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Servis Parça</div>
                    <div className="text-2xl font-bold text-orange-400">{formatCurrency(reportData.services.revenue - reportData.services.profit)}</div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Toplam Maliyet</div>
                    <div className="text-2xl font-bold text-purple-400">{formatCurrency(reportData.sales.cost + (reportData.services.revenue - reportData.services.profit))}</div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4">Maliyet Dağılımı</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Satış Ürün Maliyeti</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 glass-soft rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${(reportData.sales.cost / (reportData.sales.cost + (reportData.services.revenue - reportData.services.profit))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-red-400 w-32 text-right">{formatCurrency(reportData.sales.cost)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Servis Parça Maliyeti</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 glass-soft rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${((reportData.services.revenue - reportData.services.profit) / (reportData.sales.cost + (reportData.services.revenue - reportData.services.profit))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-orange-400 w-32 text-right">{formatCurrency(reportData.services.revenue - reportData.services.profit)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4">
                  <h3 className="font-semibold mb-4">Maliyet/Gelir Karşılaştırması</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Toplam Gelir</span>
                      <span className="text-sm font-bold text-green-400">{formatCurrency(reportData.sales.revenue + reportData.services.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Toplam Maliyet</span>
                      <span className="text-sm font-bold text-red-400">-{formatCurrency(reportData.sales.cost + (reportData.services.revenue - reportData.services.profit))}</span>
                    </div>
                    <div className="h-px bg-gray-700 my-2" />
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">Net Kar</span>
                      <span className="text-sm font-bold text-green-400">{formatCurrency(reportData.sales.profit + reportData.services.profit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Maliyet Oranı</span>
                      <span className="text-sm font-bold text-orange-400">
                        {((reportData.sales.cost + (reportData.services.revenue - reportData.services.profit)) / (reportData.sales.revenue + reportData.services.revenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                onClick={() => setShowCostModal(false)}
                className="btn-glass-danger w-full"
              >
                Kapat
              </button>
            </ModalFooter>
          </Modal>
        )}
      </div>
    </div>
  )
}
