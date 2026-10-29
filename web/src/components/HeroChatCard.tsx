import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Send, Bot, User, Loader2, ChevronRight, RotateCcw } from "lucide-react"
import { useChat } from "../context/ChatContext"
import type { RefObject } from "react"

/* WhatsApp SVG icon */
const WaIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.537 5.874L.057 23.5l5.797-1.517A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.742.98.998-3.648-.235-.374A9.862 9.862 0 012.1 12C2.1 6.533 6.533 2.1 12 2.1c5.466 0 9.9 4.433 9.9 9.9 0 5.466-4.434 9.9-9.9 9.9z" />
  </svg>
)

/* Helper to format tool status */
function formatToolName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes("search")) return "Searching listings..."
  if (lower.includes("lead")) return "Lead saved"
  if (lower.includes("handoff") || lower.includes("human")) return "Connecting you to a human..."
  return name
}

/* Typing dots animation with transform/opacity only */
function TypingDots({ caption }: { caption?: string }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 py-0.5">
        {shouldReduceMotion ? (
          <span className="text-xs font-bold tracking-widest text-[#C5A880]">•••</span>
        ) : (
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: "#C5A880" }}
              animate={{
                opacity: [0.35, 1, 0.35],
                transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)"],
              }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
            />
          ))
        )}
      </div>
      {caption && (
        <span className="text-[11px]" style={{ color: "#8C877F" }}>{caption}</span>
      )}
    </div>
  )
}

interface HeroChatCardProps {
  suggestions: string[]
  greeting: string
  whatsappNumber?: string
  whatsappPrefill?: string
}

export function HeroChatCard({ suggestions, greeting: _greeting, whatsappNumber, whatsappPrefill }: HeroChatCardProps) {
  const {
    messages,
    isLoading,
    currentTool,
    sendMessage,
    retryLastMessage,
    heroCardRef,
    registerScrollContainer,
  } = useChat()
  const [inputValue, setInputValue] = useState("")
  const [chipsExpanded, setChipsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Attach heroCardRef for IntersectionObserver
  const attachCardRef = (el: HTMLDivElement | null) => {
    ;(heroCardRef as RefObject<HTMLDivElement | null>).current = el
  }

  // Register scroll container with ChatContext (scrolls only this container, never page)
  useEffect(() => {
    if (containerRef.current) {
      return registerScrollContainer(containerRef.current)
    }
  }, [registerScrollContainer])

  // Auto-focus on desktop with preventScroll
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [])

  // Has user sent at least one message?
  const userHasSent = messages.some((m) => m.role === "user")

  const handleSend = (text?: string) => {
    const msg = (text ?? inputValue).trim()
    if (!msg || isLoading || msg.length > 500) return
    setInputValue("")
    sendMessage(msg)
    // Re-focus without page scroll
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50)
  }

  const waUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappPrefill || "")}`
    : null

  return (
    <div className="flex flex-col gap-2">
      {/* Label above card with pulsing gold dot */}
      <div className="flex items-center gap-2 pl-1">
        <span className="relative flex items-center justify-center w-2 h-2">
          <span
            className="absolute inline-block w-2 h-2 rounded-full"
            style={{
              background: "#C5A880",
              animation: shouldReduceMotion ? "none" : "pulse 2s ease-in-out infinite",
            }}
          />
          <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}`}</style>
        </span>
        <span className="text-xs font-medium tracking-wide" style={{ color: "#C5A880" }}>
          Ask our AI concierge
        </span>
        <span className="text-[11px]" style={{ color: "#8C877F" }}>
          — Find a property in seconds. Replies instantly.
        </span>
      </div>

      {/* Card */}
      <motion.div
        ref={attachCardRef}
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(197,168,128,0.32)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(197,168,128,0.08), 0 0 24px rgba(197,168,128,0.06)",
          animation: shouldReduceMotion ? "none" : "cardGlow 3.5s ease-in-out infinite alternate",
          minHeight: "480px",
          maxHeight: "540px",
        }}
      >
        <style>{`
          @keyframes cardGlow {
            from { box-shadow: 0 32px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px rgba(197,168,128,0.06); }
            to   { box-shadow: 0 32px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 36px rgba(197,168,128,0.14); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(197,168,128,0.15)", border: "1px solid rgba(197,168,128,0.30)" }}
            >
              <Bot className="w-4 h-4" style={{ color: "#C5A880" }} />
            </div>
            <div>
              <span className="text-sm font-semibold text-white leading-none block">AI Concierge</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-[11px]" style={{ color: "#8C877F" }}>Online · Replies instantly</span>
              </div>
            </div>
          </div>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
              style={{
                background: "rgba(37,211,102,0.08)",
                border: "1px solid rgba(37,211,102,0.20)",
                color: "#25D366",
              }}
              title="Continue on WhatsApp"
              aria-label="Continue on WhatsApp"
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,211,102,0.18)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,211,102,0.08)" }}
            >
              <WaIcon size={15} />
            </a>
          )}
        </div>

        {/* Messages container - containerRef registered for smooth auto-scroll */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-sm"
          style={{ scrollBehavior: "smooth" }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "#C5A880" }}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                style={
                  msg.role === "user"
                    ? { background: "#C5A880", color: "#0A0A0A", fontWeight: 500, borderTopRightRadius: 4 }
                    : { background: "#181818", color: "#E8E4DC", border: "1px solid rgba(255,255,255,0.06)", borderTopLeftRadius: 4 }
                }
              >
                {msg.isTyping ? (
                  <div className="flex flex-col gap-1.5">
                    <TypingDots caption={msg.typingCaption} />
                    {currentTool && (
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs w-fit"
                        style={{ background: "rgba(197,168,128,0.10)", border: "1px solid rgba(197,168,128,0.25)", color: "#C5A880" }}
                      >
                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        <span>{formatToolName(currentTool)}</span>
                      </div>
                    )}
                  </div>
                ) : msg.isError ? (
                  <div className="flex flex-col gap-2">
                    <p className="whitespace-pre-wrap" style={{ color: "#E8E4DC" }}>{msg.content}</p>
                    <button
                      onClick={retryLastMessage}
                      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg cursor-pointer w-fit transition-all"
                      style={{ background: "rgba(197,168,128,0.12)", border: "1px solid rgba(197,168,128,0.25)", color: "#C5A880" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(197,168,128,0.20)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(197,168,128,0.12)" }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">
                    {msg.content}
                    {isLoading && msg.role === "assistant" && msg.content && !msg.isTyping &&
                      msg.id === [...messages].reverse().find((m) => m.role === "assistant" && !m.isTyping)?.id && (
                        <span
                          className="inline-block w-0.5 h-3.5 ml-0.5 align-middle"
                          style={{
                            background: "#C5A880",
                            animation: shouldReduceMotion ? "none" : "blink 0.8s step-end infinite",
                          }}
                        />
                      )}
                  </p>
                )}

                {/* Tool status chip if active while streaming text */}
                {!msg.isTyping && currentTool && isLoading && msg.role === "assistant" &&
                  msg.id === [...messages].reverse().find((m) => m.role === "assistant")?.id && (
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs w-fit mt-1.5"
                      style={{ background: "rgba(197,168,128,0.10)", border: "1px solid rgba(197,168,128,0.25)", color: "#C5A880" }}
                    >
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      <span>{formatToolName(currentTool)}</span>
                    </div>
                  )}
              </div>

              {msg.role === "user" && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(197,168,128,0.15)", border: "1px solid rgba(197,168,128,0.35)", color: "#C5A880" }}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>

        {/* Suggestion chips — above input, collapse after first send */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={false}
              className="px-4 pb-2 shrink-0"
            >
              {!userHasSent ? (
                /* Horizontal chips row before first send */
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {suggestions.slice(0, 4).map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      disabled={isLoading}
                      className="text-xs px-2.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(197,168,128,0.22)",
                        color: "rgba(232,228,220,0.75)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(197,168,128,0.50)"
                        e.currentTarget.style.background = "rgba(197,168,128,0.08)"
                        e.currentTarget.style.color = "#E8E4DC"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(197,168,128,0.22)"
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                        e.currentTarget.style.color = "rgba(232,228,220,0.75)"
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              ) : (
                /* Collapsed "Suggestions" toggle after first send */
                <div className="pt-1">
                  <button
                    onClick={() => setChipsExpanded((x) => !x)}
                    className="flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                    style={{ color: "#8C877F" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#C5A880" }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#8C877F" }}
                  >
                    <ChevronRight
                      className="w-3 h-3 transition-transform"
                      style={{ transform: chipsExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                    Suggestions
                  </button>
                  <AnimatePresence>
                    {chipsExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-wrap gap-1.5 pt-2"
                      >
                        {suggestions.slice(0, 4).map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => { handleSend(sug); setChipsExpanded(false) }}
                            disabled={isLoading}
                            className="text-xs px-2.5 py-1.5 rounded-full transition-all cursor-pointer"
                            style={{
                              background: "rgba(197,168,128,0.08)",
                              border: "1px solid rgba(197,168,128,0.22)",
                              color: "rgba(232,228,220,0.80)",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(197,168,128,0.50)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(197,168,128,0.22)" }}
                          >
                            {sug}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input footer */}
        <div
          className="px-3 pb-3 pt-2 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.30)" }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                maxLength={500}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about properties, areas, prices..."
                disabled={isLoading}
                className="w-full pl-3.5 pr-14 py-2.5 rounded-xl text-white placeholder-white/30 text-xs focus:outline-none transition-colors disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(197,168,128,0.20)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(197,168,128,0.50)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(197,168,128,0.20)" }}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono" style={{ color: "#8C877F" }}>
                {inputValue.length}/500
              </span>
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: "#C5A880", color: "#0A0A0A" }}
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Disclaimer below card — outside panel */}
      <p className="pl-1 text-[11px]" style={{ color: "#8C877F" }}>
        Please don&apos;t share personal details in this preview.
      </p>
    </div>
  )
}
