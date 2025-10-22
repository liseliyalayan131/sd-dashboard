import mongoose from 'mongoose'

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  priority: { 
    type: String, 
    enum: ['dusuk', 'orta', 'yuksek'], 
    default: 'orta' 
  },
  status: { 
    type: String, 
    enum: ['aktif', 'tamamlandi'], 
    default: 'aktif' 
  },
  reminderDate: { type: Date, default: null },
  category: { 
    type: String, 
    enum: ['genel', 'musteri', 'servis', 'stok', 'finansal'], 
    default: 'genel' 
  },
  relatedId: { type: String, default: null },
  relatedName: { type: String, default: null }
}, { timestamps: true })

export default mongoose.models.Note || mongoose.model('Note', NoteSchema)
