import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/models/Product'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { products, replaceAll } = await request.json()

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'Geçersiz veri formatı' }, { status: 400 })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    if (replaceAll) {
      await Product.deleteMany({})
    }

    for (const productData of products) {
      try {
        const { _id, __v, createdAt, updatedAt, ...cleanData } = productData

        if (!cleanData.category || cleanData.category.trim() === '') {
          cleanData.category = 'Diğer'
        }

        const existingProduct = await Product.findOne({ code: cleanData.code })
        
        if (existingProduct && !replaceAll) {
          await Product.findByIdAndUpdate(existingProduct._id, cleanData)
          successCount++
        } else {
          await Product.create(cleanData)
          successCount++
        }
      } catch (error: any) {
        errorCount++
        errors.push(`${productData.name}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors,
      message: `${successCount} ürün başarıyla aktarıldı${errorCount > 0 ? `, ${errorCount} hata oluştu` : ''}`
    })
  } catch (error) {
    return NextResponse.json({ error: 'İçe aktarma başarısız' }, { status: 500 })
  }
}
