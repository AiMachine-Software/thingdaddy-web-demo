import { Globe, Link2, Repeat } from 'lucide-react'
import { Card } from '#/components/ui/card'

const PROPS = [
  {
    icon: Link2,
    title: 'Universal IoT ID',
    desc: 'GS1-compatible EPC URIs for any physical or digital asset',
  },
  {
    icon: Repeat,
    title: 'Ownership & Lifecycle',
    desc: 'Transfer, track and manage your Things across organizations',
  },
  {
    icon: Globe,
    title: 'Resolution API',
    desc: 'Resolve any Thing ID to its digital twin data via standard APIs',
  },
]

export default function ValuePropsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
            Everything Your Things Need
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            One platform for identification, resolution, and lifecycle
            management of every connected asset.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROPS.map(({ icon: Icon, title, desc }) => (
            <Card
              key={title}
              variant="outline"
              className="hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
