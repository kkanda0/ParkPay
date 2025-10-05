'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Sparkles } from 'lucide-react';
import PriceAnalysisModal from './PriceAnalysisModal';

interface PricingResult {
  priceUSD: number;
  priceRLUSD: number;
  rlusdRate: number;
  components: {
    T: number; // Traffic
    H: number; // Hotspot
    E: number; // EV Demand
  };
  explain: string;
}

interface AIExplanation {
  summary: string;
  detailed: string;
  factors: {
    traffic: string;
    trafficAnalysis?: string;
    hotspots: string;
    hotspotsAnalysis?: string;
    evDemand: string;
    evDemandAnalysis?: string;
  };
  confidence: number;
  realData: {
    traffic: {
      currentSpeed: number;
      freeFlowSpeed: number;
      congestionLevel: string;
    };
    hotspots: {
      count: number;
      nearbyPOIs: Array<{
        name: string;
        category: string;
        distance: number;
      }>;
    };
    evDemand: {
      nearbyChargers: number;
      estimatedDemand: string;
    };
  };
  opikTraceId: string;
}

interface PriceRowProps {
  lat: number;
  lon: number;
}

interface RLUSDPrice {
  price: number;
  symbol: string;
  lastUpdated: string;
}

export default function PriceRow({ lat, lon }: PriceRowProps) {
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [rlusdPrice, setRlusdPrice] = useState<RLUSDPrice | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Log coordinates on mount/change
  useEffect(() => {
    console.log('🎯 PriceRow: Received coordinates:', { lat, lon });
  }, [lat, lon]);

  const fetchPricing = async () => {
    console.log('🔍 PriceRow: Fetching pricing for coordinates:', { lat, lon });
    setIsLoading(true);
    setError(null);
    
    try {
      // Base price in USD (this is what we charge per hour)
      const baseUSDPrice = 5.0; // $5/hour base rate
      
      const apiUrl = "http://localhost:3001"; // Hardcoded for debugging
      const fullUrl = `${apiUrl}/api/pricing/calculate`;
      
      console.log('📡 PriceRow: Calling API:', fullUrl);
      console.log('📤 PriceRow: Request body:', { lat, lon, baseUSD: baseUSDPrice });
      console.log('🌐 PriceRow: API URL from env:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lon, baseUSD: baseUSDPrice }),
      });

      console.log('📥 PriceRow: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PriceRow: API error:', errorText);
        throw new Error(`Failed to fetch pricing: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ PriceRow: Pricing data received:', data);
      
      // Set RLUSD rate from API response
      if (data.data.rlusdRate) {
        setRlusdPrice({
          price: data.data.rlusdRate,
          symbol: 'RLUSD',
          lastUpdated: new Date().toISOString()
        });
      }
      
      setPricing(data.data);
      setShowPricing(true);
    } catch (err) {
      console.error('❌ PriceRow: Error fetching pricing:', err);
      setError('Price unavailable');
      setPricing(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckPrice = () => {
    fetchPricing();
  };

  const fetchAIExplanation = async () => {
    console.log('🤖 Fetching AI explanation for pricing...');
    setLoadingExplanation(true);
    
    try {
      const baseUSDPrice = 5.0;
      const apiUrl = "http://localhost:3001";
      const fullUrl = `${apiUrl}/api/pricing/explain`;
      
      console.log('📡 Calling AI explanation API:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lon, baseUSD: baseUSDPrice }),
      });

      console.log('📥 AI explanation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI explanation API error:', errorText);
        throw new Error(`Failed to fetch AI explanation: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI explanation received:', data);
      
      setAiExplanation(data.data.aiExplanation);
      setPricing({
        priceUSD: data.data.pricing.priceUSD,
        priceRLUSD: data.data.pricing.priceRLUSD,
        rlusdRate: data.data.pricing.rlusdRate,
        components: data.data.pricing.components,
        explain: data.data.aiExplanation.summary
      });
      setRlusdPrice({
        price: data.data.pricing.rlusdRate,
        symbol: 'RLUSD',
        lastUpdated: new Date().toISOString()
      });
      setShowPricing(true);
      setShowExplanation(true);
    } catch (err) {
      console.error('❌ Error fetching AI explanation:', err);
      setError('AI explanation unavailable');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleCheckWhy = () => {
    console.log('🔍 CHECK WHY clicked - showModal:', showModal);
    console.log('🔍 Current pricing:', pricing);
    console.log('🔍 Current showPricing:', showPricing);
    setShowModal(true);
    fetchAIExplanation();
  };

  const handleCloseModal = () => {
    console.log('🔒 Closing price analysis modal');
    setShowModal(false);
  };

  useEffect(() => {
    // Auto-refresh every 5 minutes if pricing is already shown
    if (showPricing && lat && lon) {
      const interval = setInterval(fetchPricing, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [showPricing, lat, lon]);

  // Reset when location changes
  useEffect(() => {
    setShowPricing(false);
    setPricing(null);
    setError(null);
    setAiExplanation(null);
    setShowExplanation(false);
  }, [lat, lon]);

  return (
    <>
      <div className="mb-4">
        {!showPricing ? (
          // Check Price Button
          <button
            onClick={handleCheckPrice}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 rounded-xl border border-cyan-400/30 transition-all duration-200"
          >
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">
              {isLoading ? 'Checking Price...' : 'Check Price'}
            </span>
          </button>
        ) : (
          // Price Display
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {/* Price Pill */}
              <div 
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full border border-cyan-400/30"
                title={pricing?.explain || ''}
                aria-live="polite"
              >
                {isLoading ? (
                  <span className="text-sm font-medium text-gray-300">Loading…</span>
                ) : error ? (
                  <span className="text-sm font-medium text-red-400">Price unavailable</span>
                ) : pricing ? (
                  <span className="text-sm font-medium text-white">
                    {pricing.priceRLUSD.toFixed(4)} RLUSD/hr (${pricing.priceUSD.toFixed(2)})
                  </span>
                ) : null}
              </div>
            </div>
            
            {/* CHECK WHY Button - AI Powered */}
            <button
              onClick={handleCheckWhy}
              disabled={loadingExplanation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl border border-purple-400/30 transition-all duration-200"
              style={{ 
                backgroundColor: 'rgba(147, 51, 234, 0.2)', 
                border: '1px solid rgba(147, 51, 234, 0.3)',
                minHeight: '48px'
              }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">
                {loadingExplanation ? 'Analyzing with AI...' : 'CHECK WHY'}
              </span>
            </button>
            
            {/* RLUSD Price Info */}
            {rlusdPrice && (
              <div className="text-xs text-gray-500">
                1 RLUSD = ${rlusdPrice.price.toFixed(4)} USD
              </div>
            )}
            
            {/* Refresh Price Button */}
            <button
              onClick={handleCheckPrice}
              disabled={isLoading}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Price'}
            </button>
          </div>
        )}
      </div>

      {/* AI Analysis Modal */}
      <PriceAnalysisModal
        isOpen={showModal}
        onClose={handleCloseModal}
        aiExplanation={aiExplanation}
        isLoading={loadingExplanation}
        priceUSD={pricing?.priceUSD}
        priceRLUSD={pricing?.priceRLUSD}
      />
    </>
  );
}