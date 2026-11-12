import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("cookies");

export default function Page() {
  return <LegalPage slug="cookies" />;
}
