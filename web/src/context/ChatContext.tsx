import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react"
import type { RefObject } from "react"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  isTyping?: boolean
  typingCaption?: string
  isError?: boolean
}

interface ChatContextValue {
  messages: ChatMessage[]
  isLoading: boolean
  currentTool: string | null
  sessionId: string
  sendMessage: (text: string) => void
  heroCardRef: RefObject<HTMLDivElement | null>
  registerScrollContainer: (el: HTMLDivElement | null) => () => void
  isBubbleOpen: boolean
  setBubbleOpen: (open: boolean) => void
  retryLastMessage: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

interface ChatProviderProps {
  niche: string
  greeting: string
  children: React.ReactNode
}

export function ChatProvider({ niche, greeting, children }: ChatProviderProps) {
  const [sessionId] = useState(() => "web_" + Math.random().toString(36).substring(2, 10))
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "initial-greeting", role: "assistant", content: greeting },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [isBubbleOpen, setBubbleOpen] = useState(false)
  const heroCardRef = useRef<HTMLDivElement | null>(null)
  const scrollContainers = useRef<Set<HTMLDivElement>>(new Set())
  const lastTextRef = useRef("")
  const abortControllerRef = useRef<AbortController | null>(null)

  const registerScrollContainer = useCallback((el: HTMLDivElement | null) => {
    if (!el) return () => {}
    scrollContainers.current.add(el)
    return () => {
      scrollContainers.current.delete(el)
    }
  }, [])

  /** Scroll only message containers if near bottom — never touches window.scrollY */
  const scrollContainersIfNearBottom = useCallback(() => {
    scrollContainers.current.forEach((el) => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
      if (nearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
      }
    })
  }, [])

  /** Force scroll to bottom on new user message send */
  const scrollContainersToBottom = useCallback(() => {
    scrollContainers.current.forEach((el) => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    })
  }, [])

  const doSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading || trimmed.length > 500) return

      lastTextRef.current = trimmed

      const userMsgId = "u_" + Date.now()
      const asstId = "a_" + (Date.now() + 1)

      // Immediate: user message + typing bubble appear at once (within 100ms)
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: trimmed },
        { id: asstId, role: "assistant", content: "", isTyping: true },
      ])
      setIsLoading(true)
      setCurrentTool(null)

      // Scroll container down on new message
      setTimeout(scrollContainersToBottom, 30)

      // 6s timer: update caption to "Still working on it..."
      const slowTimer = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId && m.isTyping
              ? { ...m, typingCaption: "Still working on it..." }
              : m
          )
        )
      }, 6000)

      // 20s timer: show friendly retry message with Retry button
      const timeoutTimer = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId && m.isTyping
              ? {
                  ...m,
                  isTyping: false,
                  typingCaption: undefined,
                  isError: true,
                  content: "It's taking a while — please try again.",
                }
              : m
          )
        )
        setIsLoading(false)
        setCurrentTool(null)
        clearTimeout(slowTimer)
        setTimeout(scrollContainersIfNearBottom, 40)
      }, 20000)

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const response = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message: trimmed, niche }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error("Chat request failed.")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let fullText = ""
        let firstToken = true

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split("\n\n")
          buffer = events.pop() || ""

          for (const evtBlock of events) {
            if (!evtBlock.trim()) continue
            let evtType = "message"
            let dataStr = ""
            for (const line of evtBlock.split("\n")) {
              if (line.startsWith("event: ")) evtType = line.substring(7).trim()
              else if (line.startsWith("data: ")) dataStr = line.substring(6).trim()
            }
            if (!dataStr) continue
            try {
              const data = JSON.parse(dataStr)
              if (evtType === "token") {
                fullText += data.content || ""
                if (firstToken) {
                  firstToken = false
                  clearTimeout(slowTimer)
                  clearTimeout(timeoutTimer)
                  // Replace typing bubble with streaming text
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === asstId
                        ? { ...m, isTyping: false, typingCaption: undefined, content: fullText }
                        : m
                    )
                  )
                } else {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === asstId ? { ...m, content: fullText } : m))
                  )
                }
                setTimeout(scrollContainersIfNearBottom, 30)
              } else if (evtType === "tool") {
                setCurrentTool(data.name || data.tool || data.status || null)
                setTimeout(scrollContainersIfNearBottom, 30)
              } else if (evtType === "done") {
                setCurrentTool(null)
              }
            } catch {
              // ignore json parse error
            }
          }
        }

        clearTimeout(slowTimer)
        clearTimeout(timeoutTimer)

        // Ensure typing flag is cleared
        setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, isTyping: false, typingCaption: undefined } : m))
        )
      } catch (err: unknown) {
        clearTimeout(slowTimer)
        clearTimeout(timeoutTimer)
        // If aborted due to 20s timeout, the state is already set
        if (controller.signal.aborted) return

        // Friendly retry message, never a stack trace
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  isTyping: false,
                  typingCaption: undefined,
                  isError: true,
                  content: "Connection interrupted. Please try again.",
                }
              : m
          )
        )
      } finally {
        setIsLoading(false)
        setCurrentTool(null)
        setTimeout(scrollContainersIfNearBottom, 50)
      }
    },
    [isLoading, niche, sessionId, scrollContainersIfNearBottom, scrollContainersToBottom]
  )

  const sendMessage = doSend

  const retryLastMessage = useCallback(() => {
    if (lastTextRef.current) {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.isError) return prev.slice(0, -2) // remove user + error pair
        return prev
      })
      doSend(lastTextRef.current)
    }
  }, [doSend])

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        currentTool,
        sessionId,
        sendMessage,
        heroCardRef,
        registerScrollContainer,
        isBubbleOpen,
        setBubbleOpen,
        retryLastMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used inside ChatProvider")
  return ctx
}
