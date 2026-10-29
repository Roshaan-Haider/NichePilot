import { useState } from "react"
import { Search, ChevronDown } from "lucide-react"
import { useChat } from "../context/ChatContext"

interface GlassSearchBarProps {
  searchAreas: string[]
  searchMaxBudgets: string[]
}

export function GlassSearchBar({ searchAreas, searchMaxBudgets }: GlassSearchBarProps) {
  const [intent, setIntent] = useState<"For Sale" | "For Rent">("For Sale")
  const [area, setArea] = useState("")
  const [bedrooms, setBedrooms] = useState("")
  const [maxBudget, setMaxBudget] = useState("")
  const { sendMessage } = useChat()

  const BEDROOMS = ["Any", "1", "2", "3", "4", "5+"]

  const handleSearch = () => {
    const parts: string[] = []
    if (bedrooms && bedrooms !== "Any") parts.push(`${bedrooms}-bedroom`)
    parts.push("property")
    if (area) parts.push(`in ${area}`)
    parts.push(intent === "For Sale" ? "to buy" : "to rent")
    if (maxBudget) parts.push(`under ${maxBudget}`)
    const query = parts.join(" ")

    sendMessage(query)
  }

  const selectClass =
    "appearance-none bg-transparent text-sm text-white/80 cursor-pointer focus:outline-none pr-5 py-1 w-full"

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(197,168,128,0.20)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
      }}
    >
      {/* Intent toggle */}
      <div className="flex border-b" style={{ borderColor: "rgba(197,168,128,0.15)" }}>
        {(["For Sale", "For Rent"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setIntent(opt)}
            className="flex-1 py-2.5 text-xs font-medium tracking-wide uppercase transition-all cursor-pointer"
            style={{
              background: intent === opt ? "rgba(197,168,128,0.15)" : "transparent",
              color: intent === opt ? "#C5A880" : "#8C877F",
              borderBottom: intent === opt ? "1px solid #C5A880" : "1px solid transparent",
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-col sm:flex-row">
        {/* Area */}
        <div
          className="flex-1 flex items-center gap-2 px-4 py-3 relative"
          style={{ borderRight: "1px solid rgba(197,168,128,0.12)" }}
        >
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest block mb-0.5" style={{ color: "#8C877F" }}>Area</label>
            <div className="relative">
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className={selectClass}
              >
                <option value="" style={{ background: "#111" }}>All Areas</option>
                {searchAreas.map((a) => (
                  <option key={a} value={a} style={{ background: "#111" }}>{a}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: "#C5A880" }} />
            </div>
          </div>
        </div>

        {/* Bedrooms */}
        <div
          className="flex-1 flex items-center gap-2 px-4 py-3 relative"
          style={{ borderRight: "1px solid rgba(197,168,128,0.12)" }}
        >
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest block mb-0.5" style={{ color: "#8C877F" }}>Bedrooms</label>
            <div className="relative">
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className={selectClass}
              >
                {BEDROOMS.map((b) => (
                  <option key={b} value={b} style={{ background: "#111" }}>{b}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: "#C5A880" }} />
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="flex-1 flex items-center gap-2 px-4 py-3 relative">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest block mb-0.5" style={{ color: "#8C877F" }}>Max Budget</label>
            <div className="relative">
              <select
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className={selectClass}
              >
                <option value="" style={{ background: "#111" }}>No limit</option>
                {searchMaxBudgets.map((b) => (
                  <option key={b} value={b} style={{ background: "#111" }}>{b}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: "#C5A880" }} />
            </div>
          </div>
        </div>

        {/* Search button */}
        <div className="px-3 py-2.5 flex items-end">
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all cursor-pointer w-full sm:w-auto justify-center"
            style={{ background: "#C5A880", color: "#0A0A0A" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#D4AF37" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#C5A880" }}
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </div>
      </div>
    </div>
  )
}

