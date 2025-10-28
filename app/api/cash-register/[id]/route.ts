import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import CashRegister from '@/lib/models/CashRegister'
import CashTransaction from '@/lib/models/CashTransaction'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params
    const register = await CashRegister.findById(id)
    
    if (!register) {
      return NextResponse.json({ error: 'Kasa kaydı bulunamadı' }, { status: 404 })
    }

    const transactions = await CashTransaction.find({ cashRegisterId: id })
      .sort({ createdAt: -1 })

    return NextResponse.json({ register, transactions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const body = await request.json()
    const { id } = await params

    const register = await CashRegister.findById(id)
    
    if (!register) {
      return NextResponse.json({ error: 'Kasa kaydı bulunamadı' }, { status: 404 })
    }

    if (register.status === 'kapali') {
      return NextResponse.json({ error: 'Bu kasa zaten kapatılmış!' }, { status: 400 })
    }

    register.actualCash = body.actualCash
    register.difference = body.actualCash - register.expectedCash
    register.closingDate = new Date()
    register.status = 'kapali'
    register.closedBy = body.closedBy || 'Admin'
    register.notes = body.notes || register.notes

    await register.save()

    return NextResponse.json(register)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params
    
    await CashTransaction.deleteMany({ cashRegisterId: id })
    const register = await CashRegister.findByIdAndDelete(id)
    
    if (!register) {
      return NextResponse.json({ error: 'Kasa kaydı bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Kasa kaydı silindi' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
