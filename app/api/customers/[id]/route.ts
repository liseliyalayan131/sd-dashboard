import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const data = await request.json()
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true })
    if (!customer) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const customer = await Customer.findByIdAndDelete(id)
    if (!customer) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  }
}
