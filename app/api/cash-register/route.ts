import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import CashRegister from '@/lib/models/CashRegister'
import CashTransaction from '@/lib/models/CashTransaction'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query: any = {}
    
    if (status) {
      query.status = status
    }
    
    if (startDate || endDate) {
      query.openingDate = {}
      if (startDate) query.openingDate.$gte = new Date(startDate)
      if (endDate) query.openingDate.$lte = new Date(endDate)
    }

    const registers = await CashRegister.find(query)
      .sort({ openingDate: -1 })
      .limit(100)

    return NextResponse.json(registers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const openRegister = await CashRegister.findOne({ status: 'acik' })
    if (openRegister) {
      return NextResponse.json({ error: 'Zaten açık bir kasa var!' }, { status: 400 })
    }

    const newRegister = new CashRegister({
      openingAmount: body.openingAmount || 0,
      expectedCash: body.openingAmount || 0,
      openedBy: body.openedBy || 'Admin',
      notes: body.notes || ''
    })

    await newRegister.save()

    const openingTransaction = new CashTransaction({
      cashRegisterId: newRegister._id,
      type: 'giris',
      amount: body.openingAmount || 0,
      category: 'acilis',
      description: 'Kasa açılış tutarı',
      performedBy: body.openedBy || 'Admin'
    })

    await openingTransaction.save()

    return NextResponse.json(newRegister, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
