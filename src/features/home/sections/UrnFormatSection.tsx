import { ArrowDown, Copy, Check } from "lucide-react";
import { useState } from "react";

const LAYERS = [
  {
    label: "ThingDaddy URN",
    sublabel: "Platform identifier",
    value: "urn:thingdaddy:acme:consumable:7654",
    color: "text-indigo-700",
  },
  {
    label: "GS1 Element String",
    sublabel: "Application Identifier format",
    value: "(01) 00614141812345 (21) 7654",
    color: "text-amber-700",
  },
  {
    label: "EPC Pure Identity URI",
    sublabel: "As used in EPCIS",
    value: "urn:epc:id:sgtin:0614141.0812345.7654",
    color: "text-blue-700",
  },
  {
    label: "EPC Tag URI",
    sublabel: "As used in RFID middleware",
    value: "urn:epc:tag:sgtin-96:1.0614141.0812345.7654",
    color: "text-cyan-700",
  },
  {
    label: "RFID Tag EPC Memory Bank",
    sublabel: "96-bit binary encoding (hex)",
    value: "3034257BF7194E4000001DE6",
    color: "text-emerald-700",
  },
  {
    label: "GS1 Digital Link URI",
    sublabel: "Scannable web link",
    value: "https://id.gs1.org/01/00614141812345/21/7654",
    color: "text-violet-700",
  },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-gray-400 hover:text-gray-700 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function UrnFormatSection() {
  return (
    <section className="py-16 flex justify-center">
      <div className="max-w-3xl w-full px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            From barcode to RFID — one registration, every format
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Register once, get 6 identifier layers. Each format serves a different system in the supply chain — from ERP to RFID reader to web browser.
          </p>
        </div>

        <div className="space-y-2">
          {LAYERS.map((layer, i) => (
            <div key={layer.label}>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400">{layer.label}</span>
                      <span className="text-[10px] text-gray-600">{layer.sublabel}</span>
                    </div>
                    <p className={`font-mono text-sm break-all ${layer.color}`}>{layer.value}</p>
                  </div>
                  <CopyBtn text={layer.value} />
                </div>
              </div>
              {i < LAYERS.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-3.5 w-3.5 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
