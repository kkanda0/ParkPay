"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Clock, DollarSign, Car, MapPin } from "lucide-react";

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

interface SpotSheetProps {
  spot: ParkingSpot | null;
  onClose: () => void;
  onStartSession?: (spotId: string) => void;
}

export default function SpotSheet({ spot, onClose, onStartSession }: SpotSheetProps) {
  const [sessionTime, setSessionTime] = useState<string>("");

  useEffect(() => {
    if (spot?.status === "OCCUPIED") {
      // Calculate estimated end time (mock data for demo)
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      setSessionTime(endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [spot]);

  const handleStartSession = () => {
    if (spot && onStartSession) {
      onStartSession(spot.id);
    }
  };

  if (!spot) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="glass-card rounded-t-3xl p-6 text-white">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                spot.status === "FREE" ? "bg-green-400" : "bg-red-400"
              }`}></div>
              <h3 className="text-xl font-semibold">
                {spot.label || spot.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status */}
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              spot.status === "FREE" 
                ? "bg-green-400/20 text-green-400" 
                : "bg-red-400/20 text-red-400"
            }`}>
              {spot.status === "FREE" ? "Available" : "Occupied"}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            {spot.rate && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-gray-300">Rate</p>
                  <p className="font-semibold">{spot.rate.toFixed(2)} RLUSD/hour</p>
                  <p className="text-xs text-gray-400">${(spot.rate / 60).toFixed(2)}/min</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm text-gray-300">Location</p>
                <p className="font-semibold">
                  {spot.lat.toFixed(4)}, {spot.lon.toFixed(4)}
                </p>
              </div>
            </div>

            {spot.capacity && (
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-gray-300">Capacity</p>
                  <p className="font-semibold">{spot.capacity} spots</p>
                </div>
              </div>
            )}

            {spot.status === "OCCUPIED" && sessionTime && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-300">Estimated End</p>
                  <p className="font-semibold text-red-400">~{sessionTime}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          {spot.status === "FREE" ? (
            <button
              onClick={handleStartSession}
              className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold py-3 rounded-2xl hover:from-cyan-300 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
            >
              Start Session
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-700 text-gray-400 py-3 rounded-2xl cursor-not-allowed"
            >
              Currently Occupied
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
