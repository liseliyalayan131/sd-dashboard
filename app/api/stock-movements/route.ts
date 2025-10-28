import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import StockMovement from '@/lib/models/StockMovement'

export async function GET(request: Request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    let query = {}
    if (productId) {
      query = { productId }
    }
    
    const movements = await StockMovement.find(query).sort({ createdAt: -1 })
    return NextResponse.json(movements)
  } catch (error) {
    console.error('Stok hareketleri alınamadı:', error)
    return NextResponse.json(
      { error: 'Stok hareketleri alınamadı' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const data = await request.json()
    
    const movement = await StockMovement.create(data)
    return NextResponse.json(movement, { status: 201 })
  } catch (error) {
    console.error('Stok hareketi kaydedilemedi:', error)
    return NextResponse.json(
      { error: 'Stok hareketi kaydedilemedi' },
      { status: 500 }
    )
  }
}
