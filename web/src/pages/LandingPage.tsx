import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, MapPin, Shield } from "lucide-react"
import type { NicheDetail } from "../types"
import { ChatProvider } from "../context/ChatContext"
import { HeroChatCard } from "../components/HeroChatCard"
import { FloatingBubble } from "../components/FloatingBubble"
import { GlassSearchBar } from "../components/GlassSearchBar"

/* ─── palette constants ─────────────────────────────────────────────── */
const GOLD = "#C5A880"
const GOLD_ITALIC = "#D4AF37"
const MUTED = "#8C877F"
const BG = "#080808"
const TEXT = "#E8E4DC"

/* ─── fallback images ────────────────────────────────────────────────── */
const FALLBACK_GRADIENT = "linear-gradient(135deg,#1a1410 0%,#0d0c0b 100%)"

function safeImg(src: string, alt: string, className = "", lazy = true) {
  return (
    <img
      src={src}
      alt={alt}
      loading={lazy ? "lazy" : "eager"}
      className={className}
      onError={(e) => {
        const el = e.currentTarget
        el.style.display = "none"
        const parent = el.parentElement
        if (parent) parent.style.background = FALLBACK_GRADIENT
      }}
    />
  )
}

/* ─── sample listing data ────────────────────────────────────────────── */
const LISTINGS = [
  {
    img: "/images/real-estate/listing-1.jpg",
    alt: "Penthouse with fire pit and infinity pool",
    area: "Palm Jumeirah",
    title: "Sky Penthouse",
    beds: "4 BR",
    sqft: "5,200 SQFT",
    price: "AED 18,500,000",
  },
  {
    img: "/images/real-estate/listing-2.jpg",
    alt: "Villa with pool at dusk",
    area: "Arabian Ranches",
    title: "Garden Villa",
    beds: "6 BR",
    sqft: "8,400 SQFT",
    price: "AED 12,800,000",
  },
  {
    img: "/images/real-estate/listing-3.jpg",
    alt: "High-rise terrace with tower view",
    area: "Downtown Dubai",
    title: "Tower Terrace",
    beds: "3 BR",
    sqft: "2,800 SQFT",
    price: "AED 7,200,000",
  },
]

/* ─── Nav ─────────────────────────────────────────────────────────────── */
function Nav({
  businessName,
  brandMark,
  navItems,
}: {
  businessName: string
  brandMark: string
  navItems: { label: string; href: string }[]
}) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(197,168,128,0.12)" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-serif text-base font-bold shrink-0"
            style={{
              background: "rgba(197,168,128,0.10)",
              border: `1px solid ${GOLD}`,
              color: GOLD,
              fontFamily: "Playfair Display, serif",
            }}
          >
            {brandMark}
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-medium tracking-widest text-white uppercase">{businessName}</span>
            <span
              className="text-[10px] block tracking-widest uppercase mt-0.5"
              style={{ color: MUTED }}
            >
              Demo with sample data
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs uppercase tracking-widest transition-colors"
              style={{ color: MUTED }}
              onMouseEnter={(e) => { e.currentTarget.style.color = TEXT }}
              onMouseLeave={(e) => { e.currentTarget.style.color = MUTED }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-widest transition-all"
            style={{
              background: "rgba(197,168,128,0.12)",
              border: `1px solid ${GOLD}`,
              color: GOLD,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = GOLD
              e.currentTarget.style.color = "#0A0A0A"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(197,168,128,0.12)"
              e.currentTarget.style.color = GOLD
            }}
          >
            Book a Viewing
          </a>
        </div>
      </div>
    </header>
  )
}

/* ─── Hero ────────────────────────────────────────────────────────────── */
function Hero({
  heroImage,
  headline,
  headlineAccent,
  subtext,
  suggestions,
  greeting,
  searchAreas,
  searchMaxBudgets,
}: {
  heroImage: string
  headline: string
  headlineAccent: string
  subtext: string
  suggestions: string[]
  greeting: string
  searchAreas: string[]
  searchMaxBudgets: string[]
}) {
  const shouldReduceMotion = useReducedMotion()

  const fadeUp = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: "easeOut" as const, delay },
        }

  return (
    <section className="relative min-h-screen flex flex-col" style={{ background: BG }}>
      {/* BG image with Ken Burns + gradient overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            animation: shouldReduceMotion ? "none" : "kenBurns 18s ease-in-out infinite alternate",
          }}
        >
          {safeImg(heroImage, "Dubai skyline at night", "absolute inset-0 w-full h-full object-cover", false)}
        </div>
        {/* Gradient overlay — heavy left/center for text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.80) 45%, rgba(8,8,8,0.45) 75%, rgba(8,8,8,0.30) 100%)",
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: "linear-gradient(to top, rgba(8,8,8,1) 0%, transparent 100%)" }}
        />
      </div>

      {/* Two-column layout — starts below nav */}
      <div className="relative z-10 flex-1 flex items-center pt-20">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left column */}
            <div className="flex-1 min-w-0 flex flex-col gap-7 lg:max-w-[55%]">
              {/* Eyebrow */}
              <motion.p
                {...fadeUp(0.1)}
                className="text-xs uppercase tracking-[0.25em] font-mono"
                style={{ color: MUTED }}
              >
                Dubai Luxury Real Estate &nbsp;·&nbsp; AI-Powered Search
              </motion.p>

              {/* Headline */}
              <motion.h1
                {...fadeUp(0.22)}
                className="text-4xl sm:text-5xl xl:text-6xl font-light leading-[1.1] tracking-tight"
                style={{ fontFamily: "Playfair Display, serif", color: TEXT }}
              >
                {headline}{" "}
                <em
                  className="not-italic font-semibold"
                  style={{ color: GOLD_ITALIC, fontStyle: "italic" }}
                >
                  {headlineAccent}
                </em>
                <br />
                <span className="text-white/80">Across Dubai</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                {...fadeUp(0.34)}
                className="text-sm sm:text-base leading-relaxed max-w-lg"
                style={{ color: MUTED }}
              >
                {subtext}
              </motion.p>

              {/* Glass Search Bar */}
              <motion.div {...fadeUp(0.46)} className="w-full">
                <GlassSearchBar
                  searchAreas={searchAreas}
                  searchMaxBudgets={searchMaxBudgets}
                />
              </motion.div>
            </div>

            {/* Right column — Hero Chat Card */}
            <div
              className="w-full lg:w-[440px] xl:w-[460px] shrink-0 self-stretch flex flex-col"
              style={{ minHeight: 520 }}
            >
              <HeroChatCard suggestions={suggestions} greeting={greeting} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Stats strip ─────────────────────────────────────────────────────── */
function StatsStrip({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div
      className="relative z-10"
      style={{ background: "#080808", borderBottom: "1px solid rgba(197,168,128,0.10)" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-wrap gap-8 items-center justify-center sm:justify-start">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="text-2xl font-light font-serif"
              style={{ color: GOLD, fontFamily: "Playfair Display, serif" }}
            >
              {s.value}
            </span>
            <span className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>
              {s.label}
            </span>
            {i < stats.length - 1 && (
              <span
                className="hidden sm:block w-px h-6 ml-5"
                style={{ background: "rgba(197,168,128,0.20)" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Listings ─────────────────────────────────────────────────────────── */
function FeaturedListings() {
  return (
    <section id="properties" style={{ background: BG, padding: "80px 0" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.25em] mb-3 font-mono" style={{ color: MUTED }}>
            Sample Listings
          </p>
          <h2
            className="text-3xl sm:text-4xl font-light"
            style={{ fontFamily: "Playfair Display, serif", color: TEXT }}
          >
            Featured <em style={{ color: GOLD_ITALIC, fontStyle: "italic" }}>Residences</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LISTINGS.map((listing, i) => (
            <div
              key={i}
              className="group rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: "#0F0F0F",
                border: "1px solid rgba(197,168,128,0.12)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.40)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(197,168,128,0.30)" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(197,168,128,0.12)" }}
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden" style={{ background: FALLBACK_GRADIENT }}>
                {safeImg(listing.img, listing.alt, "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105")}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 60%)" }}
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" style={{ color: GOLD }} />
                  <span className="text-xs font-medium" style={{ color: TEXT }}>{listing.area}</span>
                </div>
                <div
                  className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-mono"
                  style={{ background: "rgba(8,8,8,0.80)", color: MUTED, border: "1px solid rgba(197,168,128,0.15)" }}
                >
                  Sample listing
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <h3
                    className="text-base font-medium mb-1"
                    style={{ color: TEXT, fontFamily: "Playfair Display, serif" }}
                  >
                    {listing.title}
                  </h3>
                  <p className="text-xs" style={{ color: MUTED }}>
                    {listing.beds} &nbsp;·&nbsp; {listing.sqft}
                  </p>
                </div>
                <div className="mt-auto pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-base font-medium" style={{ color: GOLD }}>{listing.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Gallery strip ──────────────────────────────────────────────────── */
function GalleryStrip() {
  return (
    <section style={{ background: "#060606", padding: "64px 0", borderTop: "1px solid rgba(197,168,128,0.08)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <p className="text-xs uppercase tracking-[0.25em] mb-3 font-mono" style={{ color: MUTED }}>
          Private Residences
        </p>
        <h2
          className="text-2xl sm:text-3xl font-light mb-10"
          style={{ fontFamily: "Playfair Display, serif", color: TEXT }}
        >
          Crafted for <em style={{ color: GOLD_ITALIC, fontStyle: "italic" }}>Distinction</em>
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {[
            { img: "/images/real-estate/interior-1.jpg", alt: "Luxury living room interior", label: "Living" },
            { img: "/images/real-estate/interior-2.jpg", alt: "Refined residence interior", label: "Dining" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex-1 relative rounded-2xl overflow-hidden"
              style={{ height: 260, background: FALLBACK_GRADIENT, border: "1px solid rgba(197,168,128,0.10)" }}
            >
              {safeImg(item.img, item.alt, "w-full h-full object-cover")}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }}
              />
              <div className="absolute bottom-4 left-4">
                <span className="text-sm font-medium" style={{ color: TEXT, fontFamily: "Playfair Display, serif" }}>
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────────────── */
function Footer({
  businessName,
  onBackToHub,
}: {
  businessName: string
  onBackToHub: () => void
}) {
  return (
    <footer
      style={{
        background: "#050505",
        borderTop: "1px solid rgba(197,168,128,0.10)",
        padding: "40px 0",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ color: MUTED, fontSize: 12 }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span>© 2026 {businessName}. Demo application with fictional data.</span>
          <span className="hidden sm:inline" style={{ color: "rgba(197,168,128,0.30)" }}>|</span>
          <span>Powered by NichePilot Conversational Engine</span>
        </div>
        <button
          onClick={onBackToHub}
          className="flex items-center gap-1.5 transition-colors cursor-pointer"
          style={{ color: MUTED }}
          onMouseEnter={(e) => { e.currentTarget.style.color = GOLD }}
          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED }}
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Demo Hub
        </button>
      </div>
    </footer>
  )
}

/* ─── Loading / Error states ─────────────────────────────────────────── */
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD, borderTopColor: "transparent" }} />
        <span className="text-xs uppercase tracking-widest font-mono" style={{ color: MUTED }}>
          Loading Experience…
        </span>
      </div>
    </div>
  )
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center" style={{ background: BG }}>
      <div className="p-4 rounded-full" style={{ background: "rgba(127,29,29,0.25)", border: "1px solid rgba(185,28,28,0.35)" }}>
        <Shield className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-medium" style={{ color: TEXT }}>Vertical Not Found</h2>
      <p className="text-sm max-w-md" style={{ color: MUTED }}>{message}</p>
      <button
        onClick={onBack}
        className="px-4 py-2 rounded-xl text-xs tracking-wider transition-colors cursor-pointer"
        style={{ background: "rgba(255,255,255,0.06)", color: TEXT, border: "1px solid rgba(255,255,255,0.10)" }}
      >
        Return to Demo Hub
      </button>
    </div>
  )
}

/* ─── Main LandingPage ──────────────────────────────────────────────── */
interface LandingPageProps {
  nicheSlug: string
  onBackToHub: () => void
}

export function LandingPage({ nicheSlug, onBackToHub }: LandingPageProps) {
  const [detail, setDetail] = useState<NicheDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const nicheName = nicheSlug.replace(/-/g, "_")

  useEffect(() => {
    setIsLoading(true)
    fetch(`/niche/${nicheName}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load niche '${nicheName}'`)
        return r.json() as Promise<NicheDetail>
      })
      .then((data) => setDetail(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load niche details")
      )
      .finally(() => setIsLoading(false))
  }, [nicheName])

  if (isLoading) return <LoadingState />
  if (error || !detail) return <ErrorState message={error ?? "Unknown error"} onBack={onBackToHub} />

  const { theme, business_name, greeting, suggestions } = detail
  const heroImage = theme.hero_image || ""
  const headline = theme.headline || business_name
  const headlineAccent = theme.headline_accent || ""
  const subtext = theme.subtext || ""
  const navItems = theme.nav || []
  const brandMark = theme.brand_mark || business_name.substring(0, 2).toUpperCase()
  const searchAreas = theme.search_areas || []
  const searchMaxBudgets = theme.search_max_budgets || []
  const stats = theme.stats || [
    { value: "500+", label: "Sample Listings" },
    { value: "12+", label: "Prime Areas" },
    { value: "24/7", label: "AI Concierge" },
  ]

  const isRealEstate = nicheName === "real_estate"

  return (
    <ChatProvider niche={nicheName} greeting={greeting}>
      <div
        className="min-h-screen flex flex-col selection:bg-[#C5A880]/25 selection:text-white"
        style={{ background: BG, color: TEXT, fontFamily: "Geist, sans-serif" }}
      >
        {/* Ken Burns keyframes injected once */}
        <style>{`
          @keyframes kenBurns {
            from { transform: scale(1.00) translate(0,0); }
            to   { transform: scale(1.06) translate(-1%,-1%); }
          }
        `}</style>

        <Nav
          businessName={business_name}
          brandMark={brandMark}
          navItems={navItems}
        />

        {isRealEstate ? (
          <>
            <Hero
              heroImage={heroImage}
              headline={headline}
              headlineAccent={headlineAccent}
              subtext={subtext}
              suggestions={suggestions}
              greeting={greeting}
              searchAreas={searchAreas}
              searchMaxBudgets={searchMaxBudgets}
            />
            <StatsStrip stats={stats} />
            <FeaturedListings />
            <GalleryStrip />
          </>
        ) : (
          /* Generic themed layout for other niches */
          <section className="py-20 px-6 max-w-5xl mx-auto space-y-10">
            <div className="space-y-5 text-center">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: GOLD }}
              >
                {business_name}
              </span>
              <h1
                className="text-4xl sm:text-5xl font-light tracking-tight"
                style={{ fontFamily: theme.fonts.heading, color: TEXT }}
              >
                {headline}
              </h1>
              <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color: MUTED }}>
                {subtext}
              </p>
            </div>
          </section>
        )}

        <div id="contact" />

        <Footer businessName={business_name} onBackToHub={onBackToHub} />

        <FloatingBubble />
      </div>
    </ChatProvider>
  )
}
