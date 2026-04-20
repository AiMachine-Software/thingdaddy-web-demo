import { Workflow, Barcode } from "lucide-react";
import { steps } from "../config/process";
import { identifiers } from "../config/gs1-identify";
import { Timeline } from "#/components/ui/timeline";

export default function RegistrationSection() {
  return (
    <section className="py-16 flex justify-center">
      <div className="max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full mb-4">
            <Workflow className="w-4 h-4" />
            How It Works
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Register a thing in 3 simple steps
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Choose your asset type, fill in the details, and get a complete GS1-compliant
            identifier chain — from element string to RFID hex — generated instantly.
          </p>
        </div>

        <div className="w-full mb-10 -mx-4 md:mx-0">
          <Timeline
            data={steps.map((item) => {
              const Icon = item.icon;
              return {
                title: `Step ${item.step}`,
                content: (
                  <div className="mb-12">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-sm ${item.color}`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-base text-gray-500 leading-relaxed max-w-2xl">{item.description}</p>
                  </div>
                )
              };
            })}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Barcode className="w-5 h-5 text-emerald-600" />
            Supported GS1 EPC Schemes
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Full binary encoding with GS1 TDS partition tables, check-digit validation, and SGTIN-96/198 support.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {identifiers.map((gs1) => (
              <div key={gs1.key} className={`p-4 rounded-xl border ${gs1.color}`}>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${gs1.badge} mb-2`}
                >
                  {gs1.key}
                </span>
                <p className="text-sm font-medium text-gray-900">{gs1.name}</p>
                <p className="text-xs text-gray-500 mb-2">{gs1.desc}</p>
                <code className="text-xs text-gray-400 font-mono">{gs1.example}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
