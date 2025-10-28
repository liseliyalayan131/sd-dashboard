import mongoose from 'mongoose'

const CashRegisterSchema = new mongoose.Schema({
  openingDate: { type: Date, required: true, default: Date.now },
  closingDate: { type: Date, default: null },
  openingAmount: { type: Number, required: true, default: 0, min: 0 },
  expectedCash: { type: Number, default: 0, min: 0 },
  actualCash: { type: Number, default: null, min: 0 },
  difference: { type: Number, default: 0 },
  totalCashIn: { type: Number, default: 0, min: 0 },
  totalCashOut: { type: Number, default: 0, min: 0 },
  totalCard: { type: Number, default: 0, min: 0 },
  totalTransfer: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['acik', 'kapali'], default: 'acik' },
  openedBy: { type: String, default: 'Admin' },
  closedBy: { type: String, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.models.CashRegister || mongoose.model('CashRegister', CashRegisterSchema)
