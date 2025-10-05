import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateToken, getUserFromToken } from '@/lib/utils/auth'

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const isValid = await validateToken(token)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { recommendationId } = body

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      )
    }

    // In a real implementation, you would store dismissed recommendations in a database
    // For now, we'll just log the dismissal and return success
    console.log(`User ${user.id} dismissed recommendation: ${recommendationId}`)
    
    // TODO: Store dismissal in database to avoid showing again
    // await prisma.recommendationDismissal.create({
    //   data: {
    //     userId: user.id,
    //     recommendationId,
    //     dismissedAt: new Date()
    //   }
    // })

    return NextResponse.json({
      success: true,
      message: 'Recommendation dismissed'
    })

  } catch (error) {
    console.error('Error dismissing recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to dismiss recommendation' },
      { status: 500 }
    )
  }
}
