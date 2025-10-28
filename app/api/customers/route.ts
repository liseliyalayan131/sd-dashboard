import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'

export async function GET() {
  try {
    await dbConnect()
    const customers = await Customer.find({}).sort({ createdAt: -1 })
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const data = await request.json()
    const customer = await Customer.create(data)
    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Bu telefon numarası zaten kayıtlı' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
