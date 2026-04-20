import { useMemo, useState } from 'react'
import { FileSignature } from 'lucide-react'
import { getCurrentOrgId } from '#/lib/tenant'
import {
  listContracts,
  pauseContract,
  resumeContract,
  terminateContract,
} from '#/lib/contracts'
import ContractCard from '../components/ContractCard'

export default function ContractsPage() {
  const orgId = getCurrentOrgId()
  const [tick, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)

  const contracts = useMemo(() => (orgId ? listContracts(orgId) : []), [orgId, tick])

  if (!orgId) return <div className="p-6 text-sm text-gray-500">Please log in.</div>

  const active = contracts.filter((c) => c.status === 'active')
  const paused = contracts.filter((c) => c.status === 'paused')
  const ended = contracts.filter((c) => c.status === 'terminated' || c.status === 'completed')

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <FileSignature className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Contracts</h1>
          <p className="text-sm text-gray-500">
            Ongoing service agreements resulting from successful negotiations.
          </p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="text-sm text-gray-400 py-16 text-center border border-dashed border-gray-200 rounded-2xl">
          No contracts yet. Try Buy Now or Negotiate from the marketplace.
        </div>
      ) : (
        <>
          <Section title={`Active (${active.length})`}>
            <Grid>
              {active.map((c) => (
                <ContractCard
                  key={c.id}
                  contract={c}
                  onPause={(id) => {
                    pauseContract(id)
                    refresh()
                  }}
                  onTerminate={(id) => {
                    terminateContract(id)
                    refresh()
                  }}
                />
              ))}
            </Grid>
          </Section>
          {paused.length > 0 && (
            <Section title={`Paused (${paused.length})`}>
              <Grid>
                {paused.map((c) => (
                  <ContractCard
                    key={c.id}
                    contract={c}
                    onResume={(id) => {
                      resumeContract(id)
                      refresh()
                    }}
                    onTerminate={(id) => {
                      terminateContract(id)
                      refresh()
                    }}
                  />
                ))}
              </Grid>
            </Section>
          )}
          {ended.length > 0 && (
            <Section title={`Ended (${ended.length})`}>
              <Grid>
                {ended.map((c) => (
                  <ContractCard key={c.id} contract={c} />
                ))}
              </Grid>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
        {title}
      </div>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}
