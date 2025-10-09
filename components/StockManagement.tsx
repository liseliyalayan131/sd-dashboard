'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, Search, AlertTriangle, TrendingDown, TrendingUp, DollarSign, Wallet, BarChart3 } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CustomSelect from '@/components/ui/CustomSelect'

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

export default function StockManagement() {
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
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

  const fetchProducts = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
    }
  }

  const handleDelete = async (id: string) => {
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
    }
    setDeleteConfirm(null)
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
    setEditingProduct(product)
    setShowForm(true)
  }

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.stock <= p.minStock).length
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0)
  const totalCostValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0)
  const potentialProfit = totalStockValue - totalCostValue

  const categories = Array.from(new Set(products.map(p => p.category).filter(c => c)))
  const categoryOptions = [
    { value: 'all', label: 'Tüm Kategoriler' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-400" />
            Stoklar
          </h1>
          <p className="text-gray-400">Ürün stoklarınızı yönetin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="glass-button btn-primary mt-4 md:mt-0 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <span>Yeni Ürün</span>
        </button>
      </div>

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

      <div className="glass-card p-4 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün adı, kod veya kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full"
          />
        </div>
        <CustomSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
          className="lg:w-64"
        />
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
              <label className="block text-sm font-medium text-gray-400 mb-2">Kategori</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Stok Miktarı</label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock || ''}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="input-glass w-full"
              />
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
              <button type="button" onClick={resetForm} className="glass-button btn-secondary">
                İptal
              </button>
              <button type="submit" className="glass-button btn-primary">
                {editingProduct ? 'Güncelle' : 'Kaydet'}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ürün</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stok</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fiyat</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Değer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredProducts.map((product) => (
                <tr key={product._id}>
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
                    <div className="flex items-center gap-2">
                      {product.stock <= product.minStock && (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      )}
                      <div>
                        <div className={`text-sm font-bold ${product.stock <= product.minStock ? 'text-red-400' : 'text-white'}`}>
                          {product.stock} {product.unit}
                        </div>
                        {product.minStock > 0 && (
                          <div className="text-xs text-gray-400">Min: {product.minStock}</div>
                        )}
                      </div>
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
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm || categoryFilter !== 'all' ? 'Arama kriterlerine uygun ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
            </p>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Ürün Sil"
          message="Bu ürünü silmek istediğinizden emin misiniz?"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
