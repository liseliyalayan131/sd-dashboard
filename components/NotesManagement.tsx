'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Check, X, Bell, Calendar, Tag, AlertCircle, Clock, Search, Filter } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CustomSelect from '@/components/ui/CustomSelect'
import DateTimePicker from '@/components/ui/DateTimePicker'

interface Note {
  _id: string
  title: string
  content: string
  priority: 'dusuk' | 'orta' | 'yuksek'
  status: 'aktif' | 'tamamlandi'
  reminderDate: string | null
  category: 'genel' | 'musteri' | 'servis' | 'stok' | 'finansal'
  relatedId: string | null
  relatedName: string | null
  createdAt: string
  updatedAt: string
}

interface NoteForm {
  title: string
  content: string
  priority: 'dusuk' | 'orta' | 'yuksek'
  status: 'aktif' | 'tamamlandi'
  reminderDate: string
  category: 'genel' | 'musteri' | 'servis' | 'stok' | 'finansal'
  relatedId: string
  relatedName: string
}

export default function NotesManagement() {
  const { showToast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const [formData, setFormData] = useState<NoteForm>({
    title: '',
    content: '',
    priority: 'orta',
    status: 'aktif',
    reminderDate: '',
    category: 'genel',
    relatedId: '',
    relatedName: ''
  })

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Notlar alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/notes'
      const method = editingNote ? 'PUT' : 'POST'
      const body = editingNote ? { ...formData, _id: editingNote._id } : formData
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchNotes()
        resetForm()
        showToast(editingNote ? 'Not güncellendi!' : 'Not eklendi!', 'success')
      } else {
        showToast('İşlem başarısız!', 'error')
      }
    } catch (error) {
      console.error('Not kaydedilemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchNotes()
        showToast('Not silindi!', 'success')
      } else {
        showToast('Silme işlemi başarısız!', 'error')
      }
    } catch (error) {
      console.error('Not silinemedi:', error)
      showToast('Bir hata oluştu!', 'error')
    }
    setDeleteConfirm(null)
  }

  const toggleStatus = async (note: Note) => {
    try {
      const newStatus = note.status === 'aktif' ? 'tamamlandi' : 'aktif'
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: note._id, status: newStatus })
      })

      if (response.ok) {
        await fetchNotes()
        showToast('Durum güncellendi!', 'success')
      }
    } catch (error) {
      showToast('Durum güncellenemedi!', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'orta',
      status: 'aktif',
      reminderDate: '',
      category: 'genel',
      relatedId: '',
      relatedName: ''
    })
    setEditingNote(null)
    setShowForm(false)
  }

  const startEdit = (note: Note) => {
    setFormData({
      title: note.title,
      content: note.content,
      priority: note.priority,
      status: note.status,
      reminderDate: note.reminderDate ? note.reminderDate.split('T')[0] : '',
      category: note.category,
      relatedId: note.relatedId || '',
      relatedName: note.relatedName || ''
    })
    setEditingNote(note)
    setShowForm(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'yuksek': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'orta': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      case 'dusuk': return 'bg-green-500/10 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'musteri': return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'servis': return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      case 'stok': return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      case 'finansal': return 'bg-green-500/10 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'yuksek': return 'Yüksek'
      case 'orta': return 'Orta'
      case 'dusuk': return 'Düşük'
      default: return priority
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'genel': return 'Genel'
      case 'musteri': return 'Müşteri'
      case 'servis': return 'Servis'
      case 'stok': return 'Stok'
      case 'finansal': return 'Finansal'
      default: return category
    }
  }

  const isReminderDue = (reminderDate: string | null) => {
    if (!reminderDate) return false
    const now = new Date()
    const reminder = new Date(reminderDate)
    return reminder <= now
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = filterCategory === 'all' || note.category === filterCategory
    const matchesStatus = filterStatus === 'all' || note.status === filterStatus
    const matchesPriority = filterPriority === 'all' || note.priority === filterPriority

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority
  })

  const activeNotes = notes.filter(n => n.status === 'aktif')
  const completedNotes = notes.filter(n => n.status === 'tamamlandi')
  const highPriorityNotes = notes.filter(n => n.priority === 'yuksek' && n.status === 'aktif')
  const upcomingReminders = notes.filter(n => 
    n.reminderDate && new Date(n.reminderDate) > new Date() && n.status === 'aktif'
  )

  const priorityOptions = [
    { value: 'dusuk', label: 'Düşük' },
    { value: 'orta', label: 'Orta' },
    { value: 'yuksek', label: 'Yüksek' }
  ]

  const categoryOptions = [
    { value: 'genel', label: 'Genel' },
    { value: 'musteri', label: 'Müşteri' },
    { value: 'servis', label: 'Servis' },
    { value: 'stok', label: 'Stok' },
    { value: 'finansal', label: 'Finansal' }
  ]

  const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'tamamlandi', label: 'Tamamlandı' }
  ]

  const filterCategoryOptions = [
    { value: 'all', label: 'Tüm Kategoriler' },
    ...categoryOptions
  ]

  const filterStatusOptions = [
    { value: 'all', label: 'Tüm Durumlar' },
    ...statusOptions
  ]

  const filterPriorityOptions = [
    { value: 'all', label: 'Tüm Öncelikler' },
    ...priorityOptions
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
            <Bell className="h-8 w-8 text-blue-400" />
            Notlar & Hatırlatıcılar
          </h1>
          <p className="text-gray-400">Notlarınızı ve hatırlatıcılarınızı yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="glass-button btn-primary mt-4 md:mt-0 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Not</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card ios-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-blue-500/30">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm">Aktif Notlar</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">{activeNotes.length}</p>
        </div>

        <div className="glass-card ios-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-green-500/30">
              <Check className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm">Tamamlanan</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">{completedNotes.length}</p>
        </div>

        <div className="glass-card ios-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-red-500/30">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm">Yüksek Öncelik</h3>
          <p className="text-3xl font-bold text-red-400 mt-2">{highPriorityNotes.length}</p>
        </div>

        <div className="glass-card ios-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center border border-purple-500/30">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm">Yaklaşan Hatırlatıcılar</h3>
          <p className="text-3xl font-bold text-purple-400 mt-2">{upcomingReminders.length}</p>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Not başlığı veya içeriği ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full"
          />
        </div>
        <div className="flex gap-2">
          <CustomSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={filterCategoryOptions}
            className="lg:w-48"
          />
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={filterStatusOptions}
            className="lg:w-48"
          />
          <CustomSelect
            value={filterPriority}
            onChange={setFilterPriority}
            options={filterPriorityOptions}
            className="lg:w-48"
          />
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-scale-in">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingNote ? 'Not Düzenle' : 'Yeni Not Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Başlık</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-glass w-full"
                placeholder="Not başlığı..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">İçerik</label>
              <textarea
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input-glass w-full"
                placeholder="Not detayları..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Kategori</label>
                <CustomSelect
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value as any })}
                  options={categoryOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Öncelik</label>
                <CustomSelect
                  value={formData.priority}
                  onChange={(value) => setFormData({ ...formData, priority: value as any })}
                  options={priorityOptions}
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
            </div>

            <DateTimePicker
              label="Hatırlatıcı Tarihi"
              value={formData.reminderDate}
              onChange={(value) => setFormData({ ...formData, reminderDate: value })}
            />

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={resetForm} className="glass-button btn-secondary">
                İptal
              </button>
              <button type="submit" className="glass-button btn-primary">
                {editingNote ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <div 
            key={note._id} 
            className={`glass-card ios-shadow p-6 transition-all ${
              note.status === 'tamamlandi' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-2 ${
                  note.status === 'tamamlandi' ? 'line-through text-gray-500' : 'text-white'
                }`}>
                  {note.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(note.category)}`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {getCategoryText(note.category)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(note.priority)}`}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {getPriorityText(note.priority)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleStatus(note)}
                className={`p-2 rounded-lg transition-colors ${
                  note.status === 'tamamlandi'
                    ? 'text-green-400 hover:text-green-300'
                    : 'text-gray-400 hover:text-green-400'
                }`}
              >
                {note.status === 'tamamlandi' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 border-2 border-current rounded" />
                )}
              </button>
            </div>

            {note.content && (
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">{note.content}</p>
            )}

            {note.reminderDate && (
              <div className={`flex items-center gap-2 text-sm mb-4 ${
                isReminderDue(note.reminderDate) ? 'text-red-400' : 'text-gray-400'
              }`}>
                <Calendar className="w-4 h-4" />
                {formatDate(note.reminderDate)}
                {isReminderDue(note.reminderDate) && (
                  <span className="text-xs font-bold">(VADESİ GEÇTİ)</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-gray-400">
                {formatDate(note.createdAt)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(note)}
                  className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(note._id)}
                  className="text-red-400 hover:text-red-300 p-1 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Arama kriterlerine uygun not bulunamadı'
              : 'Henüz not eklenmemiş'}
          </p>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Not Sil"
          message="Bu notu silmek istediğinizden emin misiniz?"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
