import { listCapabilities } from './capabilities'
import { runAutoNegotiation, type Negotiation } from './negotiationEngine'
import { createContract, type Contract } from './contracts'
import { transfer } from './deviceWallet'
import { createRating } from './thingRating'
import { pushNotification } from './rulesEngine'

export interface DemoDayStep {
  label: string
  detail: string
  emoji: string
  /** Optional side-effect run when this step is "played" */
  run?: () => void
}

export interface DemoDayResult {
  steps: DemoDayStep[]
  negotiation1?: Negotiation
  contract1?: Contract
  contract2?: Contract
}

const MILESIGHT_ORG_ID = 'org_00000006-0000-0000-0000-000000000006'

/**
 * Builds (and eagerly executes some setup) the full demo scenario.
 * Each step's `run` is idempotent-ish — the caller (DemoDayRunner) fires them
 * sequentially with ~500 ms spacing so the UI animates.
 */
export function buildDemoDay(): DemoDayResult {
  const result: DemoDayResult = { steps: [] }

  // Find capabilities we'll use
  const allOffers = listCapabilities({ orgId: MILESIGHT_ORG_ID, direction: 'offer' })
  const tempCap = allOffers.find((c) => c.name === 'Temperature Data' && c.thingId === 'ast_ms_05')
  const solarCap = allOffers.find((c) => c.name === 'Solar Energy Surplus' && c.thingId === 'ast_ms_39')

  result.steps.push({
    emoji: '🧠',
    label: 'GW-001 detects a need',
    detail: 'Gateway UG65 needs live temperature readings for its edge ML model.',
  })
  result.steps.push({
    emoji: '🔍',
    label: 'Query marketplace',
    detail: 'UG65 scans the Thing marketplace for temperature data sellers.',
  })
  result.steps.push({
    emoji: '🎯',
    label: 'Match found: VS-121 @ 5 TC',
    detail: 'VS121 offers Temperature Data at 5 TC / 1000 readings.',
  })

  result.steps.push({
    emoji: '🤝',
    label: 'Auto-negotiation begins',
    detail: 'Balanced strategies on both sides. UG65 budget: 4 TC.',
    run: () => {
      if (!tempCap) return
      const neg = runAutoNegotiation({
        orgId: MILESIGHT_ORG_ID,
        buyerThingId: 'ast_ms_37',
        sellerThingId: 'ast_ms_05',
        capabilityId: tempCap.id,
        buyerBudget: 4,
        sellerMinAccept: 3.5,
        buyerStrategy: 'balanced',
        sellerStrategy: 'balanced',
        maxRounds: 5,
        contractDuration: '7 days',
        persist: true,
      })
      result.negotiation1 = neg
      if (neg.contractId) {
        // Contract created by runAutoNegotiation already
      }
    },
  })
  result.steps.push({
    emoji: '✅',
    label: 'Deal reached',
    detail: '3 rounds of negotiation settle at ~3.5 TC / 1000 readings.',
  })
  result.steps.push({
    emoji: '📄',
    label: 'Contract created',
    detail: 'Smart contract C-demo-1 links VS121 → UG65 for 7 days.',
  })
  result.steps.push({
    emoji: '💸',
    label: 'Wallet transfer',
    detail: 'VS121 wallet +3.5 TC, UG65 wallet -3.5 TC.',
  })

  result.steps.push({
    emoji: '☀️',
    label: 'SOLAR-001 surplus detected',
    detail: 'SG50 solar gateway has 3.5 kWh available until sunset.',
  })
  result.steps.push({
    emoji: '⚡',
    label: 'CT-001 needs power',
    detail: 'UC300 controller detects low battery and queries the marketplace.',
  })
  result.steps.push({
    emoji: '🔒',
    label: 'Fixed-price deal @ 2 TC / kWh',
    detail: 'No negotiation rounds — instant accept.',
    run: () => {
      if (!solarCap) return
      const contract = createContract({
        orgId: MILESIGHT_ORG_ID,
        buyerThingId: 'ast_ms_40',
        sellerThingId: 'ast_ms_39',
        capabilityId: solarCap.id,
        capabilityName: solarCap.name,
        capabilityIcon: solarCap.icon,
        agreedPrice: 2,
        unit: 'kWh',
        durationLabel: 'until sunset',
        deliveredUnits: 3.5,
        costAccrued: 7,
      })
      result.contract2 = contract
      transfer({
        fromThingId: 'ast_ms_40',
        toThingId: 'ast_ms_39',
        amount: 7,
        type: 'energy_trade',
        description: 'Solar surplus 3.5 kWh @ 2 TC/kWh',
        contractId: contract.id,
      })
    },
  })
  result.steps.push({
    emoji: '⭐',
    label: 'Ratings posted',
    detail: 'Both parties auto-rate each other 5 stars after delivery.',
    run: () => {
      if (result.contract2) {
        createRating({
          contractId: result.contract2.id,
          raterThingId: 'ast_ms_40',
          ratedThingId: 'ast_ms_39',
          rating: 5,
          comment: 'Clean energy, on time',
        })
      }
    },
  })
  result.steps.push({
    emoji: '📊',
    label: 'Economy dashboard updated',
    detail: 'All balances, contracts, and stats refreshed.',
    run: () => {
      pushNotification({
        orgId: MILESIGHT_ORG_ID,
        message: '🎬 Machine Economy demo completed — 2 new contracts created',
        severity: 'info',
      })
    },
  })

  return result
}
