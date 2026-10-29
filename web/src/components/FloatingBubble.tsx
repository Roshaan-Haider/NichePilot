import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  X,
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  RotateCcw,
} from "lucide-react"
import { useChat } from "../context/ChatContext"

/* Helper to format tool status */
function formatToolName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes("search")) return "Searching listings..."
  if (lower.includes("lead")) return "Lead saved"
  if (lower.includes("handoff") || lower.includes("human")) return "Connecting you to a human..."
  return name
}

/* Typing dots with transform/opacity only */
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

export function FloatingBubble() {
  const {
    messages,
    isLoading,
    currentTool,
    sendMessage,
    retryLastMessage,
    heroCardRef,
    registerScrollContainer,
    isBubbleOpen,
    setBubbleOpen,
  } = useChat()
  const [inputValue, setInputValue] = useState("")
  const [isHeroVisible, setIsHeroVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Register message scroll container (scroll only this, never page)
  useEffect(() => {
    if (containerRef.current) {
      return registerScrollContainer(containerRef.current)
    }
  }, [registerScrollContainer, isBubbleOpen])

  // IntersectionObserver on hero card ref
  useEffect(() => {
    const el = heroCardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsHeroVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [heroCardRef])

  // Recheck on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setIsHeroVisible(false)
    }
    window.addEventListener("resize", onResize)
    onResize()
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const showLauncher = !isHeroVisible

  // When bubble opens, focus input with preventScroll
  useEffect(() => {
    if (isBubbleOpen) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100)
    }
  }, [isBubbleOpen])

  const handleSend = (text?: string) => {
    const msg = (text ?? inputValue).trim()
    if (!msg || isLoading || msg.length > 500) return
    setInputValue("")
    sendMessage(msg)
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50)
  }

  if (!showLauncher) return null

  const panelVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Floating Panel */}
      <AnimatePresence>
        {isBubbleOpen && (
          <motion.div
            key="bubble-panel"
            initial={shouldReduceMotion ? false : panelVariants.hidden}
            animate={panelVariants.visible}
            exit={shouldReduceMotion ? undefined : panelVariants.hidden}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: 380,
              height: 540,
              background: "rgba(12,12,12,0.96)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(197,168,128,0.25)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.80), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(197,168,128,0.15)", border: "1px solid rgba(197,168,128,0.30)" }}
                >
                  <Bot className="w-3.5 h-3.5" style={{ color: "#C5A880" }} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white leading-none block">AI Concierge</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-[10px]" style={{ color: "#8C877F" }}>Online · Replies instantly</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setBubbleOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}
                aria-label="Close chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages container - registered with registerScrollContainer */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "#C5A880" }}
                    >
                      <Bot className="w-3 h-3" />
                    </div>
                  )}
                  <div
                    className="max-w-[82%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "#C5A880", color: "#0A0A0A", fontWeight: 500, borderTopRightRadius: 4 }
                        : { background: "#1C1C1C", color: "#E8E4DC", border: "1px solid rgba(255,255,255,0.06)", borderTopLeftRadius: 4 }
                    }
                  >
                    {msg.isTyping ? (
                      <div className="flex flex-col gap-1.5">
                        <TypingDots caption={msg.typingCaption} />
                        {currentTool && (
                          <div
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] w-fit"
                            style={{ background: "rgba(197,168,128,0.10)", border: "1px solid rgba(197,168,128,0.25)", color: "#C5A880" }}
                          >
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>{formatToolName(currentTool)}</span>
                          </div>
                        )}
                      </div>
                    ) : msg.isError ? (
                      <div className="flex flex-col gap-2">
                        <p className="whitespace-pre-wrap" style={{ color: "#E8E4DC" }}>{msg.content}</p>
                        <button
                          onClick={retryLastMessage}
                          className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg cursor-pointer w-fit transition-all"
                          style={{ background: "rgba(197,168,128,0.12)", border: "1px solid rgba(197,168,128,0.25)", color: "#C5A880" }}
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
                              className="inline-block w-0.5 h-3 ml-0.5 align-middle"
                              style={{
                                background: "#C5A880",
                                animation: shouldReduceMotion ? "none" : "blink 0.8s step-end infinite",
                              }}
                            />
                          )}
                      </p>
                    )}

                    {/* Tool chip shown if active while streaming text */}
                    {!msg.isTyping && currentTool && isLoading && msg.role === "assistant" &&
                      msg.id === [...messages].reverse().find((m) => m.role === "assistant")?.id && (
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] w-fit mt-1.5"
                          style={{ background: "rgba(197,168,128,0.10)", border: "1px solid rgba(197,168,128,0.25)", color: "#C5A880" }}
                        >
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          <span>{formatToolName(currentTool)}</span>
                        </div>
                      )}
                  </div>
                  {msg.role === "user" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(197,168,128,0.15)", border: "1px solid rgba(197,168,128,0.35)", color: "#C5A880" }}
                    >
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
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
                    placeholder="Ask about properties..."
                    disabled={isLoading}
                    className="w-full pl-3 pr-12 py-2 rounded-xl text-white placeholder-white/30 text-[12px] focus:outline-none transition-colors disabled:opacity-50"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(197,168,128,0.20)",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(197,168,128,0.50)" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(197,168,128,0.20)" }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono" style={{ color: "#8C877F" }}>
                    {inputValue.length}/500
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 rounded-xl transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                  style={{ background: "#C5A880", color: "#0A0A0A" }}
                  aria-label="Send"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher button */}
      <motion.button
        onClick={() => setBubbleOpen(!isBubbleOpen)}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
        className="relative flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full cursor-pointer"
        style={{
          background: "rgba(12,12,12,0.92)",
          border: "1px solid rgba(197,168,128,0.35)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.50), 0 0 0 1px rgba(197,168,128,0.10)",
          color: "#E8E4DC",
        }}
        aria-label="Open AI Concierge chat"
      >
        {!isBubbleOpen && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "rgba(197,168,128,0.40)" }}
          />
        )}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(197,168,128,0.15)", border: "1px solid rgba(197,168,128,0.30)" }}
        >
          {isBubbleOpen ? (
            <X className="w-3.5 h-3.5" style={{ color: "#C5A880" }} />
          ) : (
            <MessageSquare className="w-3.5 h-3.5" style={{ color: "#C5A880" }} />
          )}
        </div>
        <span className="text-xs font-medium tracking-wide">Inquire with AI</span>
      </motion.button>
    </div>
  )
}
