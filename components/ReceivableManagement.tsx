'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Search
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CustomSelect from '@/components/ui/CustomSelect'

interface Customer {
  _id: string
  firstName: string
  lastName: string
  phone: string
}

interface Receivable {
  _id: string
  customerId: string
  customerName: string
  customerPhone: string
  amount: number
  description: string
  type: 'alacak' | 'verecek'
  status: 'odenmedi' | 'odendi'
  dueDate?: string
  paidDate?: string
  notes: string
  createdAt: string
}

interface ReceivableForm {
  customerId: string
  amount: number
  description: string
  type: 'alacak' | 'verecek'
  status: 'odenmedi' | 'odendi'
  dueDate: string
  notes: string
}

export default function ReceivableManagement() {
  const { showToast } = useToast()
  const formRef = useRef<HTMLDivElement>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<ReceivableForm>({
    customerId: '',
    amount: 0,
    description: '',
    type: 'alacak',
    status: 'odenmedi',
    dueDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [customersRes, receivablesRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/receivables')
      ])
      
      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData)
      }
      
      if (receivablesRes.ok) {
        const receivablesData = await receivablesRes.json()
        setReceivables(receivablesData)
      }
    } catch (error) {
      console.error('Veriler alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerId) {
      showToast('Lütfen müşteri seçin', 'warning')
      return
    }

    const selectedCustomer = customers.find(c => c._id === formData.customerId)
    if (!selectedCustomer) return

    try {
      const url = editingReceivable ? `/api/receivables/${editingReceivable._id}` : '/api/receivables'
      const method = editingReceivable ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
          customerPhone: selectedCustomer.phone,
          markAsPaid: formData.status === 'odendi'
        })
      })

      if (response.ok) {
        await fetchData()
        resetForm()
        showToast(editingReceivable ? 'Kayıt güncellendi!' : 'Kayıt eklendi!', 'success')
      } else {
        showToast('İşlem başarısız!', 'error')
      }
    } catch (error) {
      console.error('Kayıt kaydedilemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/receivables/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchData()
        showToast('Kayıt silindi!', 'success')
      } else {
        showToast('Silme işlemi başarısız!', 'error')
      }
    } catch (error) {
      console.error('Kayıt silinemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    }
    setDeleteConfirm(null)
  }

  const togglePaymentStatus = async (receivable: Receivable) => {
    const newStatus = receivable.status === 'odendi' ? 'odenmedi' : 'odendi'
    
    try {
      const response = await fetch(`/api/receivables/${receivable._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...receivable,
          status: newStatus,
          markAsPaid: newStatus === 'odendi'
        })
      })

      if (response.ok) {
        await fetchData()
        showToast(newStatus === 'odendi' ? 'Ödeme tamamlandı!' : 'Ödeme bekleniyor!', 'success')
      } else {
        showToast('İşlem başarısız!', 'error')
      }
    } catch (error) {
      console.error('Durum güncellenemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: '',
      amount: 0,
      description: '',
      type: 'alacak',
      status: 'odenmedi',
      dueDate: '',
      notes: ''
    })
    setEditingReceivable(null)
    setShowForm(false)
  }

  const startEdit = (receivable: Receivable) => {
    setFormData({
      customerId: receivable.customerId,
      amount: receivable.amount,
      description: receivable.description,
      type: receivable.type,
      status: receivable.status,
      dueDate: receivable.dueDate ? receivable.dueDate.split('T')[0] : '',
      notes: receivable.notes
    })
    setEditingReceivable(receivable)
    setShowForm(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const filteredReceivables = receivables.filter(receivable => {
    const matchesSearch = searchTerm === '' || 
      receivable.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.customerPhone.includes(searchTerm) ||
      receivable.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const totalAlacak = receivables
    .filter(r => r.type === 'alacak' && r.status === 'odenmedi')
    .reduce((sum, r) => sum + r.amount, 0)
  
  const totalVerecek = receivables
    .filter(r => r.type === 'verecek' && r.status === 'odenmedi')
    .reduce((sum, r) => sum + r.amount, 0)

  const netDurum = totalAlacak - totalVerecek

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  const customerOptions = [
    { value: '', label: 'Müşteri Seçin' },
    ...customers.map(c => ({
      value: c._id,
      label: `${c.firstName} ${c.lastName} - ${c.phone}`
    }))
  ]

  const typeOptions = [
    { value: 'alacak', label: 'Alacak' },
    { value: 'verecek', label: 'Verecek' }
  ]

  const statusOptions = [
    { value: 'odenmedi', label: 'Ödenmedi' },
    { value: 'odendi', label: 'Ödendi' }
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
            <DollarSign className="h-8 w-8 text-green-400" />
            Hesap Takibi
          </h1>
          <p className="text-gray-400">Borç ve alacaklarınızı takip edin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="glass-button btn-primary mt-4 md:mt-0 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <span>Yeni Kayıt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-card p-6 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Toplam Alacak</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAlacak)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="glass-card p-6 border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Toplam Verecek</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(totalVerecek)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="glass-card p-6 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Net Durum</p>
              <p className={`text-2xl font-bold ${netDurum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(netDurum)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="İsim, telefon veya açıklama ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full"
          />
        </div>
      </div>

      {showForm && (
        <div ref={formRef} className="glass-card p-6 animate-scale-in">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingReceivable ? 'Kayıt Düzenle' : 'Yeni Kayıt Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-400 mb-2">Müşteri</label>
              <CustomSelect
                value={formData.customerId}
                onChange={(value) => setFormData({ ...formData, customerId: value })}
                options={customerOptions}
                placeholder="Müşteri Seçin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tutar (₺)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tür</label>
              <CustomSelect
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value as any })}
                options={typeOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Durum</label>
              <CustomSelect
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as any })}
                options={statusOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Vade Tarihi</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Açıklama</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-glass w-full"
              />
            </div>

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
                {editingReceivable ? 'Güncelle' : 'Kaydet'}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Müşteri</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tutar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tür</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Durum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tarih</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredReceivables.map((receivable) => (
                <tr key={receivable._id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{receivable.customerName}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {receivable.customerPhone}
                        </div>
                        {receivable.description && (
                          <div className="text-sm text-blue-400">{receivable.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`text-sm font-bold ${receivable.type === 'alacak' ? 'text-green-400' : 'text-red-400'}`}>
                      {receivable.type === 'alacak' ? '+' : '-'}{formatCurrency(receivable.amount)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      receivable.type === 'alacak' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                    }`}>
                      {receivable.type === 'alacak' ? 'Alacak' : 'Verecek'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => togglePaymentStatus(receivable)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        receivable.status === 'odendi' 
                          ? 'bg-green-950 text-green-400 hover:bg-green-900' 
                          : 'bg-yellow-950 text-yellow-400 hover:bg-yellow-900'
                      }`}
                    >
                      {receivable.status === 'odendi' ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          <span>Ödendi</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          <span>Ödenmedi</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div>{formatDate(receivable.createdAt)}</div>
                        {receivable.dueDate && (
                          <div className="text-xs text-yellow-400">
                            Vade: {formatDate(receivable.dueDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(receivable)}
                        className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(receivable._id)}
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
        
        {filteredReceivables.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? 'Arama kriterlerine uygun kayıt bulunamadı' : 'Henüz alacak-verecek kaydı eklenmemiş'}
            </p>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Kayıt Sil"
          message="Bu kaydı silmek istediğinizden emin misiniz?"
          onConfirm={() => handleDelete(deleteConfirm)}
        />
      )}
    </div>
  )
}
