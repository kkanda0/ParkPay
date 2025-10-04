'use client'

import { motion } from 'framer-motion'
import { Car, Zap, Brain, Shield } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 pb-20">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
          className="w-24 h-24 bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto mb-8 neon-glow"
        >
          <Car className="w-12 h-12 text-white" />
        </motion.div>
        
        <h1 className="text-6xl font-bold gradient-text mb-4">
          ParkPay
        </h1>
        
        <p className="text-xl text-gray-300 mb-8 max-w-2xl">
          Revolutionary parking micropayments using XRPL + RLUSD and Echo AI insights
        </p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/map">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-8 py-4 rounded-2xl text-lg font-semibold"
            >
              Find Parking
            </motion.button>
          </Link>
          
          <Link href="/provider">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary px-8 py-4 rounded-2xl text-lg font-semibold"
            >
              Provider Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl"
      >
        {[
          {
            icon: Zap,
            title: "Instant Payments",
            description: "XRPL-powered micropayments with RLUSD"
          },
          {
            icon: Brain,
            title: "Echo AI",
            description: "Smart insights and anomaly detection"
          },
          {
            icon: Shield,
            title: "Secure",
            description: "Blockchain-based escrow and settlement"
          },
          {
            icon: Car,
            title: "Real-time",
            description: "Live spot availability and billing"
          }
        ].map((feature, index) => {
          const Icon = feature.icon
          
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Demo Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-16 glass-card rounded-2xl p-8 max-w-4xl w-full"
      >
        <h2 className="text-2xl font-bold text-white text-center mb-8">Live Demo Stats</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Active Sessions", value: "17", color: "text-green-400" },
            { label: "Available Spots", value: "3", color: "text-blue-400" },
            { label: "Total Revenue", value: "$245.60", color: "text-purple-400" },
            { label: "AI Insights", value: "12", color: "text-cyan-400" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.6 + index * 0.1, type: "spring", bounce: 0.3 }}
              className="text-center"
            >
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <Navigation />
    </div>
  )
}
