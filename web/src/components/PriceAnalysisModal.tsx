"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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

interface PriceAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiExplanation: AIExplanation | null;
  isLoading: boolean;
  priceUSD?: number;
  priceRLUSD?: number;
}

export default function PriceAnalysisModal({
  isOpen,
  onClose,
  aiExplanation,
  isLoading,
  priceUSD,
  priceRLUSD
}: PriceAnalysisModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Debug logging
  useEffect(() => {
    console.log('🔍 Modal state changed - isOpen:', isOpen);
    console.log('🔍 Modal props - isLoading:', isLoading, 'aiExplanation:', !!aiExplanation);
  }, [isOpen, isLoading, aiExplanation]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('🔒 Closing modal via Escape key');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep modal within viewport bounds
    const maxX = window.innerWidth - 400; // modal width
    const maxY = window.innerHeight - 300; // modal height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              console.log('🔒 Closing modal via backdrop click');
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'default'
              }}
              className="glass-card rounded-3xl w-96 max-h-[85vh] overflow-hidden shadow-2xl border border-white/20"
            >
              {/* Header - Draggable */}
              <div 
                onMouseDown={handleMouseDown}
                className="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-6 border-b border-purple-500/20 cursor-grab active:cursor-grabbing"
              >
                <button
                  onClick={() => {
                    console.log('🔒 Closing modal via X button');
                    onClose();
                  }}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">Price Analysis</h2>
                </div>

                {priceUSD && priceRLUSD && (
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      ${priceUSD.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-300">
                      ({priceRLUSD.toFixed(4)} RLUSD/hr)
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-6 space-y-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
                    />
                    <p className="text-white mt-4 font-medium">Analyzing with AI...</p>
                    <p className="text-gray-400 text-sm mt-2">Fetching real-time data from TomTom</p>
                  </div>
                ) : aiExplanation ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >

                    {/* Summary - No title */}
                    <div className="p-5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                      <p className="text-white leading-relaxed text-base">
                        {aiExplanation.summary}
                      </p>
                    </div>

                    {/* Factors - No title */}
                    <div>
                      <div className="space-y-4">
                        {/* Traffic */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="p-5 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl border border-red-500/20 hover:border-red-500/30 transition-all duration-200"
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-base font-semibold text-red-300 mb-1">Traffic Conditions</h4>
                              <p className="text-sm text-gray-300">{aiExplanation.factors.traffic}</p>
                            </div>
                            <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                              <p className="text-xs text-gray-400 mb-1">Real-time Data</p>
                              <p className="text-sm text-white font-medium">
                                {aiExplanation.realData.traffic.currentSpeed} km/h 
                                <span className="text-gray-500 mx-2">vs</span>
                                {aiExplanation.realData.traffic.freeFlowSpeed} km/h free-flow
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Congestion: {aiExplanation.realData.traffic.congestionLevel}
                              </p>
                            </div>
                            {aiExplanation.factors.trafficAnalysis && (
                              <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                                <p className="text-xs text-purple-300 font-medium mb-1">AI Analysis</p>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  {aiExplanation.factors.trafficAnalysis}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Hotspots */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="p-5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20 hover:border-yellow-500/30 transition-all duration-200"
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-base font-semibold text-yellow-300 mb-1">Nearby Hotspots</h4>
                              <p className="text-sm text-gray-300">{aiExplanation.factors.hotspots}</p>
                            </div>
                            <div className="p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
                              <p className="text-xs text-gray-400 mb-1">Real-time Data</p>
                              <p className="text-sm text-white font-medium">
                                {aiExplanation.realData.hotspots.count} POIs within 400m
                              </p>
                              {aiExplanation.realData.hotspots.nearbyPOIs.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Top locations: {aiExplanation.realData.hotspots.nearbyPOIs.slice(0, 3).map(p => p.name).join(', ')}
                                </p>
                              )}
                            </div>
                            {aiExplanation.factors.hotspotsAnalysis && (
                              <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                                <p className="text-xs text-purple-300 font-medium mb-1">AI Analysis</p>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  {aiExplanation.factors.hotspotsAnalysis}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* EV Demand */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20 hover:border-green-500/30 transition-all duration-200"
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-base font-semibold text-green-300 mb-1">EV Charging Demand</h4>
                              <p className="text-sm text-gray-300">{aiExplanation.factors.evDemand}</p>
                            </div>
                            <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                              <p className="text-xs text-gray-400 mb-1">Real-time Data</p>
                              <p className="text-sm text-white font-medium">
                                {aiExplanation.realData.evDemand.nearbyChargers} charging stations within 600m
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Demand level: {aiExplanation.realData.evDemand.estimatedDemand}
                              </p>
                            </div>
                            {aiExplanation.factors.evDemandAnalysis && (
                              <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                                <p className="text-xs text-purple-300 font-medium mb-1">AI Analysis</p>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  {aiExplanation.factors.evDemandAnalysis}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Detailed Reasoning - No title */}
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {aiExplanation.detailed}
                      </p>
                    </div>

                    {/* Trace ID */}
                    {aiExplanation.opikTraceId && (
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-xs text-gray-500">
                          Trace ID: {aiExplanation.opikTraceId.slice(0, 16)}...
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No analysis available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
