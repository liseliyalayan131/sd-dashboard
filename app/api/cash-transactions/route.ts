import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import CashRegister from '@/lib/models/CashRegister'
import CashTransaction from '@/lib/models/CashTransaction'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const cashRegisterId = searchParams.get('cashRegisterId')

    let query: any = {}
    if (cashRegisterId) {
      query.cashRegisterId = cashRegisterId
    }

    const transactions = await CashTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(100)

    return NextResponse.json(transactions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const register = await CashRegister.findOne({ status: 'acik' })
    
    if (!register) {
      return NextResponse.json({ error: 'Açık kasa bulunamadı!' }, { status: 400 })
    }

    const transaction = new CashTransaction({
      cashRegisterId: register._id,
      type: body.type,
      amount: body.amount,
      category: body.category,
      description: body.description || '',
      relatedId: body.relatedId || null,
      relatedType: body.relatedType || 'manual',
      performedBy: body.performedBy || 'Admin'
    })

    await transaction.save()

    if (body.type === 'giris') {
      register.totalCashIn += body.amount
      register.expectedCash += body.amount
    } else {
      register.totalCashOut += body.amount
      register.expectedCash -= body.amount
    }

    await register.save()

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
