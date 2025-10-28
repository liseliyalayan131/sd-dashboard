import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import Transaction from '@/lib/models/Transaction'
import Service from '@/lib/models/Service'

export async function POST() {
  try {
    await dbConnect()
    
    const customers = await Customer.find({})
    const allTransactions = await Transaction.find({})
    const allServices = await Service.find({})
    
    let updatedCount = 0
    
    for (const customer of customers) {
      const customerTransactions = allTransactions.filter(
        t => t.customerPhone === customer.phone && t.type === 'satis'
      )
      
      const customerServices = allServices.filter(
        s => s.customerPhone === customer.phone
      )
      
      const transactionTotal = customerTransactions.reduce((sum, t) => sum + t.totalPrice, 0)
      const serviceTotal = customerServices.reduce((sum, s) => sum + (s.totalCost || 0), 0)
      
      const totalSpent = transactionTotal + serviceTotal
      const visitCount = customerTransactions.length + customerServices.length
      
      if (customer.totalSpent !== totalSpent || customer.visitCount !== visitCount) {
        customer.totalSpent = totalSpent
        customer.visitCount = visitCount
        await customer.save()
        updatedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${updatedCount} müşteri güncellendi`,
      totalCustomers: customers.length,
      updatedCount
    })
  } catch (error) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: 'Senkronizasyon hatası' }, { status: 500 })
  }
}
