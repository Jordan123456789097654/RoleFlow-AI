import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("ai-output");

export default function Page() {
  return <LegalPage slug="ai-output" />;
}
