"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from "lucide-react";
import EchoPriceRow from './EchoPriceRow';

interface ParkingSpot {
  id: string;
  lat: number;
  lon: number;
  name: string;
  status?: "FREE" | "OCCUPIED";
  type: "osm" | "managed";
  label?: string;
  rate?: number;
  fee?: string;
  capacity?: number;
}


interface SelectedSpotCardProps {
  spot: ParkingSpot | null;
  onClose: () => void;
  onStartSession: (spotId: string) => void;
}

export default function SelectedSpotCard({ spot, onClose, onStartSession }: SelectedSpotCardProps) {

  if (!spot) return null;

  const handleStartSession = () => {
    onStartSession(spot.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="spot-card"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="absolute top-4 left-4 right-4 z-10 max-w-sm"
      >
        <div className="glass-card rounded-2xl p-5 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl shadow-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">
                  {spot.label || spot.name || "Ramp Parking"}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Echo-based Price Row */}
          <EchoPriceRow 
            lat={spot.lat} 
            lon={spot.lon} 
            locationName={spot.label || spot.name}
            baseUSD={spot.rate || 5.0}
          />


          {/* Action Button */}
          <button
            onClick={handleStartSession}
            disabled={spot.status !== "FREE"}
            className={`w-full font-semibold py-3 rounded-2xl transition-all duration-300 transform ${
              spot.status === "FREE"
                ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:from-cyan-300 hover:to-purple-400 hover:scale-105"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {spot.status === "FREE" ? "Start Parking Session" : "Currently Occupied"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
