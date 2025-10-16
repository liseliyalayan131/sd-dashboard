'use client'

import { useState, useEffect } from 'react'
import { Plus, ShoppingCart, TrendingUp, DollarSign, Calendar, Package, User, Phone, BarChart3, TrendingDown, Wallet } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import CustomSelect from '@/components/ui/CustomSelect'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface Customer {
  _id: string
  firstName: string
  lastName: string
  phone: string
}

interface Product {
  _id: string
  name: string
  code: string
  price: number
  stock: number
  unit: string
}

interface Transaction {
  _id: string
  customerName: string
  customerPhone: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
  totalPrice: number
  type: string
  paymentMethod: string
  installments: number
  notes: string
  createdAt: string
}

interface TransactionForm {
  customerId: string
  productId: string
  quantity: number
  type: 'satis' | 'iade'
  paymentMethod: 'nakit' | 'kart' | 'havale'
  installments: number
  notes: string
}

export default function TransactionManagement() {
  const { showToast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [reportPeriod, setReportPeriod] = useState<string>('all')
  const [formData, setFormData] = useState<TransactionForm>({
    customerId: '',
    productId: '',
    quantity: 1,
    type: 'satis',
    paymentMethod: 'nakit',
    installments: 1,
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p._id === formData.productId)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [formData.productId, products])

  const fetchData = async () => {
    try {
      const [customersRes, productsRes, transactionsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products'),
        fetch('/api/transactions')
      ])
      
      if (customersRes.ok) setCustomers(await customersRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (transactionsRes.ok) setTransactions(await transactionsRes.json())
    } catch (error) {
      console.error('Veriler alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerId || !formData.productId) {
      showToast('Lütfen müşteri ve ürün seçin', 'warning')
      return
    }

    const customer = customers.find(c => c._id === formData.customerId)
    const product = products.find(p => p._id === formData.productId)
    
    if (!customer || !product) return

    if (formData.type === 'satis' && product.stock < formData.quantity) {
      showToast('Yetersiz stok!', 'error')
      return
    }

    const totalPrice = product.price * formData.quantity

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerName: `${customer.firstName} ${customer.lastName}`,
          customerPhone: customer.phone,
          productName: product.name,
          productCode: product.code,
          unitPrice: product.price,
          totalPrice
        })
      })

      if (response.ok) {
        await fetchData()
        resetForm()
        showToast('İşlem başarıyla kaydedildi!', 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'İşlem başarısız!', 'error')
      }
    } catch (error) {
      console.error('İşlem kaydedilemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: '',
      productId: '',
      quantity: 1,
      type: 'satis',
      paymentMethod: 'nakit',
      installments: 1,
      notes: ''
    })
    setSelectedProduct(null)
    setShowForm(false)
  }

  const filterTransactionsByPeriod = (transactions: Transaction[]) => {
    if (reportPeriod === 'all') return transactions

    const now = new Date()
    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt)
      
      switch (reportPeriod) {
        case 'today':
          return transactionDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return transactionDate >= weekAgo
        case 'month':
          return transactionDate.getMonth() === now.getMonth() && 
                 transactionDate.getFullYear() === now.getFullYear()
        case 'year':
          return transactionDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })

    return filtered
  }

  const filteredTransactions = filterTransactionsByPeriod(transactions)

  const {
    displayedItems: displayedTransactions,
    hasMore,
    isLoading: isLoadingMore,
    observerTarget,
    totalItems,
    displayedCount
  } = useInfiniteScroll(filteredTransactions, { itemsPerPage: 50 })

  const getReportStats = () => {
    const filteredByPeriod = filterTransactionsByPeriod(transactions)
    
    const totalSales = filteredByPeriod
      .filter(t => t.type === 'satis')
      .reduce((sum, t) => sum + t.totalPrice, 0)
    
    const totalReturns = filteredByPeriod
      .filter(t => t.type === 'iade')
      .reduce((sum, t) => sum + t.totalPrice, 0)
    
    const netRevenue = totalSales - totalReturns
    
    const salesCount = filteredByPeriod.filter(t => t.type === 'satis').length
    const returnsCount = filteredByPeriod.filter(t => t.type === 'iade').length

    return {
      totalSales,
      totalReturns,
      netRevenue,
      salesCount,
      returnsCount,
      totalCount: filteredByPeriod.length
    }
  }

  const stats = getReportStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const customerOptions = [
    { value: '', label: 'Müşteri Seçin' },
    ...customers.map(c => ({
      value: c._id,
      label: `${c.firstName} ${c.lastName} - ${c.phone}`
    }))
  ]

  const productOptions = [
    { value: '', label: 'Ürün Seçin' },
    ...products.map(p => ({
      value: p._id,
      label: `${p.name} (${p.code}) - Stok: ${p.stock} ${p.unit}`
    }))
  ]

  const typeOptions = [
    { value: 'satis', label: 'Satış' },
    { value: 'iade', label: 'İade' }
  ]

  const paymentOptions = [
    { value: 'nakit', label: 'Nakit' },
    { value: 'kart', label: 'Kredi Kartı' },
    { value: 'havale', label: 'Havale/EFT' }
  ]

  const installmentOptions = [
    { value: '1', label: 'Peşin' },
    { value: '2', label: '2 Taksit' },
    { value: '3', label: '3 Taksit' },
    { value: '4', label: '4 Taksit' },
    { value: '6', label: '6 Taksit' },
    { value: '9', label: '9 Taksit' },
    { value: '12', label: '12 Taksit' }
  ]

  const periodOptions = [
    { value: 'all', label: 'Tüm Zamanlar' },
    { value: 'today', label: 'Bugün' },
    { value: 'week', label: 'Bu Hafta' },
    { value: 'month', label: 'Bu Ay' },
    { value: 'year', label: 'Bu Yıl' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-400" />
            İşlemler
          </h1>
          <p className="text-gray-400">Satış ve iade işlemlerini yönetin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="glass-button btn-primary mt-4 md:mt-0 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <span>Yeni İşlem</span>
        </button>
      </div>

      <div className="glass-card ios-shadow p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            İşlem Raporları
          </h2>
          <CustomSelect
            value={reportPeriod}
            onChange={setReportPeriod}
            options={periodOptions}
            className="w-48"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-green-500/30">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Toplam Satış</h3>
            <p className="text-2xl font-bold text-green-400 mt-2">{formatCurrency(stats.totalSales)}</p>
            <div className="text-xs text-gray-400 mt-2">
              {stats.salesCount} satış işlemi
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-red-500/30">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Toplam İade</h3>
            <p className="text-2xl font-bold text-red-400 mt-2">{formatCurrency(stats.totalReturns)}</p>
            <div className="text-xs text-gray-400 mt-2">
              {stats.returnsCount} iade işlemi
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-blue-500/30">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Net Gelir</h3>
            <p className="text-2xl font-bold text-blue-400 mt-2">{formatCurrency(stats.netRevenue)}</p>
            <div className="text-xs text-gray-400 mt-2">
              Satış - İade
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-purple-500/30">
                <ShoppingCart className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Toplam İşlem</h3>
            <p className="text-2xl font-bold text-purple-400 mt-2">{stats.totalCount}</p>
            <div className="text-xs text-gray-400 mt-2">
              Satış + İade
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-scale-in">
          <h3 className="text-lg font-semibold text-white mb-4">Yeni İşlem</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-400 mb-2">Müşteri</label>
              <CustomSelect
                value={formData.customerId}
                onChange={(value) => setFormData({ ...formData, customerId: value })}
                options={customerOptions}
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-400 mb-2">Ürün</label>
              <CustomSelect
                value={formData.productId}
                onChange={(value) => setFormData({ ...formData, productId: value })}
                options={productOptions}
              />
            </div>

            {selectedProduct && (
              <div className="lg:col-span-3 space-y-4">
                <div className="glass-card p-4 bg-blue-950/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Stok</p>
                      <p className="text-white font-medium">{selectedProduct.stock} {selectedProduct.unit}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Birim Fiyat</p>
                      <p className="text-green-400 font-medium">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Toplam</p>
                      <p className="text-blue-400 font-bold">{formatCurrency(selectedProduct.price * formData.quantity)}</p>
                    </div>
                  </div>
                </div>

                {formData.paymentMethod === 'kart' && formData.installments > 1 && (
                  <div className="glass-card p-4 bg-green-950/20 border border-green-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Taksit Planı
                      </h4>
                      <span className="text-xs text-gray-400">{formData.installments} Taksit</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Toplam Tutar</p>
                        <p className="text-white font-bold">{formatCurrency(selectedProduct.price * formData.quantity)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Aylık Taksit</p>
                        <p className="text-green-400 font-bold">
                          {formatCurrency((selectedProduct.price * formData.quantity) / formData.installments)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Taksit Sayısı</p>
                        <p className="text-blue-400 font-bold">{formData.installments}x</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Miktar</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">İşlem Türü</label>
              <CustomSelect
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value as any })}
                options={typeOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Ödeme Yöntemi</label>
              <CustomSelect
                value={formData.paymentMethod}
                onChange={(value) => setFormData({ ...formData, paymentMethod: value as any, installments: value === 'kart' ? formData.installments : 1 })}
                options={paymentOptions}
              />
            </div>

            {formData.paymentMethod === 'kart' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Taksit Seçeneği</label>
                <CustomSelect
                  value={formData.installments.toString()}
                  onChange={(value) => setFormData({ ...formData, installments: parseInt(value) })}
                  options={installmentOptions}
                />
              </div>
            )}

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-400 mb-2">Notlar</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div className="lg:col-span-3 flex justify-end gap-3 pt-4">
              <button type="button" onClick={resetForm} className="glass-button btn-secondary">
                İptal
              </button>
              <button type="submit" className="glass-button btn-primary">
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {totalItems > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Toplam {totalItems} işlemden {displayedCount} tanesi gösteriliyor</span>
            {hasMore && <span className="text-blue-400">Daha fazla görmek için aşağı kaydırın</span>}
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Müşteri</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ürün</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Miktar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tutar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {displayedTransactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{transaction.customerName}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {transaction.customerPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{transaction.productName}</div>
                        <div className="text-sm text-gray-400">{transaction.productCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-white">{transaction.quantity}</div>
                    <div className="text-xs text-gray-400">{formatCurrency(transaction.unitPrice)}/adet</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`text-sm font-bold ${transaction.type === 'satis' ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(transaction.totalPrice)}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {transaction.paymentMethod}
                      {transaction.paymentMethod === 'kart' && transaction.installments > 1 && (
                        <span className="ml-1">({transaction.installments}x)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="text-sm text-gray-300">{formatDate(transaction.createdAt)}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div ref={observerTarget} className="py-8 flex justify-center">
            {isLoadingMore && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Yükleniyor...</span>
              </div>
            )}
          </div>
        )}
        
        {displayedTransactions.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Henüz işlem kaydı yok</p>
          </div>
        )}
      </div>
    </div>
  )
}
