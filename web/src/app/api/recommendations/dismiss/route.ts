import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { recommendationId } = await request.json()
    
    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      )
    }
    
    // For now, just return success since we're not persisting dismissals
    // In production, you'd store this in a database
    console.log(`✅ Recommendation ${recommendationId} dismissed`)
    
    return NextResponse.json({
      success: true,
      message: 'Recommendation dismissed successfully',
      recommendationId
    })
    
  } catch (error) {
    console.error('❌ Error dismissing recommendation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to dismiss recommendation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}