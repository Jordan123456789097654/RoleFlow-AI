import type { LawRequestType } from "@/types";

/**
 * Request types offered on /law-enforcement and shown in the admin queue.
 * Client-safe: this module imports types only, so both pages and server code can use it.
 */
export const LAW_REQUEST_TYPES: { id: LawRequestType; label: string }[] = [
  { id: "subpoena", label: "Subpoena" },
  { id: "court_order", label: "Court order" },
  { id: "search_warrant", label: "Search warrant" },
  { id: "emergency_disclosure", label: "Emergency disclosure request" },
  { id: "preservation", label: "Preservation request" },
];
