import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/models/Product'

export async function GET() {
  try {
    await connectDB()
    const products = await Product.find().lean()
    
    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      exportDate: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Dışa aktarma başarısız' }, { status: 500 })
  }
}
