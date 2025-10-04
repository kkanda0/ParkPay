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
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (content: string) => {
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock AI response based on content
      const aiResponse = generateMockResponse(content)
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const generateMockResponse = (input: string): { message: string; suggestions: string[] } => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('balance') || lowerInput.includes('money')) {
      return {
        message: "Your current RLUSD balance is $25.50. You can add funds anytime through your wallet. All transactions are processed instantly via XRPL.",
        suggestions: ["Add funds", "View transaction history", "Check session costs"]
      }
    }
    
    if (lowerInput.includes('spot') || lowerInput.includes('parking') || lowerInput.includes('available')) {
      return {
        message: "I can help you find available parking spots! The map shows real-time availability with glowing markers for open spots. Currently, there are 17 spots available at Main Street Parking.",
        suggestions: ["Show me the map", "Navigate to parking lot", "Set up notifications"]
      }
    }
    
    if (lowerInput.includes('session') || lowerInput.includes('start') || lowerInput.includes('end')) {
      return {
        message: "To start a session, simply tap on an available spot on the map and press 'Start Session'. Your session will be tracked in real-time with live billing. To end, press 'End Session' and payment will be processed instantly.",
        suggestions: ["Start a session", "View active sessions", "Session history"]
      }
    }
    
    if (lowerInput.includes('charge') || lowerInput.includes('cost') || lowerInput.includes('price')) {
      return {
        message: "ParkPay charges 0.12 RLUSD per minute. You're only charged for the time you actually use the spot. Sessions are billed in real-time, so you can see your current cost as the timer runs.",
        suggestions: ["View pricing details", "Check my session costs", "Calculate parking time"]
      }
    }
    
    if (lowerInput.includes('refund') || lowerInput.includes('money back')) {
      return {
        message: "Refunds are processed automatically when sessions end early. Any unused time is credited back to your RLUSD wallet instantly via XRPL settlement. You can view all refunds in your transaction history.",
        suggestions: ["View refunds", "Check transaction history", "Contact support"]
      }
    }
    
    return {
      message: "I'm here to help with your parking needs! I can assist with session management, billing questions, spot availability, and XRPL transactions. What specific question do you have?",
      suggestions: ["How does ParkPay work?", "Check my balance", "Find parking spots", "View my sessions"]
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
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
