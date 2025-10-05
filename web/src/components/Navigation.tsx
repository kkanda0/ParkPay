'use client'

import { motion } from 'framer-motion'
import { MapPin, Wallet, MessageCircle, BarChart3, LogOut, Clock } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Sessions', href: '/sessions', icon: Clock },
  { name: 'Map', href: '/map', icon: MapPin },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Provider', href: '/provider', icon: BarChart3 },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  // Don't show navigation on home page
  if (pathname === '/') {
    return null
  }

  const handleLogout = () => {
    // Clear any stored authentication data
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    // Redirect to homepage
    router.push('/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-md">
        <div className="glass-card rounded-2xl p-2">
          <div className="flex items-center justify-around">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center p-3 rounded-xl transition-all duration-300",
                    isActive 
                      ? "text-white" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-600 rounded-xl opacity-20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <Icon 
                    size={24} 
                    className={cn(
                      "relative z-10 transition-all duration-300",
                      isActive && "scale-110"
                    )}
                  />
                  
                  <span className={cn(
                    "text-xs font-medium mt-1 relative z-10 transition-all duration-300",
                    isActive && "font-semibold"
                  )}>
                    {item.name}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 left-1/2 w-1 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  )}
                </Link>
              )
            })}
            
            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 text-gray-400 hover:text-red-400"
            >
              <LogOut 
                size={24} 
                className="relative z-10 transition-all duration-300"
              />
              <span className="text-xs font-medium mt-1 relative z-10 transition-all duration-300">
                Logout
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  )
}
