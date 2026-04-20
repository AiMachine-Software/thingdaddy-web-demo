import type { GS1Identifier } from "../interfaces/gs1-identify.interface";

export const identifiers: GS1Identifier[] = [
  {
    key: "SGTIN",
    name: "Serialized Global Trade Item Number",
    desc: "Consumable / finished goods",
    example: "urn:epc:id:sgtin:0614141.812345.6789",
    color: "border-emerald-200 bg-emerald-50",
    badge: "text-emerald-700 bg-emerald-100",
  },
  {
    key: "CPI",
    name: "Component / Part Identifier",
    desc: "Work in progress items",
    example: "urn:epc:id:cpi:0614141.999.12345",
    color: "border-teal-200 bg-teal-50",
    badge: "text-teal-700 bg-teal-100",
  },
  {
    key: "GIAI",
    name: "Global Individual Asset Identifier",
    desc: "Fixed assets & equipment",
    example: "urn:epc:id:giai:0614141.32a",
    color: "border-sky-200 bg-sky-50",
    badge: "text-sky-700 bg-sky-100",
  },
  {
    key: "GSRN",
    name: "Global Service Relation Number",
    desc: "Human resource identifiers",
    example: "urn:epc:id:gsrn:0614141.1234567890",
    color: "border-indigo-200 bg-indigo-50",
    badge: "text-indigo-700 bg-indigo-100",
  },
];
