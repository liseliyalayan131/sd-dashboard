import mongoose from 'mongoose'

const CustomerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, default: '', trim: true },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  totalSpent: { type: Number, default: 0, min: 0 },
  visitCount: { type: Number, default: 0, min: 0 },
  lastVisit: { type: Date, default: null }
}, { timestamps: true })

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema)
