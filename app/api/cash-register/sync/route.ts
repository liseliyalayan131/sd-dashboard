import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import CashRegister from '@/lib/models/CashRegister'
import CashTransaction from '@/lib/models/CashTransaction'
import Transaction from '@/lib/models/Transaction'
import Service from '@/lib/models/Service'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const { type, relatedId, amount, paymentMethod, description } = body

    const openRegister = await CashRegister.findOne({ status: 'acik' })
    
    if (!openRegister) {
      return NextResponse.json({ 
        error: 'Açık kasa bulunamadı. Nakit işlem otomatik olarak kaydedilmedi.' 
      }, { status: 400 })
    }

    if (paymentMethod === 'nakit') {
      const cashTransaction = new CashTransaction({
        cashRegisterId: openRegister._id,
        type: 'giris',
        amount: amount,
        category: type === 'transaction' ? 'satis' : 'servis',
        description: description || `Otomatik kayıt: ${type}`,
        relatedId: relatedId,
        relatedType: type,
        performedBy: 'Sistem'
      })

      await cashTransaction.save()

      openRegister.totalCashIn += amount
      openRegister.expectedCash += amount

      await openRegister.save()

      return NextResponse.json({ 
        success: true, 
        message: 'Nakit işlem kasaya kaydedildi',
        cashTransaction 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Nakit dışı ödeme, kasaya kaydedilmedi' 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
