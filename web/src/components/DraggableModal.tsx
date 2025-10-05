"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Move, Sparkles, RefreshCw } from 'lucide-react';

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  explanation?: string;
  factors?: string[];
  recommendations?: string[];
}

export default function DraggableModal({
  isOpen,
  onClose,
  isLoading,
  explanation,
  factors,
  recommendations
}: DraggableModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Center modal on first open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const centerX = (window.innerWidth - rect.width) / 2;
      const centerY = (window.innerHeight - rect.height) / 2;
      setPosition({ x: centerX, y: centerY });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep modal within screen bounds
      const maxX = window.innerWidth - 400; // modal width
      const maxY = window.innerHeight - 300; // modal height
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute w-96 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl pointer-events-auto"
            style={{
              left: position.x,
              top: position.y,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Header - Draggable */}
            <div 
              data-drag-handle
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-t-xl border-b border-white/20 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Pricing Explanation</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
                  />
                  <p className="text-white mt-4 font-medium">Checking with Echo...</p>
                  <p className="text-gray-400 text-sm mt-2">Analyzing pricing factors</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Natural Explanation */}
                  {explanation && (
                    <div className="p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-start space-x-2">
                        <Sparkles className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-200 leading-relaxed">{explanation}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Factors */}
                  {factors && factors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-purple-300 mb-2">Key Factors:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {factors.map((factor, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-purple-400 mr-2 mt-0.5">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}


                  {/* Recommendations */}
                  {recommendations && recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-cyan-300 mb-2">Tips:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-cyan-400 mr-2 mt-0.5">💡</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
