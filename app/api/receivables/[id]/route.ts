import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Receivable from '@/lib/models/Receivable'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const data = await request.json()
    console.log('Update data:', data)
    
    if (data.markAsPaid && data.status === 'odendi') {
      data.paidDate = new Date()
    }
    
    const receivable = await Receivable.findByIdAndUpdate(id, data, { new: true })
    if (!receivable) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json(receivable)
  } catch (error: any) {
    console.error('PUT Receivable Error:', error)
    console.error('Error details:', error.message)
    return NextResponse.json({ 
      error: 'Güncellenemedi',
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const receivable = await Receivable.findByIdAndDelete(id)
    if (!receivable) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE Receivable Error:', error)
    return NextResponse.json({ error: 'Silinemedi' }, { status: 500 })
  }
}
