import {
  Globe,
  Tag,
  Search,
  QrCode,
  ArrowLeftRight,
  FileSpreadsheet,
} from "lucide-react";
import type { Feature } from "../interfaces/feature.interface";

export const features: Feature[] = [
  {
    icon: Globe,
    title: "Universal Thing Registry",
    description:
      "Register any physical or digital asset with a globally unique ThingDaddy URN. Support for 4 asset types: Consumable, Work in Progress, Fixed Asset, and Human Resource.",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: Tag,
    title: "Full GS1 EPC Stack",
    description:
      "Generate GS1 Element Strings, EPC Pure Identity URIs, EPC Tag URIs, and RFID binary encoding — all following the official TDS specification with proper partition tables.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Search,
    title: "Resolver & Hex Decoder",
    description:
      "Look up any thing by ThingDaddy URN, GS1 ID, or EPC URI. Paste a raw RFID hex string to decode it back into all identifier layers instantly.",
    color: "text-amber-600 bg-amber-50",
  },
  {
    icon: QrCode,
    title: "QR Code & Digital Link",
    description:
      "Auto-generate QR codes from GS1 Digital Link URIs. Download as PNG or print labels directly from the browser.",
    color: "text-rose-600 bg-rose-50",
  },
  {
    icon: ArrowLeftRight,
    title: "Ownership Transfers",
    description:
      "Transfer thing ownership between organizations with full audit trail. Initiate, accept, or reject transfers with complete history tracking.",
    color: "text-sky-600 bg-sky-50",
  },
  {
    icon: FileSpreadsheet,
    title: "Batch Import",
    description:
      "Import thousands of things at once from CSV files. Auto-validate, map columns, and generate all GS1 identifiers in bulk.",
    color: "text-purple-600 bg-purple-50",
  },
];
