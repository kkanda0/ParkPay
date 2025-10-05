"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Sparkles } from 'lucide-react';
import DraggableModal from './DraggableModal';

interface PriceRowProps {
  lat: number;
  lon: number;
  locationName?: string;
  baseUSD?: number;
}

interface PricingData {
  priceUSD: number;
  priceRLUSD: number;
  rlusdRate: number;
  explanation: string;
  confidence?: number;
  components?: {
    webCrawledPrice: number;
    timeAdjustment: number;
    locationPremium: number;
    marketFactor: number;
    servicePremium: number;
  };
  marketFactors?: string[];
  streetAddress?: string;
  nearbySpots?: Array<{
    name: string;
    address: string;
    price: number;
    distance: string;
    availability: string;
  }>;
}

interface CheckWhyData {
  explanation: string;
  factors: string[];
  recommendations: string[];
}

export default function EchoPriceRow({ lat, lon, locationName, baseUSD = 5.0 }: PriceRowProps) {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [checkWhyData, setCheckWhyData] = useState<CheckWhyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkWhyLoading, setCheckWhyLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pricing data using Echo API
  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/echo-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'calculate',
          lat,
          lon,
          baseUSD,
          locationName,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setPricingData({
          priceUSD: result.data.priceUSD,
          priceRLUSD: result.data.priceRLUSD,
          rlusdRate: result.data.rlusdRate,
          explanation: result.data.explanation,
          confidence: result.data.confidence,
          components: result.data.components,
          marketFactors: result.data.marketFactors,
          streetAddress: result.data.streetAddress,
          nearbySpots: result.data.nearbySpots
        });
      } else {
        setError(result.error || 'Failed to calculate pricing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch check why data using Echo API
  const fetchCheckWhy = async () => {
    if (!pricingData) return;
    
    try {
      setCheckWhyLoading(true);
      setError(null);

      const response = await fetch('/api/echo-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkWhy',
          lat,
          lon,
          baseUSD,
          currentPrice: pricingData.priceUSD,
          locationName
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setCheckWhyData({
          explanation: result.data.explanation,
          factors: result.data.factors,
          recommendations: result.data.recommendations
        });
      } else {
        setError(result.error || 'Failed to get explanation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCheckWhyLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPricing();
  }, [lat, lon, baseUSD, locationName]);

  const handleCheckWhy = () => {
    setShowModal(true);
    fetchCheckWhy();
  };

  if (loading) {
    return (
      <div className="mb-4 p-4 bg-white/10 rounded-xl border border-white/20">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mr-2" />
          <span className="text-white">Calculating price with AI...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 p-4 bg-red-500/20 rounded-xl border border-red-500/30">
        <div className="text-red-300 text-sm">
          <p className="font-medium">Pricing Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!pricingData) {
    return null;
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Price Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl border border-white/30 backdrop-blur-sm"
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {pricingData.priceRLUSD.toFixed(4)} RLUSD/hr
          </div>
          <div className="text-sm text-cyan-200">
            (${pricingData.priceUSD.toFixed(2)})
          </div>
          <div className="text-xs text-gray-300 mt-1">
            1 RLUSD = ${pricingData.rlusdRate.toFixed(4)} USD
          </div>
          {pricingData.streetAddress && (
            <div className="text-xs text-gray-400 mt-2 border-t border-white/20 pt-2">
              📍 {pricingData.streetAddress}
            </div>
          )}
        </div>
      </motion.div>

      {/* Check Why Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCheckWhy}
        disabled={checkWhyLoading}
        className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl transition-all duration-200 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checkWhyLoading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Checking with Echo...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>CHECK WHY</span>
          </>
        )}
      </motion.button>

      {/* Draggable Modal */}
      <DraggableModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isLoading={checkWhyLoading}
        explanation={checkWhyData?.explanation}
        factors={checkWhyData?.factors}
        recommendations={checkWhyData?.recommendations}
      />
    </div>
  );
}
