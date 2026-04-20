const STATS = [
  { value: '2M+', label: 'Companies Globally Using GS1' },
  { value: '12+', label: 'Thing Types Supported (SGTIN, CPI, GIAI, GSRN, …)' },
  { value: '96-bit & 198-bit', label: 'Binary Encoding Standards' },
]

export default function StatsSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-indigo-50/50 to-white border-y border-indigo-100/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl sm:text-5xl font-bold text-indigo-700">
                {s.value}
              </div>
              <p className="mt-2 text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
