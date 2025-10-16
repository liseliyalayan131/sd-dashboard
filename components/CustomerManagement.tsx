'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, User, Phone, Mail, Search, Calendar, DollarSign, ShoppingCart, Wrench, Package, CheckSquare, Square } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { ModalBody } from '@/components/ui/ModalParts'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface Customer {
  _id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  notes: string
  totalSpent: number
  visitCount: number
  createdAt: string
}

interface CustomerForm {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  notes: string
}

interface CustomerDetails {
  customer: Customer
  transactions: any[]
  services: any[]
  receivables: any[]
}

export default function CustomerManagement() {
  const { showToast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteBulkConfirm, setDeleteBulkConfirm] = useState(false)
  const [formData, setFormData] = useState<CustomerForm>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerDetails(selectedCustomer)
    }
  }, [selectedCustomer])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Müşteriler alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerDetails = async (customerId: string) => {
    setDetailsLoading(true)
    try {
      const customer = customers.find(c => c._id === customerId)
      if (!customer) {
        setDetailsLoading(false)
        return
      }

      const [transactionsRes, servicesRes, receivablesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/services'),
        fetch('/api/receivables')
      ])

      const allTransactions = transactionsRes.ok ? await transactionsRes.json() : []
      const allServices = servicesRes.ok ? await servicesRes.json() : []
      const allReceivables = receivablesRes.ok ? await receivablesRes.json() : []

      const customerTransactions = allTransactions.filter((t: any) => 
        t.customerPhone === customer.phone
      )
      const customerServices = allServices.filter((s: any) => 
        s.customerPhone === customer.phone
      )
      const customerReceivables = allReceivables.filter((r: any) => 
        r.customerPhone === customer.phone
      )

      setCustomerDetails({
        customer,
        transactions: customerTransactions,
        services: customerServices,
        receivables: customerReceivables
      })
    } catch (error) {
      console.error('Müşteri detayları alınamadı:', error)
      showToast('Detaylar yüklenirken hata oluştu', 'error')
    } finally {
      setDetailsLoading(false)
    }
  }

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toLocaleUpperCase('tr-TR') + str.slice(1).toLocaleLowerCase('tr-TR')
  }

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('0')) {
      const withoutZero = digits.slice(1)
      if (withoutZero.length === 10) {
        return `${withoutZero.slice(0,3)} ${withoutZero.slice(3,6)} ${withoutZero.slice(6,10)}`
      }
    }
    if (digits.length === 10) {
      return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,10)}`
    }
    return phone
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formattedData = {
      ...formData,
      firstName: capitalizeFirstLetter(formData.firstName.trim()),
      lastName: formData.lastName.trim().toLocaleUpperCase('tr-TR'),
      phone: formatPhone(formData.phone.trim())
    }
    
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer._id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      })

      if (response.ok) {
        await fetchCustomers()
        resetForm()
        showToast(editingCustomer ? 'Müşteri güncellendi!' : 'Müşteri eklendi!', 'success')
      } else {
        showToast('İşlem başarısız!', 'error')
      }
    } catch (error) {
      console.error('Müşteri kaydedilemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchCustomers()
        showToast('Müşteri silindi!', 'success')
      } else {
        showToast('Silme işlemi başarısız!', 'error')
      }
    } catch (error) {
      console.error('Müşteri silinemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    }
    setDeleteConfirm(null)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredCustomers.map(c => c._id))
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
    try {
      await Promise.all(
        selectedIds.map(id => 
          fetch(`/api/customers/${id}`, { method: 'DELETE' })
        )
      )
      await fetchCustomers()
      setSelectedIds([])
      setDeleteBulkConfirm(false)
      showToast(`${selectedIds.length} müşteri silindi!`, 'success')
    } catch (error) {
      console.error('Toplu silme hatası:', error)
      showToast('Bir hata oluştu!', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    })
    setEditingCustomer(null)
    setShowForm(false)
  }

  const startEdit = (customer: Customer) => {
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes
    })
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase()
    return (
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchLower)
    )
  })

  const {
    displayedItems: displayedCustomers,
    hasMore,
    isLoading: isLoadingMore,
    observerTarget,
    totalItems,
    displayedCount
  } = useInfiniteScroll(filteredCustomers, { itemsPerPage: 50 })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'beklemede': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      case 'devam-ediyor': return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'cozuldu': return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'cozulmedi': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'odendi': return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'odenmedi': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'beklemede': return 'Beklemede'
      case 'devam-ediyor': return 'Devam Ediyor'
      case 'cozuldu': return 'Çözüldü'
      case 'cozulmedi': return 'Çözülmedi'
      case 'odendi': return 'Ödendi'
      case 'odenmedi': return 'Ödenmedi'
      default: return status
    }
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
            <User className="h-8 w-8 text-blue-400" />
            Müşteriler
          </h1>
          <p className="text-gray-400">Müşteri bilgilerini yönetin</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setDeleteBulkConfirm(true)} 
              className="glass-button bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              <span>Seçilenleri Sil ({selectedIds.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="glass-button btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Yeni Müşteri</span>
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="glass-card bg-blue-950/20 border border-blue-500/30 p-4 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">{selectedIds.length} müşteri seçildi</span>
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
            <span>Toplam {totalItems} müşteriden {displayedCount} tanesi gösteriliyor</span>
            {hasMore && <span className="text-blue-400">Daha fazla görmek için aşağı kaydırın</span>}
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="İsim, telefon veya email ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full"
          />
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-scale-in">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Ad</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Soyad</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Telefon</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Adres</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Notlar</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button type="button" onClick={resetForm} className="glass-button btn-secondary">
                İptal
              </button>
              <button type="submit" className="glass-button btn-primary">
                {editingCustomer ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Müşteri</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">İletişim</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Toplam</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {displayedCustomers.map((customer) => (
                <tr key={customer._id} className={selectedIds.includes(customer._id) ? 'bg-blue-500/5' : ''}>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelect(customer._id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {selectedIds.includes(customer._id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <button
                          onClick={() => setSelectedCustomer(customer._id)}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {customer.firstName} {customer.lastName}
                        </button>
                        {customer.address && (
                          <div className="text-sm text-gray-400">{customer.address}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-300">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-300">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-bold text-green-400">
                      {formatCurrency(customer.totalSpent)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {customer.visitCount} ziyaret
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(customer)}
                        className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(customer._id)}
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
        
        {displayedCustomers.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? 'Arama kriterlerine uygun müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
            </p>
          </div>
        )}
      </div>

      {selectedCustomer && customerDetails && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => {
            setSelectedCustomer(null)
            setCustomerDetails(null)
          }}
          title={`${customerDetails.customer.firstName} ${customerDetails.customer.lastName}`}
          description={customerDetails.customer.phone}
          icon={<User className="w-6 h-6 text-blue-400" />}
          size="xl"
        >
          {detailsLoading ? (
            <ModalBody>
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </ModalBody>
          ) : (
            <ModalBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4">
                    <div className="text-sm text-gray-400 mb-1">Toplam Harcama</div>
                    <div className="text-xl font-bold text-green-400">
                      {formatCurrency(
                        customerDetails.transactions.reduce((sum, t) => sum + t.totalPrice, 0) +
                        customerDetails.services.reduce((sum, s) => sum + (s.totalCost || 0), 0)
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(customerDetails.transactions.reduce((sum, t) => sum + t.totalPrice, 0))} alışveriş + {formatCurrency(customerDetails.services.reduce((sum, s) => sum + (s.totalCost || 0), 0))} servis
                    </div>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-sm text-gray-400">Alışveriş Sayısı</div>
                    <div className="text-xl font-bold text-blue-400 mt-1">
                      {customerDetails.transactions.length}
                    </div>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-sm text-gray-400">Servis Sayısı</div>
                    <div className="text-xl font-bold text-purple-400 mt-1">
                      {customerDetails.services.length}
                    </div>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-sm text-gray-400">Alacak/Verecek</div>
                    <div className="text-xl font-bold text-yellow-400 mt-1">
                      {customerDetails.receivables.filter(r => r.status === 'odenmedi').length}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-green-400" />
                      Alışveriş Geçmişi
                    </h3>
                    <div className="glass-card px-4 py-2">
                      <div className="text-xs text-gray-400">Toplam Alışveriş</div>
                      <div className="text-lg font-bold text-green-400">
                        {formatCurrency(customerDetails.transactions.reduce((sum, t) => sum + t.totalPrice, 0))}
                      </div>
                    </div>
                  </div>
                  {customerDetails.transactions.length > 0 ? (
                    <div className="space-y-2">
                      {customerDetails.transactions.map((transaction) => (
                        <div key={transaction._id} className="glass rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-blue-400" />
                            <div>
                              <div className="text-sm font-medium">{transaction.productName}</div>
                              <div className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-400">
                              {formatCurrency(transaction.totalPrice)}
                            </div>
                            <div className="text-xs text-gray-400">{transaction.quantity} adet</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">Alışveriş geçmişi yok</div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-yellow-400" />
                      Servis Geçmişi
                    </h3>
                    <div className="glass-card px-4 py-2">
                      <div className="text-xs text-gray-400">Toplam Servis Harcaması</div>
                      <div className="text-lg font-bold text-purple-400">
                        {formatCurrency(customerDetails.services.reduce((sum, s) => sum + (s.totalCost || 0), 0))}
                      </div>
                    </div>
                  </div>
                  {customerDetails.services.length > 0 ? (
                    <div className="space-y-2">
                      {customerDetails.services.map((service) => (
                        <div key={service._id} className="glass rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{service.brand} {service.model}</div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                              {getStatusText(service.status)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mb-2">{service.problem}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div className="glass rounded-lg p-2">
                              <div className="text-gray-400">Parça</div>
                              <div className="font-bold text-blue-400">{formatCurrency(service.partsCost || 0)}</div>
                            </div>
                            <div className="glass rounded-lg p-2">
                              <div className="text-gray-400">İşçilik</div>
                              <div className="font-bold text-green-400">{formatCurrency(service.laborCost || 0)}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                            <div>{formatDate(service.createdAt)}</div>
                            <div className="font-bold text-purple-400">{formatCurrency(service.totalCost || 0)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">Servis geçmişi yok</div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-400" />
                    Alacak/Verecek Durumu
                  </h3>
                  {customerDetails.receivables.length > 0 ? (
                    <div className="space-y-2">
                      {customerDetails.receivables.map((receivable) => (
                        <div key={receivable._id} className="glass rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{receivable.description}</div>
                            <div className="text-xs text-gray-400">{formatDate(receivable.createdAt)}</div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div className={`text-sm font-bold ${receivable.type === 'alacak' ? 'text-green-400' : 'text-red-400'}`}>
                              {receivable.type === 'alacak' ? '+' : '-'}{formatCurrency(receivable.amount)}
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(receivable.status)}`}>
                              {getStatusText(receivable.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">Alacak/verecek kaydı yok</div>
                  )}
                </div>
              </div>
            </ModalBody>
          )}
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Müşteri Sil"
          message="Bu müşteriyi silmek istediğinizden emin misiniz?"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {deleteBulkConfirm && (
        <ConfirmDialog
          title="Toplu Silme"
          message={`${selectedIds.length} müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setDeleteBulkConfirm(false)}
        />
      )}
    </div>
  )
}
