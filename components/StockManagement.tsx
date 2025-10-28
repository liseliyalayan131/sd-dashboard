'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, Search, AlertTriangle, TrendingDown, TrendingUp, DollarSign, Wallet, BarChart3, History, Clock, CheckSquare, Square, Download, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CustomSelect from '@/components/ui/CustomSelect'
import Modal from '@/components/ui/Modal'
import { ModalBody, ModalFooter } from '@/components/ui/ModalParts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useRefreshStore } from '@/store/useRefreshStore'

interface Product {
  _id: string
  name: string
  code: string
  category: string
  stock: number
  minStock: number
  price: number
  costPrice: number
  description: string
  unit: string
  createdAt: string
}

interface ProductForm {
  name: string
  code: string
  category: string
  stock: number
  minStock: number
  price: number
  costPrice: number
  description: string
  unit: string
}

interface StockMovement {
  _id: string
  productId: string
  productName: string
  productCode: string
  type: string
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  relatedType: string
  notes: string
  createdAt: string
}

interface StockAdjustmentForm {
  quantity: number
  type: 'giris' | 'cikis' | 'duzeltme'
  reason: string
  notes: string
}

export default function StockManagement() {
  const { showToast } = useToast()
  const { shouldRefreshProducts, resetProductsRefresh } = useRefreshStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showMovementsModal, setShowMovementsModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [selectedProductForMovements, setSelectedProductForMovements] = useState<Product | null>(null)
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteBulkConfirm, setDeleteBulkConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [noStock, setNoStock] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustmentForm>({
    quantity: 0,
    type: 'giris',
    reason: '',
    notes: ''
  })
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    code: '',
    category: '',
    stock: 0,
    minStock: 0,
    price: 0,
    costPrice: 0,
    description: '',
    unit: 'Adet'
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (shouldRefreshProducts) {
      fetchProducts()
      resetProductsRefresh()
    }
  }, [shouldRefreshProducts])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Ürünler alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/products/export')
      if (!response.ok) throw new Error('Export failed')
      
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stoklar-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showToast(`${data.count} ürün dışa aktarıldı!`, 'success')
    } catch (error) {
      showToast('Dışa aktarma başarısız!', 'error')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      
      if (!jsonData.data || !Array.isArray(jsonData.data)) {
        throw new Error('Geçersiz dosya formatı')
      }

      const replaceAll = confirm(
        'Tüm mevcut stokları sil ve yenileriyle değiştir?\n\n' +
        'EVET: Tüm stoklar silinir, sadece yüklenen dosyadakiler kalır\n' +
        'HAYIR: Mevcut stoklar korunur, yeni olanlar eklenir, aynı kodlular güncellenir'
      )

      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: jsonData.data,
          replaceAll
        })
      })

      if (!response.ok) throw new Error('Import failed')
      
      const result = await response.json()
      showToast(result.message, 'success')
      
      if (result.errors && result.errors.length > 0) {
        console.error('Import errors:', result.errors)
      }
      
      fetchProducts()
    } catch (error) {
      showToast('İçe aktarma başarısız! Dosya formatını kontrol edin.', 'error')
      console.error(error)
    }
    
    event.target.value = ''
  }

  const fetchMovements = async (productId: string) => {
    setLoadingMovements(true)
    try {
      const response = await fetch(`/api/stock-movements?productId=${productId}`)
      if (response.ok) {
        const data = await response.json()
        setMovements(data)
      }
    } catch (error) {
      console.error('Hareketler alınamadı:', error)
    } finally {
      setLoadingMovements(false)
    }
  }

  const handleShowMovements = async (product: Product) => {
    setSelectedProductForMovements(product)
    setShowMovementsModal(true)
    await fetchMovements(product._id)
  }

  const handleShowAdjustment = (product: Product) => {
    setSelectedProductForAdjustment(product)
    setShowAdjustmentModal(true)
    setAdjustmentForm({
      quantity: 0,
      type: 'giris',
      reason: '',
      notes: ''
    })
  }

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProductForAdjustment || adjustmentForm.quantity <= 0) {
      showToast('Lütfen geçerli bir miktar girin', 'warning')
      return
    }

    try {
      const product = selectedProductForAdjustment
      const previousStock = product.stock
      let newStock = product.stock

      if (adjustmentForm.type === 'giris') {
        newStock += adjustmentForm.quantity
      } else if (adjustmentForm.type === 'cikis') {
        newStock -= adjustmentForm.quantity
      } else {
        newStock = adjustmentForm.quantity
      }

      if (newStock < 0) {
        showToast('Stok negatif olamaz!', 'error')
        return
      }

      const updateResponse = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, stock: newStock })
      })

      if (!updateResponse.ok) {
        showToast('Stok güncellenemedi!', 'error')
        return
      }

      await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          productName: product.name,
          productCode: product.code,
          type: adjustmentForm.type,
          quantity: adjustmentForm.quantity,
          previousStock,
          newStock,
          reason: adjustmentForm.reason,
          relatedType: 'manual',
          notes: adjustmentForm.notes
        })
      })

      await fetchProducts()
      setShowAdjustmentModal(false)
      setSelectedProductForAdjustment(null)
      showToast('Stok başarıyla güncellendi!', 'success')
    } catch (error) {
      console.error('Stok düzeltme hatası:', error)
      showToast('Bir hata oluştu!', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category) {
      showToast('Lütfen kategori seçin!', 'warning')
      return
    }
    
    const submitData = {
      ...formData,
      stock: noStock ? 0 : formData.stock
    }
    
    setIsSubmitting(true)
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        await fetchProducts()
        resetForm()
        showToast(editingProduct ? 'Ürün güncellendi!' : 'Ürün eklendi!', 'success')
      } else {
        showToast('İşlem başarısız!', 'error')
      }
    } catch (error) {
      console.error('Ürün kaydedilemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchProducts()
        showToast('Ürün silindi!', 'success')
      } else {
        showToast('Silme işlemi başarısız!', 'error')
      }
    } catch (error) {
      console.error('Ürün silinemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map(p => p._id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      await Promise.all(
        selectedIds.map(id => 
          fetch(`/api/products/${id}`, { method: 'DELETE' })
        )
      )
      await fetchProducts()
      setSelectedIds([])
      setDeleteBulkConfirm(false)
      showToast(`${selectedIds.length} ürün silindi!`, 'success')
    } catch (error) {
      console.error('Toplu silme hatası:', error)
      showToast('Bir hata oluştu!', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: '',
      stock: 0,
      minStock: 0,
      price: 0,
      costPrice: 0,
      description: '',
      unit: 'Adet'
    })
    setNoStock(false)
    setEditingProduct(null)
    setShowForm(false)
  }

  const startEdit = (product: Product) => {
    setFormData({
      name: product.name,
      code: product.code,
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      price: product.price,
      costPrice: product.costPrice,
      description: product.description,
      unit: product.unit
    })
    setNoStock(product.stock === 0)
    setEditingProduct(product)
    setShowForm(true)
  }

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)

    return matchesSearch
  })

  const {
    displayedItems: displayedProducts,
    hasMore,
    isLoading: isLoadingMore,
    observerTarget,
    totalItems,
    displayedCount
  } = useInfiniteScroll(filteredProducts, { itemsPerPage: 50 })

  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.stock <= p.minStock).length
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0)
  const totalCostValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0)
  const potentialProfit = totalStockValue - totalCostValue

  const categories = Array.from(new Set(products.map(p => p.category).filter(c => c)))
  
  const predefinedCategories = [
    'Elektrikli Scooter',
    'Yedek Parça',
    'Aksesuar',
    'Batarya',
    'Güvenlik',
    'Bakım',
    'Diğer'
  ]
  
  const categoryFormOptions = predefinedCategories.map(cat => ({ value: cat, label: cat }))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock > minStock * 2) {
      return {
        color: 'bg-green-500',
        text: 'Bol',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/30'
      }
    } else if (stock > minStock) {
      return {
        color: 'bg-yellow-500',
        text: 'Orta',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/30'
      }
    } else {
      return {
        color: 'bg-red-500',
        text: 'Az',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/30'
      }
    }
  }

  const getStockPercentage = (stock: number, minStock: number) => {
    const maxStock = minStock * 3
    const percentage = Math.min((stock / maxStock) * 100, 100)
    return Math.max(percentage, 5)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-400" />
            Stoklar
          </h1>
          <p className="text-gray-400">Ürün stoklarınızı yönetin</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file-stock"
          />
          <button
            onClick={handleExport}
            className="glass-button bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            <span>Dışa Aktar</span>
          </button>
          <label
            htmlFor="import-file-stock"
            className="glass-button bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Upload className="h-5 w-5" />
            <span>İçe Aktar</span>
          </label>
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setDeleteBulkConfirm(true)} 
              className="glass-button bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              <span>Seçilenleri Sil ({selectedIds.length})</span>
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="glass-button btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <span>Yeni Ürün</span>
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="glass-card bg-blue-950/20 border border-blue-500/30 p-4 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">{selectedIds.length} ürün seçildi</span>
          </div>
          <button 
            onClick={() => setSelectedIds([])} 
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Seçimi Temizle
          </button>
        </div>
      )}

      {totalItems > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Toplam {totalItems} üründen {displayedCount} tanesi gösteriliyor</span>
            {hasMore && <span className="text-blue-400">Daha fazla görmek için aşağı kaydırın</span>}
          </div>
        </div>
      )}

      <div className="glass-card ios-shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Stok Raporları
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-blue-500/30">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Toplam Ürün</h3>
            <p className="text-2xl font-bold text-blue-400 mt-2">{totalProducts}</p>
            <div className="text-xs text-gray-400 mt-2">
              {categories.length} kategori
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Düşük Stok</h3>
            <p className="text-2xl font-bold text-red-400 mt-2">{lowStockProducts}</p>
            <div className="text-xs text-gray-400 mt-2">
              {totalProducts > 0 ? Math.round((lowStockProducts / totalProducts) * 100) : 0}% oranında
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-green-500/30">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Stok Değeri (Satış)</h3>
            <p className="text-2xl font-bold text-green-400 mt-2">{formatCurrency(totalStockValue)}</p>
            <div className="text-xs text-gray-400 mt-2">
              Toplam satış değeri
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-purple-500/30">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Potansiyel Kar</h3>
            <p className="text-2xl font-bold text-purple-400 mt-2">{formatCurrency(potentialProfit)}</p>
            <div className="text-xs text-gray-400 mt-2">
              Maliyet: {formatCurrency(totalCostValue)}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün adı, kod veya kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full"
          />
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-scale-in">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Ürün Adı</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Ürün Kodu</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Kategori *</label>
              <CustomSelect
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                options={categoryFormOptions}
                placeholder="Kategori seçin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Stok Miktarı</label>
              <input
                type="number"
                required={!noStock}
                min="0"
                disabled={noStock}
                value={noStock ? 0 : (formData.stock || '')}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className={`input-glass w-full ${noStock ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <button
                type="button"
                onClick={() => setNoStock(!noStock)}
                className="flex items-center gap-2 mt-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {noStock ? (
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Stok Yok (0)</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Stok</label>
              <input
                type="number"
                min="0"
                value={formData.minStock || ''}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Birim</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Satış Fiyatı (₺)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Maliyet Fiyatı (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice || ''}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="input-glass w-full"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-400 mb-2">Açıklama</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div className="lg:col-span-3 flex justify-end gap-3 pt-4">
              <button type="button" onClick={resetForm} disabled={isSubmitting} className="glass-button btn-secondary">
                İptal
              </button>
              <button type="submit" disabled={isSubmitting} className="glass-button btn-primary flex items-center gap-2">
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{editingProduct ? 'Güncelle' : 'Kaydet'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ürün</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stok</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fiyat</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Değer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {displayedProducts.map((product) => (
                <tr key={product._id} className={selectedIds.includes(product._id) ? 'bg-blue-500/5' : ''}>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelect(product._id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {selectedIds.includes(product._id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{product.name}</div>
                        <div className="text-sm text-gray-400">{product.code}</div>
                        {product.category && (
                          <div className="text-xs text-blue-400">{product.category}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {product.stock <= product.minStock && (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          )}
                          <div className={`text-sm font-bold ${getStockStatus(product.stock, product.minStock).textColor}`}>
                            {product.stock} {product.unit}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStockStatus(product.stock, product.minStock).borderColor} ${getStockStatus(product.stock, product.minStock).textColor}`}>
                          {getStockStatus(product.stock, product.minStock).text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${getStockStatus(product.stock, product.minStock).color} transition-all duration-300`}
                          style={{ width: `${getStockPercentage(product.stock, product.minStock)}%` }}
                        />
                      </div>
                      {product.minStock > 0 && (
                        <div className="text-xs text-gray-400">Min: {product.minStock} {product.unit}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-green-400">
                      {formatCurrency(product.price)}
                    </div>
                    {product.costPrice > 0 && (
                      <div className="text-xs text-gray-400">
                        Maliyet: {formatCurrency(product.costPrice)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-bold text-blue-400">
                      {formatCurrency(product.stock * product.price)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowMovements(product)}
                        className="text-purple-400 hover:text-purple-300 p-1 transition-colors"
                        title="Stok Hareketleri"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleShowAdjustment(product)}
                        className="text-green-400 hover:text-green-300 p-1 transition-colors"
                        title="Stok Düzelt"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => startEdit(product)}
                        className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product._id)}
                        className="text-red-400 hover:text-red-300 p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
        
        {displayedProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? 'Arama kriterlerine uygun ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
            </p>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Ürün Sil"
          message="Bu ürünü silmek istediğinizden emin misiniz?"
          onConfirm={() => handleDelete(deleteConfirm)}
          isLoading={isDeleting}
        />
      )}

      {deleteBulkConfirm && (
        <ConfirmDialog
          isOpen={deleteBulkConfirm}
          onClose={() => setDeleteBulkConfirm(false)}
          title="Toplu Silme"
          message={`${selectedIds.length} ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          onConfirm={handleBulkDelete}
          isLoading={isDeleting}
        />
      )}

      {showMovementsModal && selectedProductForMovements && (
        <Modal
          isOpen={showMovementsModal}
          onClose={() => {
            setShowMovementsModal(false)
            setSelectedProductForMovements(null)
            setMovements([])
          }}
          title="Stok Hareketleri"
          description={`${selectedProductForMovements.name} - ${selectedProductForMovements.code}`}
          icon={<History className="w-6 h-6 text-purple-400" />}
          size="lg"
        >
          <ModalBody>
            {loadingMovements ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : movements.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {movements.map((movement) => (
                  <div key={movement._id} className="glass-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 glass rounded-lg flex items-center justify-center ${
                          movement.type === 'giris' || movement.type === 'iade' 
                            ? 'border border-green-500/30' 
                            : movement.type === 'satis' || movement.type === 'cikis' || movement.type === 'servis'
                            ? 'border border-red-500/30'
                            : 'border border-blue-500/30'
                        }`}>
                          {movement.type === 'giris' || movement.type === 'iade' ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          ) : movement.type === 'satis' || movement.type === 'cikis' || movement.type === 'servis' ? (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          ) : (
                            <Package className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white capitalize">
                            {movement.type === 'giris' ? 'Stok Girişi' :
                             movement.type === 'cikis' ? 'Stok Çıkışı' :
                             movement.type === 'duzeltme' ? 'Stok Düzeltme' :
                             movement.type === 'satis' ? 'Satış' :
                             movement.type === 'iade' ? 'İade' :
                             movement.type === 'servis' ? 'Servis' : movement.type}
                          </div>
                          <div className="text-xs text-gray-400">{movement.reason || 'Sebep belirtilmemiş'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          movement.type === 'giris' || movement.type === 'iade' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {movement.type === 'giris' || movement.type === 'iade' ? '+' : '-'}{movement.quantity}
                        </div>
                        <div className="text-xs text-gray-400">
                          {movement.previousStock} → {movement.newStock}
                        </div>
                      </div>
                    </div>
                    {movement.notes && (
                      <div className="text-xs text-gray-400 mt-2 pl-13">
                        {movement.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pl-13">
                      <Clock className="w-3 h-3" />
                      {new Date(movement.createdAt).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Henüz stok hareketi yok
              </div>
            )}
          </ModalBody>
        </Modal>
      )}

      {showAdjustmentModal && selectedProductForAdjustment && (
        <Modal
          isOpen={showAdjustmentModal}
          onClose={() => {
            setShowAdjustmentModal(false)
            setSelectedProductForAdjustment(null)
          }}
          title="Stok Düzeltme"
          description={`${selectedProductForAdjustment.name} - Mevcut: ${selectedProductForAdjustment.stock} ${selectedProductForAdjustment.unit}`}
          icon={<TrendingUp className="w-6 h-6 text-green-400" />}
          size="md"
        >
          <form onSubmit={handleAdjustmentSubmit}>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">İşlem Türü</label>
                  <CustomSelect
                    value={adjustmentForm.type}
                    onChange={(value) => setAdjustmentForm({ ...adjustmentForm, type: value as any })}
                    options={[
                      { value: 'giris', label: 'Stok Girişi (+)' },
                      { value: 'cikis', label: 'Stok Çıkışı (-)' },
                      { value: 'duzeltme', label: 'Stok Düzeltme (=)' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {adjustmentForm.type === 'duzeltme' ? 'Yeni Stok Miktarı' : 'Miktar'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={adjustmentForm.quantity || ''}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: parseInt(e.target.value) || 0 })}
                    className="input-glass w-full"
                  />
                  {adjustmentForm.quantity > 0 && adjustmentForm.type !== 'duzeltme' && (
                    <div className="text-xs text-gray-400 mt-2">
                      Yeni stok: {adjustmentForm.type === 'giris' 
                        ? selectedProductForAdjustment.stock + adjustmentForm.quantity 
                        : selectedProductForAdjustment.stock - adjustmentForm.quantity} {selectedProductForAdjustment.unit}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Sebep *</label>
                  <input
                    type="text"
                    required
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="input-glass w-full"
                    placeholder="Örn: Sayım farkı, Fire, Yeni alım"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Notlar</label>
                  <textarea
                    rows={2}
                    value={adjustmentForm.notes}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                    className="input-glass w-full"
                    placeholder="Ek açıklama..."
                  />
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <button
                type="button"
                onClick={() => {
                  setShowAdjustmentModal(false)
                  setSelectedProductForAdjustment(null)
                }}
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
      )}
    </div>
  )
}
