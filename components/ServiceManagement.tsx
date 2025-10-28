'use client'

import { useState, useEffect } from 'react'
import { Plus, Wrench, Calendar, DollarSign, User, Phone, Package, CheckCircle, XCircle, Edit, Trash2, Search, TrendingUp, TrendingDown, Wallet, Eye, MessageCircle } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import CustomSelect from '@/components/ui/CustomSelect'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
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
  category: string
}

interface Service {
  _id: string
  customerId?: string
  customerName: string
  customerPhone: string
  brand: string
  model: string
  problem: string
  workDone: string
  solution: string
  usedProducts?: Array<{
    productId: string
    productName: string
    productCode: string
    quantity: number
    unitPrice: number
  }>
  partsCost: number
  laborCost: number
  totalCost: number
  status: 'beklemede' | 'devam-ediyor' | 'cozuldu' | 'cozulmedi'
  receivedDate: string
  deliveryDate: string | null
  notes: string
  createdAt: string
}

interface ServiceForm {
  customerId: string
  brand: string
  model: string
  problem: string
  workDone: string
  solution: string
  usedProducts: Array<{
    productId: string
    productName: string
    productCode: string
    quantity: number
    unitPrice: number
  }>
  partsCost: number
  laborCost: number
  status: 'beklemede' | 'devam-ediyor' | 'cozuldu' | 'cozulmedi'
  receivedDate: string
  deliveryDate: string
  notes: string
}

export default function ServiceManagement() {
  const { showToast } = useToast()
  const { shouldRefreshCustomers, shouldRefreshProducts, resetCustomersRefresh, resetProductsRefresh, triggerProductsRefresh, triggerCustomersRefresh, triggerServicesRefresh, triggerReportsRefresh } = useRefreshStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showProductList, setShowProductList] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [reportPeriod, setReportPeriod] = useState<string>('all')
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<Service | null>(null)

  const [formData, setFormData] = useState<ServiceForm>({
    customerId: '',
    brand: '',
    model: '',
    problem: '',
    workDone: '',
    solution: '',
    usedProducts: [],
    partsCost: 0,
    laborCost: 0,
    status: 'beklemede',
    receivedDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (shouldRefreshCustomers || shouldRefreshProducts) {
      fetchData()
      if (shouldRefreshCustomers) resetCustomersRefresh()
      if (shouldRefreshProducts) resetProductsRefresh()
    }
  }, [shouldRefreshCustomers, shouldRefreshProducts])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showCustomerDropdown && !target.closest('.customer-dropdown-container')) {
        setShowCustomerDropdown(false)
        setCustomerSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCustomerDropdown])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [customersRes, servicesRes, productsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/services'),
        fetch('/api/products')
      ])

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData)
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }
    } catch (error) {
      showToast('Veriler yüklenirken hata oluştu', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId || !formData.brand || !formData.model || !formData.problem) {
      showToast('Lütfen zorunlu alanları doldurun', 'error')
      return
    }

    try {
      const selectedCustomer = customers.find(c => c._id === formData.customerId)
      if (!selectedCustomer) {
        showToast('Müşteri bulunamadı', 'error')
        return
      }

      const productsTotal = formData.usedProducts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0)

      const serviceData = {
        ...formData,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        customerPhone: selectedCustomer.phone,
        partsCost: productsTotal + formData.partsCost,
        deliveryDate: formData.deliveryDate || null
      }

      const url = '/api/services'
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { ...serviceData, _id: editingId } : serviceData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }

      showToast(editingId ? 'Servis güncellendi!' : 'Servis eklendi!', 'success')
      if (formData.usedProducts.length > 0) {
        triggerProductsRefresh()
      }
      triggerCustomersRefresh()
      triggerServicesRefresh()
      triggerReportsRefresh()
      resetForm()
      fetchData()
    } catch (error: any) {
      showToast(error.message || 'İşlem başarısız oldu!', 'error')
    }
  }

  const handleAddProduct = (product: Product) => {
    const existing = formData.usedProducts.find(p => p.productId === product._id)
    if (existing) {
      showToast('Bu ürün zaten eklenmiş', 'error')
      return
    }

    setFormData({
      ...formData,
      usedProducts: [
        ...formData.usedProducts,
        {
          productId: product._id,
          productName: product.name,
          productCode: product.code,
          quantity: 1,
          unitPrice: product.price
        }
      ]
    })
    showToast('Ürün eklendi', 'success')
  }

  const handleRemoveProduct = (productId: string) => {
    setFormData({
      ...formData,
      usedProducts: formData.usedProducts.filter(p => p.productId !== productId)
    })
  }

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return
    setFormData({
      ...formData,
      usedProducts: formData.usedProducts.map(p =>
        p.productId === productId ? { ...p, quantity } : p
      )
    })
  }

  const sendWhatsAppNotification = (service: Service) => {
    const cleanPhone = service.customerPhone.replace(/\D/g, '')
    const phone = cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone
    
    let message = ''
    const firstName = service.customerName.split(' ')[0]
    
    switch (service.status) {
      case 'devam-ediyor':
        message = `Merhaba ${firstName}, ${service.brand} ${service.model} servisiniz şu anda devam ediyor. En kısa sürede tamamlanacak.`
        break
      case 'cozuldu':
        message = `Merhaba ${firstName}, ${service.brand} ${service.model} servisiniz tamamlandı! ✅ Teslim alabilirsiniz.`
        break
      case 'cozulmedi':
        message = `Merhaba ${firstName}, ${service.brand} ${service.model} servisinizle ilgili görüşmemiz gerekiyor. Lütfen bizi arayın.`
        break
      case 'beklemede':
        message = `Merhaba ${firstName}, ${service.brand} ${service.model} servisinizi aldık. Değerlendirmemiz tamamlandığında size bilgi vereceğiz.`
        break
    }
    
    const whatsappUrl = `https://wa.me/90${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    showToast('WhatsApp açılıyor...', 'success')
  }

  const updateServiceStatus = async (serviceId: string, newStatus: 'beklemede' | 'devam-ediyor' | 'cozuldu' | 'cozulmedi') => {
    try {
      const service = services.find(s => s._id === serviceId)
      if (!service) return

      const response = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...service,
          status: newStatus
        })
      })

      if (!response.ok) throw new Error('Failed to update')

      showToast('Durum güncellendi!', 'success')
      triggerServicesRefresh()
      triggerReportsRefresh()
      fetchData()
      
      if (selectedServiceDetail) {
        setSelectedServiceDetail({ ...selectedServiceDetail, status: newStatus })
      }
    } catch (error) {
      showToast('Durum güncellenemedi!', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/services?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')

      showToast('Servis silindi!', 'success')
      triggerProductsRefresh()
      triggerCustomersRefresh()
      triggerServicesRefresh()
      triggerReportsRefresh()
      fetchData()
    } catch (error) {
      showToast('Silme işlemi başarısız!', 'error')
    }
    setDeleteConfirm(null)
  }

  const startEdit = (service: Service) => {
    setEditingId(service._id)
    setFormData({
      customerId: service.customerId || '',
      brand: service.brand,
      model: service.model,
      problem: service.problem,
      workDone: service.workDone,
      solution: service.solution,
      usedProducts: service.usedProducts || [],
      partsCost: service.partsCost,
      laborCost: service.laborCost,
      status: service.status,
      receivedDate: service.receivedDate.split('T')[0],
      deliveryDate: service.deliveryDate ? service.deliveryDate.split('T')[0] : '',
      notes: service.notes
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      customerId: '',
      brand: '',
      model: '',
      problem: '',
      workDone: '',
      solution: '',
      usedProducts: [],
      partsCost: 0,
      laborCost: 0,
      status: 'beklemede',
      receivedDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
    setShowProductList(false)
    setCustomerSearchTerm('')
    setShowCustomerDropdown(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'beklemede': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      case 'devam-ediyor': return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'cozuldu': return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'cozulmedi': return 'bg-red-500/10 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'beklemede': return 'Beklemede'
      case 'devam-ediyor': return 'Devam Ediyor'
      case 'cozuldu': return 'Çözüldü'
      case 'cozulmedi': return 'Çözülmedi'
      default: return status
    }
  }

  const filterServicesByPeriod = (services: Service[]) => {
    if (reportPeriod === 'all') return services

    const now = new Date()
    const filtered = services.filter(service => {
      const serviceDate = new Date(service.createdAt)
      
      switch (reportPeriod) {
        case 'today':
          return serviceDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return serviceDate >= weekAgo
        case 'month':
          return serviceDate.getMonth() === now.getMonth() && 
                 serviceDate.getFullYear() === now.getFullYear()
        case 'year':
          return serviceDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })

    return filtered
  }

  const getReportStats = () => {
    const filteredByPeriod = filterServicesByPeriod(services)
    
    const totalRevenue = filteredByPeriod.reduce((sum, s) => sum + s.totalCost, 0)
    const totalLabor = filteredByPeriod.reduce((sum, s) => sum + s.laborCost, 0)
    const totalParts = filteredByPeriod.reduce((sum, s) => sum + s.partsCost, 0)
    const completedCount = filteredByPeriod.filter(s => s.status === 'cozuldu').length

    return {
      totalRevenue,
      totalLabor,
      totalParts,
      completedCount,
      totalCount: filteredByPeriod.length
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearchTerm.toLowerCase()
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      customer.phone.includes(customerSearchTerm)
    )
  })

  const selectedCustomer = customers.find(c => c._id === formData.customerId)

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.customerPhone.includes(searchTerm) ||
      service.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.model.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || service.status === statusFilter
    
    const isNotCompleted = service.status !== 'cozuldu'

    return matchesSearch && matchesStatus && isNotCompleted
  })

  const completedServices = services.filter(service => {
    const matchesSearch = 
      service.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.customerPhone.includes(searchTerm) ||
      service.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.model.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch && service.status === 'cozuldu'
  })

  const filteredProducts = products.filter(product => {
    const searchLower = productSearchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    )
  })

  const stats = getReportStats()

  const customerOptions = customers.map(customer => ({
    value: customer._id,
    label: `${customer.firstName} ${customer.lastName} - ${customer.phone}`
  }))

  const statusOptions = [
    { value: 'beklemede', label: 'Beklemede' },
    { value: 'devam-ediyor', label: 'Devam Ediyor' },
    { value: 'cozuldu', label: 'Çözüldü' },
    { value: 'cozulmedi', label: 'Çözülmedi' }
  ]

  const statusFilterOptions = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'beklemede', label: 'Beklemede' },
    { value: 'devam-ediyor', label: 'Devam Ediyor' },
    { value: 'cozulmedi', label: 'Çözülmedi' }
  ]

  const periodOptions = [
    { value: 'all', label: 'Tüm Zamanlar' },
    { value: 'today', label: 'Bugün' },
    { value: 'week', label: 'Bu Hafta' },
    { value: 'month', label: 'Bu Ay' },
    { value: 'year', label: 'Bu Yıl' }
  ]

  const totalCost = formData.usedProducts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) + formData.partsCost + formData.laborCost

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servis Yönetimi</h1>
          <p className="text-gray-400 mt-2">Servis kayıtlarını yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="glass px-6 py-3 rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Servis
        </button>
      </div>

      <div className="glass-card ios-shadow p-6 space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Servis Raporları
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
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-blue-500/30">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Toplam Gelir</h3>
            <p className="text-2xl font-bold text-blue-400 mt-2">{formatCurrency(stats.totalRevenue)}</p>
            <div className="text-xs text-gray-400 mt-2">
              {stats.totalCount} servis
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-green-500/30">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">İşçilik Geliri (Kar)</h3>
            <p className="text-2xl font-bold text-green-400 mt-2">{formatCurrency(stats.totalLabor)}</p>
            <div className="text-xs text-gray-400 mt-2">
              {stats.totalRevenue > 0 ? Math.round((stats.totalLabor / stats.totalRevenue) * 100) : 0}% oranında
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-red-500/30">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Parça Gideri</h3>
            <p className="text-2xl font-bold text-red-400 mt-2">{formatCurrency(stats.totalParts)}</p>
            <div className="text-xs text-gray-400 mt-2">
              {stats.totalRevenue > 0 ? Math.round((stats.totalParts / stats.totalRevenue) * 100) : 0}% oranında
            </div>
          </div>

          <div className="glass-card ios-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-purple-500/30">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm">Net Kar</h3>
            <p className="text-2xl font-bold text-purple-400 mt-2">{formatCurrency(stats.totalLabor)}</p>
            <div className="text-xs text-gray-400 mt-2">
              {stats.completedCount} tamamlandı
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="glass-card ios-shadow p-6 animate-scale-in">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-400" />
            {editingId ? 'Servis Düzenle' : 'Yeni Servis Kaydı'}
          </h2>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowProductList(!showProductList)}
              className="glass px-6 py-3 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              {showProductList ? 'Ürün Listesini Gizle' : 'Ürün Listesini Göster'}
            </button>

            {showProductList && (
              <div className="mt-4 glass-card p-4 border border-purple-500/20">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 glass border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 glass">
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Ürün</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Stok</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Fiyat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product._id} className="border-b border-white/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Package className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-white">{product.name}</div>
                                <div className="text-xs text-gray-400">{product.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-300">{product.stock}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-green-400">{formatCurrency(product.price)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleAddProduct(product)}
                              className="glass px-3 py-1 rounded-lg border border-green-500/30 hover:border-green-500/50 text-green-400 text-xs transition-all"
                            >
                              Ekle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-400">Ürün bulunamadı</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {formData.usedProducts.length > 0 && (
            <div className="glass-card p-4 border border-blue-500/20 mb-6">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                Seçilen Ürünler ({formData.usedProducts.length})
              </h3>
              <div className="space-y-2">
                {formData.usedProducts.map((product) => (
                  <div key={product.productId} className="glass p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Package className="h-4 w-4 text-blue-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{product.productName}</div>
                        <div className="text-xs text-gray-400">{product.productCode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleProductQuantityChange(product.productId, product.quantity - 1)}
                          className="glass w-7 h-7 rounded flex items-center justify-center border border-white/10 hover:border-blue-500/30 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{product.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleProductQuantityChange(product.productId, product.quantity + 1)}
                          className="glass w-7 h-7 rounded flex items-center justify-center border border-white/10 hover:border-blue-500/30 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-sm font-bold text-green-400 w-24 text-right">
                        {formatCurrency(product.unitPrice * product.quantity)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.productId)}
                        className="text-red-400 hover:text-red-300 p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="glass p-3 rounded-lg border border-blue-500/30 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Ürünler Toplamı:</span>
                    <span className="text-lg font-bold text-blue-400">
                      {formatCurrency(formData.usedProducts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative customer-dropdown-container">
                <label className="block text-sm font-medium mb-2">Müşteri *</label>
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

              <div>
                <label className="block text-sm font-medium mb-2">Durum</label>
                <CustomSelect
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as any })}
                  options={statusOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Marka *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="input-glass w-full"
                  placeholder="Örn: Xiaomi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="input-glass w-full"
                  placeholder="Örn: Mi Electric Scooter Pro 2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Alış Tarihi</label>
                <input
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teslim Tarihi</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Diğer Parça Ücreti (₺)</label>
                <input
                  type="number"
                  value={formData.partsCost}
                  onChange={(e) => setFormData({ ...formData, partsCost: Number(e.target.value) })}
                  className="input-glass w-full"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">İşçilik Ücreti (₺)</label>
                <input
                  type="number"
                  value={formData.laborCost}
                  onChange={(e) => setFormData({ ...formData, laborCost: Number(e.target.value) })}
                  className="input-glass w-full"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="glass-card p-4 border border-blue-500/30">
              <div className="space-y-2">
                {formData.usedProducts.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Seçilen Ürünler:</span>
                    <span className="text-blue-400 font-medium">
                      {formatCurrency(formData.usedProducts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0))}
                    </span>
                  </div>
                )}
                {formData.partsCost > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Diğer Parçalar:</span>
                    <span className="text-blue-400 font-medium">{formatCurrency(formData.partsCost)}</span>
                  </div>
                )}
                {formData.laborCost > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">İşçilik:</span>
                    <span className="text-blue-400 font-medium">{formatCurrency(formData.laborCost)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Toplam Tutar:</span>
                    <span className="text-2xl font-bold text-blue-400">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Arıza / Problem *</label>
              <textarea
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                className="input-glass w-full h-24 resize-none"
                placeholder="Arıza veya problem detaylarını yazın..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Yapılan İşlem</label>
              <textarea
                value={formData.workDone}
                onChange={(e) => setFormData({ ...formData, workDone: e.target.value })}
                className="input-glass w-full h-24 resize-none"
                placeholder="Yapılan işlemleri yazın..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Çözüm</label>
              <textarea
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                className="input-glass w-full h-24 resize-none"
                placeholder="Çözüm detaylarını yazın..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notlar</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-glass w-full h-20 resize-none"
                placeholder="Ek notlar..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 glass px-6 py-3 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 glass px-6 py-3 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card ios-shadow p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wrench className="w-6 h-6 text-blue-400" />
              Aktif Servisler
            </h2>
            <p className="text-gray-400 text-sm mt-1">{filteredServices.length} aktif servis</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Müşteri, marka veya model ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusFilterOptions}
            className="lg:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[200px]">Müşteri</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[180px]">Cihaz</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[300px]">Problem</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[140px]">Durum</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[140px]">Tutar</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[140px]">Tarihler</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[140px]">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-white">{service.customerName}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {service.customerPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-white">{service.brand}</div>
                        <div className="text-sm text-gray-400">{service.model}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <button
                      onClick={() => setSelectedServiceDetail(service)}
                      className="glass px-4 py-2 rounded-lg border border-blue-500/30 hover:border-blue-500/50 text-blue-400 text-sm transition-all flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Problemi Gör
                    </button>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(service.status)}`}>
                      {getStatusText(service.status)}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="text-sm font-bold text-blue-400">{formatCurrency(service.totalCost)}</div>
                    <div className="text-xs text-gray-400">
                      P: {formatCurrency(service.partsCost)}
                    </div>
                    <div className="text-xs text-gray-400">
                      İ: {formatCurrency(service.laborCost)}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <div>{formatDate(service.receivedDate)}</div>
                        {service.deliveryDate && (
                          <div className="text-xs text-green-400">→ {formatDate(service.deliveryDate)}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => sendWhatsAppNotification(service)}
                        className="text-green-400 hover:text-green-300 p-1.5 rounded transition-colors flex-shrink-0"
                        title="WhatsApp ile bildir"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => startEdit(service)}
                        className="text-blue-400 hover:text-blue-300 p-1.5 rounded transition-colors flex-shrink-0"
                        title="Düzenle"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(service._id)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded transition-colors flex-shrink-0"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'all'
                ? 'Arama kriterlerinize uygun servis kaydı bulunamadı'
                : 'Henüz aktif servis kaydı yok'}
            </p>
          </div>
        )}
      </div>

      {completedServices.length > 0 && (
        <div className="glass-card ios-shadow p-6 space-y-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                Çözülen İşlemler
              </h2>
              <p className="text-gray-400 text-sm mt-1">{completedServices.length} tamamlanmış servis</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[200px]">Müşteri</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[180px]">Cihaz</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[300px]">Problem</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[140px]">Tutar</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[140px]">Tarihler</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 w-[140px]">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {completedServices.map((service) => (
                  <tr key={service._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-white">{service.customerName}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {service.customerPhone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-white">{service.brand}</div>
                          <div className="text-sm text-gray-400">{service.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <button
                        onClick={() => setSelectedServiceDetail(service)}
                        className="glass px-4 py-2 rounded-lg border border-blue-500/30 hover:border-blue-500/50 text-blue-400 text-sm transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Problemi Gör
                      </button>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="text-sm font-bold text-green-400">{formatCurrency(service.totalCost)}</div>
                      <div className="text-xs text-gray-400">
                        P: {formatCurrency(service.partsCost)}
                      </div>
                      <div className="text-xs text-gray-400">
                        İ: {formatCurrency(service.laborCost)}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <div>{formatDate(service.receivedDate)}</div>
                          {service.deliveryDate && (
                            <div className="text-xs text-green-400">→ {formatDate(service.deliveryDate)}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => sendWhatsAppNotification(service)}
                          className="text-green-400 hover:text-green-300 p-1.5 rounded transition-colors flex-shrink-0"
                          title="WhatsApp ile bildir"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => startEdit(service)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded transition-colors flex-shrink-0"
                          title="Düzenle"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(service._id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded transition-colors flex-shrink-0"
                          title="Sil"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Servis Sil"
        message="Bu servisi silmek istediğinizden emin misiniz? Kullanılan ürünlerin stoğu otomatik olarak geri eklenecektir."
        onConfirm={() => handleDelete(deleteConfirm!)}
        onClose={() => setDeleteConfirm(null)}
        confirmText="Sil"
      />

      {selectedServiceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedServiceDetail(null)}>
          <div className="glass-card ios-shadow p-6 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Wrench className="w-6 h-6 text-blue-400" />
                Servis Detayları
              </h2>
              <button
                onClick={() => setSelectedServiceDetail(null)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-4 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white">Müşteri Bilgileri</h3>
                </div>
                <div className="space-y-2 pl-8">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Ad Soyad:</span>
                    <span className="text-white font-medium">{selectedServiceDetail.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-white">{selectedServiceDetail.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white">Cihaz Bilgileri</h3>
                </div>
                <div className="space-y-2 pl-8">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Marka:</span>
                    <span className="text-white font-medium">{selectedServiceDetail.brand}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Model:</span>
                    <span className="text-white font-medium">{selectedServiceDetail.model}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 border border-red-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Wrench className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white">Problem</h3>
                </div>
                <p className="text-sm text-gray-300 pl-8 leading-relaxed">{selectedServiceDetail.problem}</p>
              </div>

              {selectedServiceDetail.workDone && (
                <div className="glass-card p-4 border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Wrench className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold text-white">Yapılan İşlem</h3>
                  </div>
                  <p className="text-sm text-gray-300 pl-8 leading-relaxed">{selectedServiceDetail.workDone}</p>
                </div>
              )}

              {selectedServiceDetail.solution && (
                <div className="glass-card p-4 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h3 className="font-bold text-white">Çözüm</h3>
                  </div>
                  <p className="text-sm text-gray-300 pl-8 leading-relaxed">{selectedServiceDetail.solution}</p>
                </div>
              )}

              {selectedServiceDetail.usedProducts && selectedServiceDetail.usedProducts.length > 0 && (
                <div className="glass-card p-4 border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white">Kullanılan Ürünler</h3>
                  </div>
                  <div className="space-y-2 pl-8">
                    {selectedServiceDetail.usedProducts.map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm glass p-2 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{product.productName}</div>
                          <div className="text-xs text-gray-400">{product.productCode}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white">x{product.quantity}</div>
                          <div className="text-xs text-green-400">{formatCurrency(product.unitPrice * product.quantity)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-card p-4 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white">Maliyet Bilgileri</h3>
                </div>
                <div className="space-y-3 pl-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Parça Ücreti:</span>
                    <span className="text-white font-medium">{formatCurrency(selectedServiceDetail.partsCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">İşçilik Ücreti:</span>
                    <span className="text-white font-medium">{formatCurrency(selectedServiceDetail.laborCost)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-medium">Toplam Tutar:</span>
                      <span className="text-blue-400 text-xl font-bold">{formatCurrency(selectedServiceDetail.totalCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      Alış Tarihi
                    </div>
                    <div className="text-white font-medium">{formatDate(selectedServiceDetail.receivedDate)}</div>
                  </div>
                  {selectedServiceDetail.deliveryDate && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Calendar className="w-4 h-4" />
                        Teslim Tarihi
                      </div>
                      <div className="text-green-400 font-medium">{formatDate(selectedServiceDetail.deliveryDate)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Durum</div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedServiceDetail.status)}`}>
                      {getStatusText(selectedServiceDetail.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 border border-purple-500/20">
                <h3 className="text-sm font-bold mb-3 text-purple-400">Durum Değiştir</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => updateServiceStatus(selectedServiceDetail._id, 'beklemede')}
                    disabled={selectedServiceDetail.status === 'beklemede'}
                    className={`glass px-4 py-3 rounded-lg border transition-all text-sm ${
                      selectedServiceDetail.status === 'beklemede'
                        ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300 cursor-not-allowed'
                        : 'border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Calendar className="w-4 h-4" />
                      Beklemeye Al
                    </div>
                  </button>
                  <button
                    onClick={() => updateServiceStatus(selectedServiceDetail._id, 'devam-ediyor')}
                    disabled={selectedServiceDetail.status === 'devam-ediyor'}
                    className={`glass px-4 py-3 rounded-lg border transition-all text-sm ${
                      selectedServiceDetail.status === 'devam-ediyor'
                        ? 'border-blue-500/50 bg-blue-500/20 text-blue-300 cursor-not-allowed'
                        : 'border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Wrench className="w-4 h-4" />
                      Devam Ediyor
                    </div>
                  </button>
                  <button
                    onClick={() => updateServiceStatus(selectedServiceDetail._id, 'cozuldu')}
                    disabled={selectedServiceDetail.status === 'cozuldu'}
                    className={`glass px-4 py-3 rounded-lg border transition-all text-sm ${
                      selectedServiceDetail.status === 'cozuldu'
                        ? 'border-green-500/50 bg-green-500/20 text-green-300 cursor-not-allowed'
                        : 'border-green-500/30 hover:border-green-500/50 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <CheckCircle className="w-4 h-4" />
                      Çözüldü
                    </div>
                  </button>
                </div>
              </div>

              {selectedServiceDetail.notes && (
                <div className="glass-card p-4 border border-gray-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Edit className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-white">Notlar</h3>
                  </div>
                  <p className="text-sm text-gray-300 pl-8 leading-relaxed">{selectedServiceDetail.notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => sendWhatsAppNotification(selectedServiceDetail)}
                  className="flex-1 glass px-6 py-3 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Gönder
                </button>
                <button
                  onClick={() => {
                    startEdit(selectedServiceDetail)
                    setSelectedServiceDetail(null)
                  }}
                  className="flex-1 glass px-6 py-3 rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
