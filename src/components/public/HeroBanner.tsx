import { Link, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '#/components/ui/button'

export default function HeroBanner() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate({ to: '/search', search: { q } as any })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0f0f23] via-indigo-950 to-purple-900 text-white">
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="hero-particle"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 6) * 0.8}s`,
              animationDuration: `${8 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-32 text-center">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          The Universal ID for Every Thing
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-indigo-100/90 max-w-2xl mx-auto">
          Register, manage and resolve IoT identifiers instantly — powered by GS1
          standards
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 mx-auto max-w-2xl flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-2xl shadow-indigo-900/40 focus-within:border-indigo-300 focus-within:shadow-indigo-500/30 transition-all"
        >
          <div className="flex-1 flex items-center gap-2 px-4">
            <Search className="w-5 h-5 text-indigo-200 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a Thing ID or Company Prefix (e.g. 6922927)"
              className="w-full bg-transparent text-white placeholder:text-indigo-200/70 py-3 focus:outline-none"
            />
          </div>
          <Button
            type="submit"
            className="h-12 px-8 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/50"
          >
            Search
          </Button>
        </form>

        <div className="mt-8">
          <Button
            asChild
            className="h-12 px-8 bg-white text-indigo-900 hover:bg-indigo-50 font-semibold rounded-xl shadow-lg"
          >
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </div>

      {/* SVG wave bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full text-white"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,64 C240,128 480,0 720,32 C960,64 1200,128 1440,80 L1440,120 L0,120 Z"
        />
      </svg>
    </section>
  )
}
