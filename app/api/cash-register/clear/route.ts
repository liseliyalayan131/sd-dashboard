import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import CashRegister from '@/lib/models/CashRegister'
import CashTransaction from '@/lib/models/CashTransaction'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const { password } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Yanlış şifre!' }, { status: 401 })
    }

    await Promise.all([
      CashRegister.deleteMany({}),
      CashTransaction.deleteMany({})
    ])

    return NextResponse.json({ 
      success: true, 
      message: 'Tüm kasa geçmişi silindi!' 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
