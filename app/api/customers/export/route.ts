import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'

export async function GET() {
  try {
    await connectDB()
    const customers = await Customer.find().lean()
    
    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
      exportDate: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Dışa aktarma başarısız' }, { status: 500 })
  }
}
