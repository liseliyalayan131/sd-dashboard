import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { customers, replaceAll } = await request.json()

    if (!Array.isArray(customers)) {
      return NextResponse.json({ error: 'Geçersiz veri formatı' }, { status: 400 })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    if (replaceAll) {
      await Customer.deleteMany({})
    }

    for (const customerData of customers) {
      try {
        const { _id, __v, createdAt, updatedAt, ...cleanData } = customerData

        const existingCustomer = await Customer.findOne({ phone: cleanData.phone })
        
        if (existingCustomer && !replaceAll) {
          await Customer.findByIdAndUpdate(existingCustomer._id, cleanData)
          successCount++
        } else {
          await Customer.create(cleanData)
          successCount++
        }
      } catch (error: any) {
        errorCount++
        errors.push(`${customerData.name}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors,
      message: `${successCount} müşteri başarıyla aktarıldı${errorCount > 0 ? `, ${errorCount} hata oluştu` : ''}`
    })
  } catch (error) {
    return NextResponse.json({ error: 'İçe aktarma başarısız' }, { status: 500 })
  }
}
