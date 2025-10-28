import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import CashRegister from '@/lib/models/CashRegister'
import CashTransaction from '@/lib/models/CashTransaction'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let start: Date
    let end: Date = new Date()
    
    switch (period) {
      case 'today':
        start = new Date()
        start.setHours(0, 0, 0, 0)
        break
      case 'week':
        start = new Date()
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
      case 'month':
        start = new Date()
        start.setMonth(start.getMonth() - 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'custom':
        start = startDate ? new Date(startDate) : new Date()
        end = endDate ? new Date(endDate) : new Date()
        break
      default:
        start = new Date()
        start.setHours(0, 0, 0, 0)
    }

    const registers = await CashRegister.find({
      openingDate: { $gte: start, $lte: end }
    }).sort({ openingDate: -1 })

    const totalRegisters = registers.length
    const openRegisters = registers.filter(r => r.status === 'acik').length
    const closedRegisters = registers.filter(r => r.status === 'kapali').length

    const totalOpeningAmount = registers.reduce((sum, r) => sum + r.openingAmount, 0)
    const totalExpectedCash = registers.reduce((sum, r) => sum + r.expectedCash, 0)
    const totalActualCash = registers.reduce((sum, r) => sum + (r.actualCash || 0), 0)
    const totalDifference = registers.reduce((sum, r) => sum + r.difference, 0)
    const totalCashIn = registers.reduce((sum, r) => sum + r.totalCashIn, 0)
    const totalCashOut = registers.reduce((sum, r) => sum + r.totalCashOut, 0)

    const transactionIds = registers.map(r => r._id)
    const allTransactions = await CashTransaction.find({
      cashRegisterId: { $in: transactionIds }
    })

    const categoryBreakdown: Record<string, { total: number, count: number, type: string }> = {}
    allTransactions.forEach(t => {
      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = { total: 0, count: 0, type: t.type }
      }
      categoryBreakdown[t.category].total += t.amount
      categoryBreakdown[t.category].count += 1
    })

    const dailyBreakdown: Record<string, {
      date: string,
      registers: number,
      totalCashIn: number,
      totalCashOut: number,
      difference: number
    }> = {}

    registers.forEach(r => {
      const dateKey = new Date(r.openingDate).toISOString().split('T')[0]
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
          date: dateKey,
          registers: 0,
          totalCashIn: 0,
          totalCashOut: 0,
          difference: 0
        }
      }
      dailyBreakdown[dateKey].registers += 1
      dailyBreakdown[dateKey].totalCashIn += r.totalCashIn
      dailyBreakdown[dateKey].totalCashOut += r.totalCashOut
      dailyBreakdown[dateKey].difference += r.difference
    })

    const averageDifference = closedRegisters > 0 ? totalDifference / closedRegisters : 0
    const averageDailyCashIn = totalRegisters > 0 ? totalCashIn / totalRegisters : 0

    return NextResponse.json({
      summary: {
        totalRegisters,
        openRegisters,
        closedRegisters,
        totalOpeningAmount,
        totalExpectedCash,
        totalActualCash,
        totalDifference,
        totalCashIn,
        totalCashOut,
        averageDifference,
        averageDailyCashIn
      },
      categoryBreakdown,
      dailyBreakdown: Object.values(dailyBreakdown),
      registers
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
