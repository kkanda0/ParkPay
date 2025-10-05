import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Echo AI API integration...')
    
    const ECHO_API_KEY = process.env.ECHO_AI_API_KEY || process.env.ECHO_MERIT_API_KEY || process.env.ECHO_SERVER_KEY
    
    if (!ECHO_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'No Echo API key found',
        env: {
          ECHO_AI_API_KEY: !!process.env.ECHO_AI_API_KEY,
          ECHO_MERIT_API_KEY: !!process.env.ECHO_MERIT_API_KEY,
          ECHO_SERVER_KEY: !!process.env.ECHO_SERVER_KEY
        }
      })
    }
    
    // Test Echo AI API call
    const testPrompt = "Generate a simple parking recommendation for cost optimization"
    
    const endpoints = [
      'https://api.echo.merit.systems/v1/chat',
      'https://echo.merit.systems/v1/chat',
      'https://api.echo.merit.systems/chat'
    ]
    
    let lastError = null
    let workingEndpoint = null
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Testing Echo API endpoint: ${endpoint}`)
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ECHO_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'ParkPay/1.0',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            message: testPrompt,
            context: {
              type: 'test',
              timestamp: new Date().toISOString()
            },
            model: 'openai/gpt-4',
            temperature: 0.0,
            max_tokens: 200
          }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        console.log(`📡 Response status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Echo API call successful')
          workingEndpoint = endpoint
          return NextResponse.json({
            success: true,
            message: 'Echo AI API is working!',
            endpoint: endpoint,
            response: data,
            apiKey: ECHO_API_KEY.substring(0, 10) + '...'
          })
        } else {
          const errorText = await response.text()
          console.log(`❌ Echo API error ${response.status}: ${errorText}`)
          lastError = new Error(`Echo API error: ${response.status} - ${errorText}`)
        }
      } catch (error) {
        console.log(`❌ Echo API endpoint failed: ${endpoint}`, error)
        lastError = error
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'All Echo API endpoints failed',
      lastError: lastError instanceof Error ? lastError.message : 'Unknown error',
      apiKey: ECHO_API_KEY.substring(0, 10) + '...',
      endpoints: endpoints
    })
    
  } catch (error) {
    console.error('❌ Echo AI test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
