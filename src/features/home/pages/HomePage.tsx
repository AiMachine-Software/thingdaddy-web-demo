import HeroBanner from '#/components/public/HeroBanner'
import ValuePropsSection from '#/components/public/ValuePropsSection'
import ResearchSection from '#/components/public/ResearchSection'
import StatsSection from '#/components/public/StatsSection'

export default function HomePage() {
  return (
    <main>
      <HeroBanner />
      <ValuePropsSection />
      <ResearchSection />
      <StatsSection />
    </main>
  )
}
