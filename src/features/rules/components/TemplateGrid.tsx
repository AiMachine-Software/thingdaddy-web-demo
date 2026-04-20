import { RULE_TEMPLATES } from '#/lib/rulesEngine'
import type { CreateRuleInput } from '#/lib/rulesEngine'

interface Props {
  onPick: (template: Omit<CreateRuleInput, 'orgId'>) => void
  onSkip: () => void
}

export default function TemplateGrid({ onPick, onSkip }: Props) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Start from a template</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Pick a pre-built rule or start from scratch.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {RULE_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onPick(tpl.rule)}
            className="text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition"
          >
            <div className="text-2xl mb-2">{tpl.emoji}</div>
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">{tpl.title}</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">{tpl.description}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        Or start from scratch →
      </button>
    </div>
  )
}
