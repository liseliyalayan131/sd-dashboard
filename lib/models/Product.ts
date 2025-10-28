import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, default: '', trim: true, sparse: true },
  category: { type: String, default: '', trim: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  minStock: { type: Number, default: 0, min: 0 },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  description: { type: String, default: '' },
  unit: { type: String, default: 'Adet', trim: true }
}, { timestamps: true })

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
