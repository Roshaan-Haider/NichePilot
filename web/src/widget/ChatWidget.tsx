/**
 * ChatWidget — legacy export kept for backwards compatibility.
 * The real estate page uses ChatProvider + HeroChatCard + FloatingBubble instead.
 * This stub satisfies any remaining import without rendering anything extra.
 */
export function ChatWidget(_props: {
  niche: string
  businessName?: string
  greeting?: string
  suggestions?: string[]
}) {
  // Intentionally empty — the new architecture renders chat via ChatProvider context
  return null
}
