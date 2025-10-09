import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/lib/models/Product'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const data = await request.json()
    
    if (!data.code || data.code.trim() === '') {
      data.code = `URN-${Date.now()}`
    }
    
    const product = await Product.findByIdAndUpdate(id, data, { new: true })
    if (!product) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const product = await Product.findByIdAndDelete(id)
    if (!product) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  }
}
