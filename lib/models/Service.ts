import mongoose from 'mongoose'

const ServiceSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  problem: { type: String, required: true },
  workDone: { type: String, default: '' },
  solution: { type: String, default: '' },
  usedProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    productCode: { type: String },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 }
  }],
  partsCost: { type: Number, default: 0, min: 0 },
  laborCost: { type: Number, default: 0, min: 0 },
  totalCost: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['beklemede', 'devam-ediyor', 'cozuldu', 'cozulmedi'], default: 'beklemede' },
  receivedDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true })

ServiceSchema.pre('save', function(next) {
  this.totalCost = this.partsCost + this.laborCost
  next()
})

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema)
