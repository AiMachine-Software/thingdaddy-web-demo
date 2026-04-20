import { LayoutGrid, TextCursorInput, Layers } from "lucide-react";
import type { ProcessStep } from "../interfaces/process.interface";

export const steps: ProcessStep[] = [
  {
    icon: LayoutGrid,
    title: "Choose Asset Type",
    description:
      "Select from 4 categories: Consumable (SGTIN), Work in Progress (CPI), Fixed Asset (GIAI), or Human Resource (GSRN). Each type maps to a specific GS1 EPC scheme.",
    color: "text-emerald-600 bg-emerald-50",
    step: "1",
  },
  {
    icon: TextCursorInput,
    title: "Fill in the Details",
    description:
      "Pick your organization from 100+ company prefixes across 15+ countries, enter the type-specific fields (item reference, serial number, etc.), and watch the URN preview update in real-time.",
    color: "text-teal-600 bg-teal-50",
    step: "2",
  },
  {
    icon: Layers,
    title: "Get Your Identifier Chain",
    description:
      "Instantly receive 6 identifier layers: GS1 Element String, EPC Pure Identity URI, EPC Tag URI, RFID Tag Hex, GS1 Digital Link URI, and a scannable QR code.",
    color: "text-indigo-600 bg-indigo-50",
    step: "3",
  },
];
