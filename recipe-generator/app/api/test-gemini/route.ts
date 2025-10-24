import { model } from '@/lib/gemini'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await model.generateContent(
      'Say hello in JSON format with a "message" field'
    )
    
    const text = result.response.text()

    return NextResponse.json({
      success: true,
      response: text,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error,
    }, { status: 500 })
  }
}