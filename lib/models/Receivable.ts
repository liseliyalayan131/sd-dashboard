import mongoose from 'mongoose'

const ReceivableSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  type: { type: String, enum: ['alacak', 'verecek'], required: true },
  status: { type: String, enum: ['odenmedi', 'odendi'], default: 'odenmedi' },
  dueDate: { type: Date, default: null },
  paidDate: { type: Date, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.models.Receivable || mongoose.model('Receivable', ReceivableSchema)
