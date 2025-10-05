'use client'

import { useState } from 'react'

type Msg = { role: 'user' | 'ai'; content: string }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function SimpleChat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      const aiText = data?.message ?? 'No response'
      setMessages(prev => [...prev, { role: 'ai', content: aiText }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${err?.message || String(err)}` }])
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0b1220' }}>
      <div style={{ padding: 16, borderBottom: '1px solid #263043', color: '#fff' }}>
        <strong>Simple Chat</strong>
        <span style={{ marginLeft: 8, color: '#9aa4b2' }}>live backend only</span>
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            margin: '8px 0',
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              background: m.role === 'user' ? '#1e293b' : '#0ea5e9',
              color: m.role === 'user' ? '#e2e8f0' : '#0b1220',
              padding: '10px 12px',
              borderRadius: 12,
              maxWidth: 560,
              whiteSpace: 'pre-wrap'
            }}>{m.content}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #263043', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message and press Enter"
          style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #263043', borderRadius: 10, padding: '10px 12px' }}
          disabled={sending}
        />
        <button onClick={send} disabled={sending || !input.trim()} style={{
          background: '#22c55e',
          color: '#0b1220',
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          cursor: 'pointer',
          opacity: sending || !input.trim() ? 0.6 : 1
        }}>Send</button>
      </div>
    </div>
  )
}


