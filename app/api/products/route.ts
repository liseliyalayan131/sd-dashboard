import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await dbConnect()
    const products = await Product.find({}).sort({ createdAt: -1 })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const data = await request.json()
    
    if (!data.code || data.code.trim() === '') {
      data.code = `URN-${Date.now()}`
    }
    
    const product = await Product.create(data)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Ürün oluşturulamadı' }, { status: 500 })
  }
}
