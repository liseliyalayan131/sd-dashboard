import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Service from '@/lib/models/Service'
import Product from '@/lib/models/Product'
import StockMovement from '@/lib/models/StockMovement'
import mongoose from 'mongoose'

export async function GET() {
  try {
    await dbConnect()
    const services = await Service.find().sort({ createdAt: -1 })
    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    
    if (body.usedProducts && body.usedProducts.length > 0) {
      for (const item of body.usedProducts) {
        const product = await Product.findById(item.productId)
        if (product) {
          if (product.stock < item.quantity) {
            return NextResponse.json({ 
              error: `Yetersiz stok: ${product.name} (Mevcut: ${product.stock}, İstenen: ${item.quantity})` 
            }, { status: 400 })
          }
          product.stock -= item.quantity
          await product.save()
        }
      }
    }
    
    const service = await Service.create(body)
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    const { _id, ...updateData } = body

    const service = await Service.findByIdAndUpdate(_id, updateData, { new: true })
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const service = await Service.findById(id)
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    if (service.usedProducts && service.usedProducts.length > 0) {
      for (const item of service.usedProducts) {
        const product = await Product.findById(item.productId)
        if (product) {
          const previousStock = product.stock
          product.stock += item.quantity
          await product.save()
          
          await StockMovement.create({
            productId: product._id,
            productName: product.name,
            productCode: product.code,
            type: 'giris',
            quantity: item.quantity,
            previousStock,
            newStock: product.stock,
            reason: 'Servis silme',
            relatedType: 'service',
            relatedId: service._id.toString(),
            notes: `Silinen servis: ${service.brand} ${service.model} - ${service.customerName}`
          })
        }
      }
    }

    await Service.findByIdAndDelete(id)

    return NextResponse.json({ 
      success: true,
      message: 'Service deleted successfully' 
    })
  } catch (error) {
    console.error('DELETE Service Error:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
