import { NextRequest, NextResponse } from 'next/server'
import { getParkingCostOptimization, getDynamicDemandForecast, getSessionEfficiencyInsight, getWalletHealthInsight } from '@/app/actions/recommendations'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing recommendations pipeline...')
    
    // Test all four recommendation types
    const [
      costResult,
      demandResult,
      efficiencyResult,
      walletResult
    ] = await Promise.all([
      getParkingCostOptimization(),
      getDynamicDemandForecast(),
      getSessionEfficiencyInsight(),
      getWalletHealthInsight()
    ])

    const results = {
      status: 'success',
      timestamp: new Date().toISOString(),
      dataFlow: {
        costOptimization: {
          success: costResult.ok,
          hasData: !!costResult.data,
          error: costResult.error
        },
        demandForecast: {
          success: demandResult.ok,
          hasData: !!demandResult.data,
          error: demandResult.error
        },
        efficiencyInsight: {
          success: efficiencyResult.ok,
          hasData: !!efficiencyResult.data,
          error: efficiencyResult.error
        },
        walletHealth: {
          success: walletResult.ok,
          hasData: !!walletResult.data,
          error: walletResult.error
        }
      },
      recommendations: {
        costOptimization: costResult.data,
        demandForecast: demandResult.data,
        efficiencyInsight: efficiencyResult.data,
        walletHealth: walletResult.data
      }
    }

    console.log('✅ Recommendations pipeline test completed')
    return NextResponse.json(results)

  } catch (error) {
    console.error('❌ Recommendations pipeline test failed:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
