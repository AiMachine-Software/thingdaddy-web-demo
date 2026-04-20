import { Beaker } from 'lucide-react'
import SimulationPanel from '../components/SimulationPanel'

export default function SimulatorPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight inline-flex items-center gap-2">
          <Beaker className="text-amber-500" /> Rule Simulator
        </h1>
        <p className="text-gray-500 mt-2">
          Fire mock device events and see which rules match — no real broker required.
        </p>
      </div>
      <SimulationPanel />
    </main>
  )
}
