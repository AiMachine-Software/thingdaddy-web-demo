import { SearchBar } from "#/components/SearchBar";
import { Box, Search, PlusCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

export default function HeroSection() {
  return (
    <section className="min-h-[calc(100vh-64px)] flex justify-center items-center">
      <div className="relative w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full mb-6">
          <Box className="w-4 h-4" />
          Demo — Try it live
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
          Every Thing deserves
          <br />
          <span className="bg-linear-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">
            an identity
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          ThingDaddy is a universal thing registry — register physical and digital assets
          with standards-compliant URNs, generate GS1 EPC identifiers, encode RFID tags,
          and resolve metadata instantly. All client-side, no backend required.
        </p>

        <SearchBar variant="hero" />

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
          <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
            <Link to="/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              Register a Thing
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 rounded-xl bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 border-2">
            <Link to="/search-assets">
              <Search className="mr-2 h-5 w-5" />
              Resolve a URN
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
