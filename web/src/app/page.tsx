'use client'

import { motion } from 'framer-motion'
import { Car, Zap, Brain, Shield } from 'lucide-react'
import Link from 'next/link'


// Main content component that uses Echo hooks
function HomePageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8 pb-32">
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
          className="w-32 h-32 bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto mb-12 neon-glow"
        >
          <Car className="w-16 h-16 text-white" />
        </motion.div>
        
        <h1 className="text-8xl font-bold gradient-text mb-8 leading-tight">
          ParkPay
        </h1>
        
        <p className="text-2xl text-gray-300 mb-12 max-w-3xl">
          Pay Smarter Park Faster
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
              className="btn-primary px-12 py-6 rounded-2xl text-xl font-semibold"
            >
              Find Parking
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl"
      >
        {[
          {
            icon: Zap,
            title: "Instant Payments",
            description: "XRPL-powered micropayments with RLUSD"
          },
          {
            icon: Brain,
            title: "Echo AI + Opik by Comet",
            description: "Smart insights and curated recommendations"
          },
          {
            icon: Shield,
            title: "Secure",
            description: "Blockchain-based escrow and settlement"
          },
          {
            icon: Car,
            title: "Real-time",
            description: "Live billing"
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
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-base">{feature.description}</p>
            </motion.div>
          )
        })}
      </motion.div>

    </div>
  )
}

// Main export component
export default function HomePage() {
  return <HomePageContent />
}
