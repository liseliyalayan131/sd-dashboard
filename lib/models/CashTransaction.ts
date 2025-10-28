import mongoose from 'mongoose'

const CashTransactionSchema = new mongoose.Schema({
  cashRegisterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashRegister', required: true },
  type: { type: String, enum: ['giris', 'cikis'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { 
    type: String, 
    enum: ['satis', 'iade', 'masraf', 'diger', 'acilis', 'devir'], 
    required: true 
  },
  description: { type: String, default: '' },
  relatedId: { type: String, default: null },
  relatedType: { type: String, enum: ['transaction', 'service', 'manual'], default: 'manual' },
  performedBy: { type: String, default: 'Admin' }
}, { timestamps: true })

export default mongoose.models.CashTransaction || mongoose.model('CashTransaction', CashTransactionSchema)
