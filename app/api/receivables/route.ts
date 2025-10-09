import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Receivable from '@/lib/models/Receivable'

export async function GET() {
  try {
    await dbConnect()
    const receivables = await Receivable.find({}).sort({ createdAt: -1 })
    return NextResponse.json(receivables)
  } catch (error) {
    console.error('GET Receivables Error:', error)
    return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const data = await request.json()
    console.log('Received data:', data)
    
    const receivable = await Receivable.create(data)
    return NextResponse.json(receivable, { status: 201 })
  } catch (error: any) {
    console.error('POST Receivable Error:', error)
    console.error('Error details:', error.message)
    return NextResponse.json({ 
      error: 'Kayıt oluşturulamadı',
      details: error.message 
    }, { status: 500 })
  }
}
