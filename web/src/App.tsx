import { useEffect, useState } from "react"
import { DemoHub } from "./pages/DemoHub"
import { LandingPage } from "./pages/LandingPage"

export function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path)
    setCurrentPath(path)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Route resolution:
  // "/" -> DemoHub
  // "/<slug>" (e.g. "/real-estate") -> LandingPage
  const normalizedPath = currentPath.replace(/^\/+|\/+$/g, "")

  if (!normalizedPath) {
    return <DemoHub onSelectNiche={(slug) => navigateTo(`/${slug}`)} />
  }

  return (
    <LandingPage
      nicheSlug={normalizedPath}
      onBackToHub={() => navigateTo("/")}
    />
  )
}

export default App
