import { useEffect, useState } from "react"
import type { NicheListItem } from "../types"
import { ArrowUpRight, ShieldCheck, Lock } from "lucide-react"

interface DemoHubProps {
  onSelectNiche: (slug: string) => void
}

export function DemoHub({ onSelectNiche }: DemoHubProps) {
  const [niches, setNiches] = useState<NicheListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNiches() {
      try {
        const res = await fetch("/niches")
        if (!res.ok) throw new Error("Failed to load niches")
        const data: NicheListItem[] = await res.json()
        setNiches(data)
      } catch (err: any) {
        setError(err.message || "Failed to load niches")
      } finally {
        setIsLoading(false)
      }
    }
    fetchNiches()
  }, [])

  return (
    <div className="min-h-screen bg-[#070707] text-[#F5F5F7] p-6 sm:p-12 lg:p-16 flex flex-col justify-between selection:bg-[#C5A880]/30 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#C5A880]/5 blur-[140px] rounded-full"></div>
      </div>

      <div className="max-w-6xl w-full mx-auto relative z-10 space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-white/10 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#C5A880] tracking-wider uppercase font-mono">
              <Lock className="w-3 h-3" />
              <span>Private Demo Hub</span>
            </div>
            <div className="text-xs text-white/40 font-mono">
              NichePilot v0.2.0
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white font-serif">
              Omni-Niche <span className="text-[#C5A880] italic">AI Assistants</span>
            </h1>
            <p className="text-sm sm:text-base text-white/50 max-w-2xl font-light">
              Tailored conversational sales engines and bespoke visual identities. Select an active vertical below to explore the customized landing experience and live assistant.
            </p>
          </div>
        </div>

        {/* Niche Grid */}
        <div>
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse p-6 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-6 w-1/3 bg-white/10 rounded"></div>
                    <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                  </div>
                  <div className="h-8 w-24 bg-white/10 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-800/40 text-red-300 text-sm">
              <p className="font-semibold">Unable to connect to backend API:</p>
              <p className="text-xs mt-1 text-red-400">{error}</p>
              <p className="text-xs mt-2 text-white/50">Ensure FastAPI backend is running on http://127.0.0.1:8000</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {niches.map((niche) => {
                const isReady = niche.status === "ready"
                const slug = niche.name.replace(/_/g, "-")

                return (
                  <div
                    key={niche.name}
                    onClick={() => isReady && onSelectNiche(slug)}
                    className={`group relative rounded-2xl p-7 transition-all duration-300 flex flex-col justify-between h-64 border ${
                      isReady
                        ? "bg-[#111111]/80 hover:bg-[#151515] border-white/10 hover:border-[#C5A880]/60 hover:shadow-[0_10px_30px_-10px_rgba(197,168,128,0.2)] cursor-pointer"
                        : "bg-white/[0.015] border-white/5 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      {/* Top row with status badge */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="text-xs font-mono tracking-widest uppercase text-white/40">
                          Vertical
                        </span>
                        {isReady ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Live Demo
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-white/40">
                            Coming soon
                          </span>
                        )}
                      </div>

                      {/* Niche Title */}
                      <h2 className="text-xl font-medium text-white group-hover:text-[#C5A880] transition-colors">
                        {niche.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </h2>

                      {/* Tagline */}
                      <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">
                        {niche.tagline || "Industry tailored AI pipeline."}
                      </p>
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      {isReady ? (
                        <>
                          <span className="text-xs font-medium text-[#C5A880] group-hover:underline">
                            Launch Landing Experience
                          </span>
                          <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#C5A880] group-hover:text-black flex items-center justify-center transition-colors text-white/60">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-white/30 italic">
                          Catalog in development
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto relative z-10 pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-white/30 gap-4">
        <div>NichePilot Architecture: Multi-tenant, data-driven themes with progressive isolation.</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Isolated Sessions
          </span>
          <span>•</span>
          <span>FastAPI SSE Stream</span>
        </div>
      </div>
    </div>
  )
}
