import { features } from "../config/features"
import { GlowingEffect } from "#/components/ui/glowing-effect"

export default function FeatureSection() {
  return (
    <section className="py-16 flex justify-center">
      <div className="max-w-7xl">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Built for the Internet of Things
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              A complete client-side GS1 encoding stack with SGTIN-96/198 binary encoding, 100+ company prefixes from 15+ countries, and full RFID tag generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="relative h-full bg-white rounded-2xl border border-gray-100 p-6 md:p-8 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <GlowingEffect
                    spread={60}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                  />
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
      </div>
    </section>
  )
}
