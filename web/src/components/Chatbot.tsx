// web/src/components/Chatbot.tsx
"use client";

import React, { useState, useRef } from "react";

type Message = { id: string; sender: "user" | "bot"; text: string };

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // default base for your API server (dev). Prefer overriding via NEXT_PUBLIC_API_BASE_URL
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    // append user message
    const userMsg: Message = { id: `u-${Date.now()}`, sender: "user", text };
    setMessages((m) => [...m, userMsg]);

    // add an empty bot message placeholder that we'll update as we stream
    const botId = `b-${Date.now()}`;
    setMessages((m) => [...m, { id: botId, sender: "bot", text: "" }]);

    // abort previous streaming if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const txt = await res.text();
        throw new Error(txt || "Upstream error");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let current = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // the server sends SSE-like `data: piece\n\n` lines; we can append raw chunk.
          // For safety, strip "data:" prefixes if present.
          const cleaned = chunk.replace(/data:\s*/g, "");
          current += cleaned;

          // update the bot placeholder message
          setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, text: current } : m)));
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => prev.map((m) => (m.id.startsWith("b-") ? { ...m, text: (m.text || "") + "\n\n[error]" } : m)));
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow-sm">
      <div className="h-64 overflow-y-auto mb-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={m.sender === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block px-3 py-1 rounded ${m.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}>
              {m.text || <span className="italic text-gray-500">…</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 border rounded"
          placeholder="Ask the assistant..."
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-green-600 text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
}
