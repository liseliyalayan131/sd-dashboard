import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Note from '@/lib/models/Note'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const note = await Note.findById(id)
      if (!note) {
        return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
      }
      return NextResponse.json(note)
    }

    const notes = await Note.find().sort({ createdAt: -1 })
    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json({ error: 'Notlar alınamadı' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const note = await Note.create(body)
    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { _id, ...updateData } = body

    if (!_id) {
      return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    }

    const note = await Note.findByIdAndUpdate(_id, updateData, { 
      new: true, 
      runValidators: true 
    })

    if (!note) {
      return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    }

    const note = await Note.findByIdAndDelete(id)
    
    if (!note) {
      return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Not silindi' })
  } catch (error) {
    return NextResponse.json({ error: 'Not silinemedi' }, { status: 500 })
  }
}
