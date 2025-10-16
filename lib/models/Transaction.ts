import mongoose from 'mongoose'

const TransactionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true, trim: true },
  productCode: { type: String, default: '', trim: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['satis', 'iade'], default: 'satis' },
  paymentMethod: { type: String, enum: ['nakit', 'kart', 'havale'], default: 'nakit' },
  installments: { type: Number, default: 1, min: 1 },
  notes: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema)
