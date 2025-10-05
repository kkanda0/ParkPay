'use client'

import { useState } from 'react'

export default function MapTestPage() {
  const [count, setCount] = useState(0)

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8">🗺️ Map Test Page</h1>
        <p className="text-2xl text-gray-300 mb-8">If you see this, React is working!</p>
        <button
          onClick={() => setCount(count + 1)}
          className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white text-xl font-bold rounded-xl transition-all"
        >
          Clicks: {count}
        </button>
        <p className="text-gray-400 mt-8">Now navigate to /map to test the actual page</p>
      </div>
    </div>
  )
}

