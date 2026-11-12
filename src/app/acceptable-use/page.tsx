import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("acceptable-use");

export default function Page() {
  return <LegalPage slug="acceptable-use" />;
}
