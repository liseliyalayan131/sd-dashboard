'use client'

import { useState, useEffect } from 'react'
import { Plus, ShoppingCart, TrendingUp, DollarSign, Calendar, Package, User, Phone, BarChart3, TrendingDown, Wallet, Trash2, CheckSquare, Square, Search } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import CustomSelect from '@/components/ui/CustomSelect'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { ModalBody } from '@/components/ui/ModalParts'
import { useRefreshStore } from '@/store/useRefreshStore'

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
  const { triggerCustomersRefresh, triggerProductsRefresh, triggerReportsRefresh, triggerTransactionsRefresh } = useRefreshStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [reportPeriod, setReportPeriod] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showSalesModal, setShowSalesModal] = useState(false)
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showCustomerDropdown && !target.closest('.customer-dropdown-container')) {
        setShowCustomerDropdown(false)
        setCustomerSearchTerm('')
      }
      if (showProductDropdown && !target.closest('.product-dropdown-container')) {
        setShowProductDropdown(false)
        setProductSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCustomerDropdown, showProductDropdown])

  const fetchData = async () => {
    setLoading(true)
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
        triggerCustomersRefresh()
        triggerProductsRefresh()
        triggerReportsRefresh()
        triggerTransactionsRefresh()
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
    setCustomerSearchTerm('')
    setShowCustomerDropdown(false)
    setProductSearchTerm('')
    setShowProductDropdown(false)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedTransactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(displayedTransactions.map(t => t._id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })

      if (response.ok) {
        await fetchData()
        setSelectedIds([])
        const data = await response.json()
        triggerCustomersRefresh()
        triggerProductsRefresh()
        triggerReportsRefresh()
        triggerTransactionsRefresh()
        showToast(`${data.deletedCount} işlem silindi!`, 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'Silme başarısız!', 'error')
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      showToast('Bir hata oluştu!', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
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

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearchTerm.toLowerCase()
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      customer.phone.includes(customerSearchTerm)
    )
  })

  const selectedCustomer = customers.find(c => c._id === formData.customerId)

  const filteredProducts = products.filter(product => {
    const searchLower = productSearchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower)
    )
  })

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-400" />
            İşlemler
          </h1>
          <p className="text-gray-400">Satış ve iade işlemlerini yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="glass-button btn-danger flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              <span>Seçilileri Sil ({selectedIds.length})</span>
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="glass-button btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <span>Yeni İşlem</span>
          </button>
        </div>
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
          <div className="glass-card ios-shadow p-6 cursor-pointer hover:border-green-500/50 transition-all" onClick={() => setShowSalesModal(true)}>
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
            <div className="lg:col-span-3 relative customer-dropdown-container">
              <label className="block text-sm font-medium text-gray-400 mb-2">Müşteri</label>
              <div className="relative">
                <div 
                  className="input-glass w-full cursor-pointer flex items-center justify-between"
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {selectedCustomer ? (
                      <span>{selectedCustomer.firstName} {selectedCustomer.lastName} - {selectedCustomer.phone}</span>
                    ) : (
                      <span className="text-gray-400">Müşteri seçin veya ara...</span>
                    )}
                  </div>
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                
                {showCustomerDropdown && (
                  <div className="absolute z-50 w-full mt-2 glass-card border border-white/10 rounded-xl max-h-80 overflow-hidden">
                    <div className="p-3 border-b border-white/10 sticky top-0 glass">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="İsim veya telefon ara..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 glass border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer._id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, customerId: customer._id })
                              setShowCustomerDropdown(false)
                              setCustomerSearchTerm('')
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 ${
                              formData.customerId === customer._id ? 'bg-blue-500/10' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {customer.firstName} {customer.lastName}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {customer.phone}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-400 text-sm">
                          Müşteri bulunamadı
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 relative product-dropdown-container">
              <label className="block text-sm font-medium text-gray-400 mb-2">Ürün</label>
              <div className="relative">
                <div 
                  className="input-glass w-full cursor-pointer flex items-center justify-between"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    {selectedProduct ? (
                      <span>{selectedProduct.name} ({selectedProduct.code}) - Stok: {selectedProduct.stock} {selectedProduct.unit}</span>
                    ) : (
                      <span className="text-gray-400">Ürün seçin veya ara...</span>
                    )}
                  </div>
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                
                {showProductDropdown && (
                  <div className="absolute z-50 w-full mt-2 glass-card border border-white/10 rounded-xl max-h-80 overflow-hidden">
                    <div className="p-3 border-b border-white/10 sticky top-0 glass">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Ürün adı veya kodu ara..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 glass border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, productId: product._id })
                              setShowProductDropdown(false)
                              setProductSearchTerm('')
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 ${
                              formData.productId === product._id ? 'bg-blue-500/10' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-gray-400" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-white">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-2">
                                  <span>{product.code}</span>
                                  <span>•</span>
                                  <span className={product.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                                    Stok: {product.stock} {product.unit}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm font-medium text-green-400">
                                {formatCurrency(product.price)}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-400 text-sm">
                          Ürün bulunamadı
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {selectedIds.length === displayedTransactions.length && displayedTransactions.length > 0 ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Müşteri</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ürün</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Miktar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tutar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {displayedTransactions.map((transaction) => (
                <tr 
                  key={transaction._id}
                  className={`transition-colors ${selectedIds.includes(transaction._id) ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                >
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => toggleSelect(transaction._id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {selectedIds.includes(transaction._id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-400" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
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

      {showSalesModal && (
        <Modal
          isOpen={showSalesModal}
          onClose={() => setShowSalesModal(false)}
          title="Tüm Satışlar"
          description={`${reportPeriod === 'all' ? 'Tüm zamanlar' : periodOptions.find(p => p.value === reportPeriod)?.label} için satış detayları`}
          icon={<TrendingUp className="w-6 h-6 text-green-400" />}
          size="xl"
        >
          <ModalBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400">Toplam Satış</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">
                    {formatCurrency(stats.totalSales)}
                  </div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400">İşlem Sayısı</div>
                  <div className="text-2xl font-bold text-blue-400 mt-1">
                    {stats.salesCount}
                  </div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400">Ortalama Satış</div>
                  <div className="text-2xl font-bold text-purple-400 mt-1">
                    {stats.salesCount > 0 ? formatCurrency(stats.totalSales / stats.salesCount) : formatCurrency(0)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-400" />
                  Satış Detayları
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filterTransactionsByPeriod(transactions)
                    .filter(t => t.type === 'satis')
                    .length > 0 ? (
                    filterTransactionsByPeriod(transactions)
                      .filter(t => t.type === 'satis')
                      .map((transaction) => (
                        <div key={transaction._id} className="glass rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <User className="w-5 h-5 text-gray-400 mt-1" />
                              <div>
                                <div className="text-sm font-medium text-white">{transaction.customerName}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  {transaction.customerPhone}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-400">
                                {formatCurrency(transaction.totalPrice)}
                              </div>
                              <div className="text-xs text-gray-400 capitalize">
                                {transaction.paymentMethod}
                                {transaction.paymentMethod === 'kart' && transaction.installments > 1 && (
                                  <span className="ml-1">({transaction.installments}x)</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm border-t border-white/10 pt-3">
                            <div className="flex items-center gap-2 flex-1">
                              <Package className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-white">{transaction.productName}</div>
                                <div className="text-xs text-gray-400">{transaction.productCode}</div>
                              </div>
                            </div>
                            <div className="text-gray-400">x{transaction.quantity}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />
                              {formatDate(transaction.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Bu periyotta satış kaydı yok</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="İşlemleri Sil"
        message={`Seçili ${selectedIds.length} işlemi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve stok miktarı otomatik olarak güncellenecektir.`}
        confirmText="Sil"
        isLoading={isDeleting}
      />
    </div>
  )
}
