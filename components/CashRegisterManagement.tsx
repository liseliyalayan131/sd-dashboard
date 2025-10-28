'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, Plus, Minus, Save, TrendingUp, TrendingDown, Calendar, 
  Clock, CheckCircle, Eye, Filter, Download, BarChart2, PieChart,
  Activity, AlertCircle, History, RefreshCw, FileText, ArrowUpDown
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import Modal from '@/components/ui/Modal'
import { ModalBody, ModalFooter } from '@/components/ui/ModalParts'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CashRegister {
  _id: string
  openingDate: string
  closingDate: string | null
  openingAmount: number
  expectedCash: number
  actualCash: number | null
  difference: number
  totalCashIn: number
  totalCashOut: number
  status: 'acik' | 'kapali'
  openedBy: string
  closedBy: string | null
  notes: string
}

interface CashTransaction {
  _id: string
  type: 'giris' | 'cikis'
  amount: number
  category: string
  description: string
  createdAt: string
  performedBy: string
}

interface ReportData {
  summary: {
    totalRegisters: number
    openRegisters: number
    closedRegisters: number
    totalOpeningAmount: number
    totalExpectedCash: number
    totalActualCash: number
    totalDifference: number
    totalCashIn: number
    totalCashOut: number
    averageDifference: number
    averageDailyCashIn: number
  }
  categoryBreakdown: Record<string, { total: number, count: number, type: string }>
  dailyBreakdown: Array<{
    date: string
    registers: number
    totalCashIn: number
    totalCashOut: number
    difference: number
  }>
  registers: CashRegister[]
}

export default function CashRegisterManagement() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'reports'>('current')
  
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null)
  const [registers, setRegisters] = useState<CashRegister[]>([])
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRegisterDetail, setSelectedRegisterDetail] = useState<string | null>(null)
  
  const [openingAmount, setOpeningAmount] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  
  const [transactionType, setTransactionType] = useState<'giris' | 'cikis'>('giris')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionCategory, setTransactionCategory] = useState('diger')
  const [transactionDescription, setTransactionDescription] = useState('')

  const [filterStatus, setFilterStatus] = useState<'all' | 'acik' | 'kapali'>('all')
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month'>('week')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports()
    }
  }, [activeTab, reportPeriod])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [registersRes, currentRes] = await Promise.all([
        fetch('/api/cash-register'),
        fetch('/api/cash-register?status=acik')
      ])

      const allRegisters = await registersRes.json()
      const openRegisters = await currentRes.json()

      setRegisters(allRegisters)
      
      if (openRegisters.length > 0) {
        const current = openRegisters[0]
        setCurrentRegister(current)
        fetchTransactions(current._id)
      } else {
        setCurrentRegister(null)
        setTransactions([])
      }
    } catch (error) {
      showToast('Veriler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (registerId: string) => {
    try {
      const res = await fetch(`/api/cash-transactions?cashRegisterId=${registerId}`)
      const data = await res.json()
      setTransactions(data)
    } catch (error) {
      showToast('İşlemler yüklenemedi', 'error')
    }
  }

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/cash-register/reports?period=${reportPeriod}`)
      const data = await res.json()
      setReportData(data)
    } catch (error) {
      showToast('Rapor yüklenemedi', 'error')
    }
  }

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingAmount: parseFloat(openingAmount) || 0,
          openedBy: 'Admin'
        })
      })

      if (res.ok) {
        showToast('Kasa başarıyla açıldı', 'success')
        setShowOpenModal(false)
        setOpeningAmount('')
        fetchData()
      } else {
        const error = await res.json()
        showToast(error.error, 'error')
      }
    } catch (error) {
      showToast('Kasa açılamadı', 'error')
    }
  }

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentRegister) return

    try {
      const res = await fetch(`/api/cash-register/${currentRegister._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualCash: parseFloat(actualCash),
          closedBy: 'Admin',
          notes: closeNotes
        })
      })

      if (res.ok) {
        showToast('Kasa başarıyla kapatıldı', 'success')
        setShowCloseModal(false)
        setActualCash('')
        setCloseNotes('')
        fetchData()
      } else {
        const error = await res.json()
        showToast(error.error, 'error')
      }
    } catch (error) {
      showToast('Kasa kapatılamadı', 'error')
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: transactionType,
          amount: parseFloat(transactionAmount),
          category: transactionCategory,
          description: transactionDescription,
          performedBy: 'Admin'
        })
      })

      if (res.ok) {
        showToast('İşlem eklendi', 'success')
        setShowTransactionModal(false)
        setTransactionAmount('')
        setTransactionDescription('')
        setTransactionCategory('diger')
        fetchData()
      } else {
        const error = await res.json()
        showToast(error.error, 'error')
      }
    } catch (error) {
      showToast('İşlem eklenemedi', 'error')
    }
  }

  const handleViewDetails = async (registerId: string) => {
    setSelectedRegisterDetail(registerId)
    try {
      const res = await fetch(`/api/cash-register/${registerId}`)
      const data = await res.json()
      setTransactions(data.transactions)
      setShowDetailModal(true)
    } catch (error) {
      showToast('Detaylar yüklenemedi', 'error')
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    const csvRows = []
    csvRows.push(['Tarih', 'Kasa Sayısı', 'Giriş', 'Çıkış', 'Fark'])
    
    reportData.dailyBreakdown.forEach(day => {
      csvRows.push([
        day.date,
        day.registers.toString(),
        day.totalCashIn.toFixed(2),
        day.totalCashOut.toFixed(2),
        day.difference.toFixed(2)
      ])
    })

    const csvContent = csvRows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kasa-raporu-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'satis': 'Satış',
      'iade': 'İade',
      'masraf': 'Masraf',
      'diger': 'Diğer',
      'acilis': 'Açılış',
      'devir': 'Devir'
    }
    return labels[category] || category
  }

  const filteredRegisters = registers.filter(r => {
    if (filterStatus === 'all') return true
    return r.status === filterStatus
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateCompare = new Date(b.openingDate).getTime() - new Date(a.openingDate).getTime()
      return sortOrder === 'desc' ? dateCompare : -dateCompare
    } else {
      const amountCompare = b.expectedCash - a.expectedCash
      return sortOrder === 'desc' ? amountCompare : -amountCompare
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Kasa Yönetimi</h1>
          <p className="text-gray-400 mt-2">Gelişmiş kasa takibi ve raporlama</p>
        </div>
        
        {!currentRegister && activeTab === 'current' && (
          <button
            onClick={() => setShowOpenModal(true)}
            className="glass-button btn-primary flex items-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            Kasa Aç
          </button>
        )}
      </div>

      <div className="glass-card p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'current'
                ? 'bg-blue-500/20 text-blue-400 font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5 inline mr-2" />
            Aktif Kasa
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-blue-500/20 text-blue-400 font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-5 h-5 inline mr-2" />
            Geçmiş
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'reports'
                ? 'bg-blue-500/20 text-blue-400 font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-5 h-5 inline mr-2" />
            Raporlar
          </button>
        </div>
      </div>

      {activeTab === 'current' && currentRegister && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Aktif Kasa</h2>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 border border-green-500/30">
                    Açık
                  </span>
                  <button
                    onClick={fetchData}
                    className="glass p-2 rounded-xl hover:bg-white/5"
                    title="Yenile"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="glass p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Açılış</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ₺{currentRegister.openingAmount.toFixed(2)}
                  </p>
                </div>
                
                <div className="glass p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Beklenen</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₺{currentRegister.expectedCash.toFixed(2)}
                  </p>
                </div>

                <div className="glass p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Giriş</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    +₺{currentRegister.totalCashIn.toFixed(2)}
                  </p>
                </div>

                <div className="glass p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Çıkış</p>
                  <p className="text-2xl font-bold text-red-400">
                    -₺{currentRegister.totalCashOut.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTransactionType('giris')
                    setShowTransactionModal(true)
                  }}
                  className="glass-button flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Giriş
                </button>
                
                <button
                  onClick={() => {
                    setTransactionType('cikis')
                    setShowTransactionModal(true)
                  }}
                  className="glass-button flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-2"
                >
                  <Minus className="w-5 h-5" />
                  Çıkış
                </button>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="glass-button flex-1 bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Kapat
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">Son İşlemler</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Henüz işlem yok
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction._id} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-3">
                        {transaction.type === 'giris' ? (
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{getCategoryLabel(transaction.category)}</p>
                          <p className="text-sm text-gray-400">{transaction.description || 'Açıklama yok'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${transaction.type === 'giris' ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.type === 'giris' ? '+' : '-'}₺{transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">Kasa Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Açılış: {format(new Date(currentRegister.openingDate), 'dd MMM yyyy', { locale: tr })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Saat: {format(new Date(currentRegister.openingDate), 'HH:mm', { locale: tr })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Açan: {currentRegister.openedBy}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">İşlem Dağılımı</h3>
              <div className="space-y-2">
                {Object.entries(
                  transactions.reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount
                    return acc
                  }, {} as Record<string, number>)
                ).map(([category, total]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{getCategoryLabel(category)}</span>
                    <span className="font-medium">₺{total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'current' && !currentRegister && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Açık Kasa Yok</h3>
          <p className="text-gray-400 mb-6">Günlük kasa işlemlerini başlatmak için kasa açın</p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="glass-button btn-primary"
          >
            <DollarSign className="w-5 h-5 mr-2 inline" />
            Kasa Aç
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="glass-input flex-1"
            >
              <option value="all">Tüm Kasalar</option>
              <option value="acik">Açık</option>
              <option value="kapali">Kapalı</option>
            </select>
            
            <button
              onClick={() => {
                setSortBy(sortBy === 'date' ? 'amount' : 'date')
              }}
              className="glass-button flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortBy === 'date' ? 'Tarihe Göre' : 'Tutara Göre'}
            </button>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="glass-button"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRegisters.map((register) => (
              <div key={register._id} className="glass-card p-6 hover:bg-white/5 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    register.status === 'acik'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {register.status === 'acik' ? 'Açık' : 'Kapalı'}
                  </span>
                  <button
                    onClick={() => handleViewDetails(register._id)}
                    className="glass p-2 rounded-lg hover:bg-white/10"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Tarih</p>
                    <p className="font-medium">
                      {format(new Date(register.openingDate), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Açılış</p>
                      <p className="font-medium text-blue-400">₺{register.openingAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Beklenen</p>
                      <p className="font-medium text-green-400">₺{register.expectedCash.toFixed(2)}</p>
                    </div>
                  </div>

                  {register.status === 'kapali' && register.actualCash !== null && (
                    <div className="glass p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Fark</span>
                        <span className={`font-bold ${
                          register.difference === 0
                            ? 'text-green-400'
                            : register.difference > 0
                            ? 'text-blue-400'
                            : 'text-red-400'
                        }`}>
                          {register.difference > 0 ? '+' : ''}₺{register.difference.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredRegisters.length === 0 && (
            <div className="glass-card p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Kayıt bulunamadı</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && reportData && (
        <div className="space-y-6">
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as any)}
                className="glass-input"
              >
                <option value="today">Bugün</option>
                <option value="week">Son 7 Gün</option>
                <option value="month">Son 30 Gün</option>
              </select>
            </div>
            <button
              onClick={exportToCSV}
              className="glass-button btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV İndir
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Toplam Giriş</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₺{reportData.summary.totalCashIn.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Toplam Çıkış</p>
                  <p className="text-2xl font-bold text-red-400">
                    ₺{reportData.summary.totalCashOut.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Toplam Fark</p>
                  <p className={`text-2xl font-bold ${
                    reportData.summary.totalDifference === 0
                      ? 'text-green-400'
                      : reportData.summary.totalDifference > 0
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}>
                    {reportData.summary.totalDifference > 0 ? '+' : ''}₺{reportData.summary.totalDifference.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ort. Günlük</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ₺{reportData.summary.averageDailyCashIn.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Kategori Dağılımı
              </h3>
              <div className="space-y-3">
                {Object.entries(reportData.categoryBreakdown).map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        data.type === 'giris' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-sm">{getCategoryLabel(category)}</span>
                      <span className="text-xs text-gray-400">({data.count} işlem)</span>
                    </div>
                    <span className="font-medium">₺{data.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5" />
                Günlük Trend
              </h3>
              <div className="space-y-2">
                {reportData.dailyBreakdown.slice(0, 7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 glass rounded-xl">
                    <span className="text-sm">
                      {format(new Date(day.date), 'dd MMM', { locale: tr })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-green-400">+₺{day.totalCashIn.toFixed(0)}</span>
                      <span className="text-xs text-red-400">-₺{day.totalCashOut.toFixed(0)}</span>
                      <span className={`text-sm font-medium ${
                        day.difference === 0 ? 'text-gray-400' : day.difference > 0 ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {day.difference > 0 ? '+' : ''}₺{day.difference.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        title="Kasa Aç"
        icon={<DollarSign className="w-6 h-6 text-blue-400" />}
        size="sm"
      >
        <form onSubmit={handleOpenRegister}>
          <ModalBody>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Açılış Tutarı (₺)
              </label>
              <input
                type="number"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="input-glass w-full"
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setShowOpenModal(false)}
              className="glass-button btn-secondary flex-1"
            >
              İptal
            </button>
            <button type="submit" className="glass-button btn-primary flex-1">
              Kasa Aç
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Kasa Kapat"
        icon={<Save className="w-6 h-6 text-yellow-400" />}
        size="md"
      >
        <form onSubmit={handleCloseRegister}>
          <ModalBody>
            <div className="space-y-4">
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-2">Beklenen Tutar</p>
                <p className="text-2xl font-bold text-green-400">
                  ₺{currentRegister?.expectedCash.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Gerçek Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="input-glass w-full"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>

              {actualCash && currentRegister && (
                <div className="glass p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Fark</p>
                  <p className={`text-2xl font-bold ${
                    parseFloat(actualCash) - currentRegister.expectedCash === 0
                      ? 'text-green-400'
                      : parseFloat(actualCash) - currentRegister.expectedCash > 0
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}>
                    {parseFloat(actualCash) - currentRegister.expectedCash > 0 ? '+' : ''}
                    ₺{(parseFloat(actualCash) - currentRegister.expectedCash).toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Notlar
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="input-glass w-full min-h-[80px]"
                  placeholder="Varsa not ekleyin..."
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setShowCloseModal(false)}
              className="glass-button btn-secondary flex-1"
            >
              İptal
            </button>
            <button type="submit" className="glass-button btn-primary flex-1">
              Kasa Kapat
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title={transactionType === 'giris' ? 'Nakit Giriş' : 'Nakit Çıkış'}
        icon={transactionType === 'giris' ? 
          <Plus className="w-6 h-6 text-green-400" /> : 
          <Minus className="w-6 h-6 text-red-400" />
        }
        size="sm"
      >
        <form onSubmit={handleAddTransaction}>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  className="input-glass w-full"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Kategori *
                </label>
                <select
                  value={transactionCategory}
                  onChange={(e) => setTransactionCategory(e.target.value)}
                  className="input-glass w-full"
                  required
                >
                  <option value="diger">Diğer</option>
                  <option value="masraf">Masraf</option>
                  <option value="satis">Satış</option>
                  <option value="iade">İade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={transactionDescription}
                  onChange={(e) => setTransactionDescription(e.target.value)}
                  className="input-glass w-full"
                  placeholder="Açıklama girin..."
                  rows={3}
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setShowTransactionModal(false)}
              className="glass-button btn-secondary flex-1"
            >
              İptal
            </button>
            <button type="submit" className="glass-button btn-primary flex-1">
              Kaydet
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedRegisterDetail(null)
          if (currentRegister) fetchTransactions(currentRegister._id)
        }}
        title="Kasa Detayları"
        icon={<Eye className="w-6 h-6 text-blue-400" />}
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="glass p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {transaction.type === 'giris' ? (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{getCategoryLabel(transaction.category)}</p>
                    <p className="text-sm text-gray-400">{transaction.description || 'Açıklama yok'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>
                </div>
                <div className={`text-lg font-bold ${transaction.type === 'giris' ? 'text-green-400' : 'text-red-400'}`}>
                  {transaction.type === 'giris' ? '+' : '-'}₺{transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </ModalBody>
      </Modal>
    </div>
  )
}
