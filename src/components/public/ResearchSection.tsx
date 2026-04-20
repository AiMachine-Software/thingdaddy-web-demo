import { ExternalLink, BookOpen } from 'lucide-react'
import { Button } from '#/components/ui/button'

const ROWS = [
  {
    name: 'oneM2M',
    ids: 'APP-ID, M2M-Node-ID, CSE-ID, AE-ID',
    schemes: 'OID, IMEI or any',
  },
  {
    name: 'GS1',
    ids: 'All GS1 EPC Identifiers',
    schemes: 'EPC',
  },
  {
    name: 'OCF',
    ids: 'Device ID (di)',
    schemes: 'UUID (any form)',
  },
  {
    name: 'FIWARE',
    ids: 'Entity ID, Entity Type, Attr Name/Type',
    schemes: 'UUID URN',
  },
]

export default function ResearchSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Paper info */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              Academic Foundation
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Built on Research
            </h2>
            <p className="mt-6 text-lg font-semibold text-gray-800 italic">
              "Analysis of Identifiers in IoT Platforms"
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Haris Aftab, Komal Gilani, JiEun Lee, Lewis Nkenyereye, SeungMyeong
              Jeong, JaeSeung Song
            </p>
            <p className="mt-1 text-sm text-gray-500">
              <em>Digital Communications and Networks</em>, Vol. 6, 2020, pp.
              333–340
            </p>
            <p className="mt-6 text-gray-700 leading-relaxed">
              The paper reviews identification schemes (OID, EPC, UUID) used
              across IoT platforms (oneM2M, GS1, OCF, FIWARE) and highlights the
              need for a universal identification mechanism — which is exactly
              what ThingDaddy provides.
            </p>
            <Button
              asChild
              className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <a
                href="https://doi.org/10.1016/j.dcan.2019.05.003"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Paper
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>

          {/* Right: Comparison table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">
                Identifiers across IoT Platforms (Table 3)
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 bg-gray-50/50">
                  <th className="px-4 py-3 font-semibold">Platform</th>
                  <th className="px-4 py-3 font-semibold">Identifiers</th>
                  <th className="px-4 py-3 font-semibold">Scheme</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.name} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.ids}</td>
                    <td className="px-4 py-3 text-gray-600">{r.schemes}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-indigo-200 bg-indigo-50">
                  <td className="px-4 py-3 font-bold text-indigo-900">
                    ThingDaddy
                  </td>
                  <td className="px-4 py-3 font-semibold text-indigo-900">
                    All of the above + custom
                  </td>
                  <td className="px-4 py-3 font-semibold text-indigo-900">
                    GS1 EPC + UUID
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
