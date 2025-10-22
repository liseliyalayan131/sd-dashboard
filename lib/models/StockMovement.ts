import mongoose from 'mongoose'

const StockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true, trim: true },
  productCode: { type: String, default: '', trim: true },
  type: { 
    type: String, 
    enum: ['giris', 'cikis', 'duzeltme', 'satis', 'iade', 'servis'], 
    required: true 
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: { type: String, default: '' },
  relatedId: { type: String, default: null },
  relatedType: { type: String, enum: ['transaction', 'service', 'manual'], default: 'manual' },
  notes: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema)
