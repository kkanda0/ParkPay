'use client';

import { useState } from 'react';
import EchoPriceRow from '@/components/EchoPriceRow';

export default function EchoTestPage() {
  const [testLocation, setTestLocation] = useState({
    lat: 40.7128,
    lon: -74.0060,
    name: 'Times Square, NYC',
    baseUSD: 5.0
  });

  const testLocations = [
    { lat: 40.7128, lon: -74.0060, name: 'Times Square, NYC', baseUSD: 5.0 },
    { lat: 40.7589, lon: -73.9851, name: 'Central Park, NYC', baseUSD: 4.5 },
    { lat: 40.7505, lon: -73.9934, name: 'Madison Square Garden, NYC', baseUSD: 6.0 },
    { lat: 40.6892, lon: -74.0445, name: 'Statue of Liberty, NYC', baseUSD: 3.5 },
    { lat: 40.7614, lon: -73.9776, name: 'Broadway District, NYC', baseUSD: 7.0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Echo Pricing System Test
        </h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testLocations.map((loc, index) => (
              <button
                key={index}
                onClick={() => setTestLocation(loc)}
                className={`p-4 rounded-xl border transition-all ${
                  testLocation.name === loc.name
                    ? 'border-cyan-400 bg-cyan-400/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-white font-medium">{loc.name}</div>
                <div className="text-sm text-gray-300">
                  Base: ${loc.baseUSD}/hr
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">
            Echo Pricing Component
          </h2>
          <EchoPriceRow 
            lat={testLocation.lat}
            lon={testLocation.lon}
            locationName={testLocation.name}
            baseUSD={testLocation.baseUSD}
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-300 text-sm">
            This page tests the Echo-based pricing system. 
            Click on different locations to see AI-powered pricing calculations.
          </p>
        </div>
      </div>
    </div>
  );
}
