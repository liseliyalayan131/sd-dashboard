import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import Product from '@/lib/models/Product'
import Transaction from '@/lib/models/Transaction'
import Service from '@/lib/models/Service'
import Receivable from '@/lib/models/Receivable'
import CashRegister from '@/lib/models/CashRegister'
import CashTransaction from '@/lib/models/CashTransaction'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Yanlış şifre!' }, { status: 401 })
    }

    await dbConnect()

    await Promise.all([
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Transaction.deleteMany({}),
      Service.deleteMany({}),
      Receivable.deleteMany({}),
      CashRegister.deleteMany({}),
      CashTransaction.deleteMany({})
    ])

    return NextResponse.json({ 
      success: true, 
      message: 'Tüm veriler başarıyla silindi!' 
    })
  } catch (error) {
    console.error('Database Reset Error:', error)
    return NextResponse.json({ 
      error: 'Veritabanı sıfırlanamadı!' 
    }, { status: 500 })
  }
}
