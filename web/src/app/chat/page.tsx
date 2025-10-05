'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Bot, User, Sparkles } from 'lucide-react'
import { apiService, ChatMessage } from '@/lib/api'
import { useApp } from '@/app/providers'
import { cn } from '@/lib/utils'
import Navigation from '@/components/Navigation'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  suggestions?: string[]
}

export default function ChatPage() {
  const { walletAddress } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'ai',
      content: "Hi! I'm Echo AI, your parking assistant. I can help you with session management, billing questions, spot availability, and XRPL transactions. What would you like to know?",
      timestamp: new Date(),
      suggestions: [
        "How does ParkPay work?",
        "Check my balance",
        "Find parking spots",
        "View my sessions"
      ]
    }
    
    setMessages([welcomeMessage])
    
    // Test API connectivity on component mount
    testConnectivity()
  }, [walletAddress])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (content: string) => {
    console.log('🎯 handleSendMessage called with:', content)
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      console.log('🚀 Sending message:', content.trim(), 'to wallet:', walletAddress)
      console.log('🌐 API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api')
      
      // Test basic connectivity first
      console.log('🔍 Testing API connectivity...')
      const testResponse = await fetch('http://localhost:4000/api/health')
      console.log('✅ Health check:', testResponse.status, testResponse.statusText)
      
      console.log('🔍 Calling apiService.chat...')
      const aiResponse = await apiService.chat(content.trim(), walletAddress)
      console.log('✅ AI Response received:', aiResponse)

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('🚨 Error sending message:', error)
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const testConnectivity = async () => {
    console.log('🔍 Testing API connectivity...')
    console.log('🌐 API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api')
    console.log('👛 Wallet Address:', walletAddress)
    
    setDebugInfo('Testing API connectivity...')
    
    try {
      // Test basic connectivity
      console.log('🔍 Testing health endpoint...')
      setDebugInfo('Testing health endpoint...')
      const healthResponse = await apiService.healthCheck()
      console.log('✅ Health check passed:', healthResponse)
      setDebugInfo('Health check passed')
      
      // Test chat endpoint specifically
      console.log('🔍 Testing chat endpoint...')
      setDebugInfo('Testing chat endpoint...')
      const chatResponse = await apiService.chat('test connectivity', walletAddress)
      console.log('✅ Chat endpoint test passed:', chatResponse)
      setDebugInfo('Chat endpoint test passed')
      
      // Add the test response to the chat
      const testMessage: Message = {
        id: `test-${Date.now()}`,
        type: 'ai',
        content: `✅ API Test Successful! Response: ${chatResponse.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, testMessage])
      
    } catch (error) {
      console.error('❌ API connectivity failed:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      })
      
      setDebugInfo(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Add connectivity error message to chat
      const connectivityMessage: Message = {
        id: `connectivity-error-${Date.now()}`,
        type: 'ai',
        content: `⚠️ API connectivity issue detected: ${error instanceof Error ? error.message : 'Unknown error'}. Please check console for details.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, connectivityMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col pb-20">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card rounded-b-3xl p-6 mb-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Echo AI Assistant</h1>
            <p className="text-sm text-gray-400">Your smart parking companion</p>
          </div>
          <div className="ml-auto">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>
        </div>
        
        {/* Debug Info */}
        {debugInfo && (
          <div className="mt-2 p-2 bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-300">Debug: {debugInfo}</p>
          </div>
        )}
        
        {/* Manual Test Button */}
        <div className="mt-2">
          <button 
            onClick={testConnectivity}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Test API Connection
          </button>
          <button 
            onClick={async () => {
              console.log('🧪 Testing direct API call...')
              try {
                const response = await fetch('http://localhost:4000/api/ai/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: 'Direct test', walletAddress: 'test' })
                })
                const data = await response.json()
                console.log('✅ Direct API test result:', data)
                alert(`API Working! Response: ${data.message.substring(0, 50)}...`)
              } catch (error) {
                console.error('❌ Direct API test failed:', error)
                alert(`API Failed: ${error}`)
              }
            }}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 ml-2"
          >
            Direct API Test
          </button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "flex gap-3",
                  message.type === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.type === 'ai' && (
                  <div className="p-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl",
                  message.type === 'ai' 
                    ? "chat-bubble-ai" 
                    : "chat-bubble-user"
                )}>
                  <p className="text-white text-sm leading-relaxed">
                    {message.content}
                  </p>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((suggestion, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left text-xs text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="p-2 bg-white/20 rounded-full">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="p-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full">
                <Bot className="w-5 h-5 text-white" />
              </div>
              
              <div className="chat-bubble-ai px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4"
      >
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about parking..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
              disabled={isLoading}
            />
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Mic className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  inputValue.trim() && !isLoading
                    ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white"
                    : "bg-white/10 text-gray-400"
                )}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <Navigation />
    </div>
  )
}
