import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'
import Product from '@/lib/models/Product'
import Customer from '@/lib/models/Customer'
import StockMovement from '@/lib/models/StockMovement'
import mongoose from 'mongoose'

export async function GET() {
  try {
    await dbConnect()
    const transactions = await Transaction.find({}).sort({ createdAt: -1 })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('GET Transactions Error:', error)
    return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const data = await request.json()
    console.log('Received transaction data:', data)

    const product = await Product.findById(data.productId)
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    }

    if (data.type === 'satis' && product.stock < data.quantity) {
      return NextResponse.json({ error: 'Yetersiz stok!' }, { status: 400 })
    }

    const previousStock = product.stock

    if (data.type === 'satis') {
      product.stock -= data.quantity
    } else if (data.type === 'iade') {
      product.stock += data.quantity
    }
    await product.save()

    await StockMovement.create({
      productId: product._id,
      productName: product.name,
      productCode: product.code,
      type: data.type,
      quantity: data.quantity,
      previousStock,
      newStock: product.stock,
      reason: data.type === 'satis' ? 'Satış işlemi' : 'İade işlemi',
      relatedType: 'transaction',
      notes: `Müşteri: ${data.customerName}`
    })

    const customer = await Customer.findById(data.customerId)
    if (customer && data.type === 'satis') {
      customer.totalSpent += data.totalPrice
      customer.visitCount += 1
      customer.lastVisit = new Date()
      await customer.save()
    }

    const transaction = await Transaction.create(data)
    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    console.error('POST Transaction Error:', error)
    console.error('Error details:', error.message)
    return NextResponse.json({ 
      error: 'İşlem oluşturulamadı',
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()
    const { ids } = await request.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Geçersiz ID listesi' }, { status: 400 })
    }

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'Geçerli ID bulunamadı' }, { status: 400 })
    }

    const transactions = await Transaction.find({ _id: { $in: validIds } })
    
    for (const transaction of transactions) {
      const product = await Product.findById(transaction.productId)
      if (product) {
        const previousStock = product.stock
        
        if (transaction.type === 'satis') {
          product.stock += transaction.quantity
        } else if (transaction.type === 'iade') {
          product.stock -= transaction.quantity
        }
        
        await product.save()
        
        await StockMovement.create({
          productId: product._id,
          productName: product.name,
          productCode: product.code,
          type: transaction.type === 'satis' ? 'giris' : 'cikis',
          quantity: transaction.quantity,
          previousStock,
          newStock: product.stock,
          reason: 'İşlem silme',
          relatedType: 'transaction',
          notes: `Silinen işlem: ${transaction._id}`
        })
      }
      
      if (transaction.type === 'satis') {
        const customer = await Customer.findById(transaction.customerId)
        if (customer) {
          customer.totalSpent = Math.max(0, customer.totalSpent - transaction.totalPrice)
          customer.visitCount = Math.max(0, customer.visitCount - 1)
          await customer.save()
        }
      }
    }

    const result = await Transaction.deleteMany({ _id: { $in: validIds } })
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    })
  } catch (error: any) {
    console.error('DELETE Transactions Error:', error)
    return NextResponse.json({ 
      error: 'Silme işlemi başarısız',
      details: error.message 
    }, { status: 500 })
  }
}
