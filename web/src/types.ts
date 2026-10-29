export interface NicheListItem {
  name: string
  tagline: string
  status: "ready" | "coming_soon"
}

export interface ThemeColors {
  primary: string
  background: string
  card: string
  text: string
  accent: string
}

export interface ThemeFonts {
  heading: string
  body: string
}

export interface NavItem {
  label: string
  href: string
}

export interface ThemeStat {
  value: string
  label: string
}

export interface ThemeConfig {
  colors: ThemeColors
  fonts: ThemeFonts
  hero_image: string
  headline: string
  headline_accent?: string
  subtext: string
  nav: NavItem[]
  brand_mark: string
  search_areas?: string[]
  search_max_budgets?: string[]
  stats?: ThemeStat[]
  whatsapp_number?: string
  whatsapp_prefill?: string
}

export interface NicheDetail {
  business_name: string
  tagline: string
  greeting: string
  suggestions: string[]
  theme: ThemeConfig
}
