import Link from "next/link";

export const metadata = {
  title: "Law enforcement guide · RoleFlow",
  description: "How law enforcement agencies request information from RoleFlow.",
};

const sectionClass = "space-y-3";
const h2Class = "font-display text-xl text-ink";
const pClass = "text-sm leading-relaxed text-muted";

export default function LawEnforcementGuidePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-5 py-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl text-ink">Law enforcement guide</h1>
        <p className={pClass}>
          This guide explains how government agencies can request information from RoleFlow, what each type of legal
          process is for, and what to expect. It is general information, not legal advice. Consult your own counsel
          about your obligations.
        </p>
        <p className={pClass}>
          To submit a request, use the <Link href="/law-enforcement" className="text-accent underline underline-offset-2">request form</Link>.
          Send signed legal documents to support@roleflow.site and quote your reference number.
        </p>
      </header>

      <section className={sectionClass}>
        <h2 className={h2Class}>1. What RoleFlow is</h2>
        <p className={pClass}>
          RoleFlow is a general-purpose AI assistant platform. Users sign in with an email address and may create chats,
          projects, and API keys. Depending on the feature, account data can include the user&apos;s email, account
          settings, chat history, uploaded files, and moderation records.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={h2Class}>2. Types of legal process</h2>
        <p className={pClass}>RoleFlow responds to valid U.S. legal process. Each type covers different information:</p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li><span className="text-ink">Subpoena.</span> Typically used to request basic subscriber information, such as the account email, registration details, and account creation dates. A subpoena alone generally does not compel content.</li>
          <li><span className="text-ink">Court order.</span> Issued by a court under a standard that may be higher than a subpoena. Specify the records requested and the time period.</li>
          <li><span className="text-ink">Search warrant.</span> Issued by a judge on a showing of probable cause. A warrant is the process generally needed for the content of communications and stored user content, subject to applicable law.</li>
          <li><span className="text-ink">Emergency disclosure request.</span> Available where there is a good-faith belief that an emergency involves a danger of death or serious physical injury. See section 5.</li>
          <li><span className="text-ink">Preservation request.</span> Asks RoleFlow to hold existing records while a legal process is prepared. It does not authorize disclosure.</li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={h2Class}>3. What a valid request includes</h2>
        <p className={pClass}>Every request must include:</p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>The agency name, the requesting officer&apos;s name, and a badge or ID number</li>
          <li>A case number or agency reference</li>
          <li>The account identifier: the RoleFlow account email or user ID</li>
          <li>The signed legal document, sent to support@roleflow.site with the reference number</li>
          <li>A contact email from an official agency address. Personal email providers are not accepted.</li>
          <li>The requesting officer&apos;s certification, confirmed on the request form</li>
        </ul>
        <p className={pClass}>
          Requests missing these items may not be processed. Every request is verified manually by a RoleFlow team member
          before any action is taken.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={h2Class}>4. Preservation</h2>
        <p className={pClass}>
          On receipt of a preservation request, RoleFlow holds the identified records for 90 days from the request date.
          If legal process is not served within that period, the hold ends and the records may be deleted under our
          retention schedule. A preservation request can be extended only by a further request before the hold ends.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={h2Class}>5. Emergency requests</h2>
        <p className={pClass}>
          An emergency disclosure request must state, in writing and signed, the nature of the emergency and why it
          involves a risk of death or serious physical injury. Emergency requests are flagged and reviewed before other
          requests. RoleFlow does not currently operate a telephone line for emergencies, so submit the emergency request
          through the form and email support@roleflow.site with the subject line &quot;EMERGENCY&quot;. Where a situation
          is immediate, contact your local 911 or emergency services first.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={h2Class}>6. Notice to users</h2>
        <p className={pClass}>
          RoleFlow notifies affected users of legal requests for their information unless we are legally prohibited from
          doing so or the circumstances make notice inappropriate. A non-disclosure order should be stated in the request,
          with its legal basis and duration. We will not notify the user while a valid order applies.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={h2Class}>7. Business hours, fees, and reports</h2>
        <p className={pClass}>
          Support is available Monday to Friday, 9:00 AM to 5:00 PM EST. RoleFlow does not currently charge a fee for
          responding to valid requests. RoleFlow does not yet publish a transparency report.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={h2Class}>8. Contact</h2>
        <p className={pClass}>
          Email support@roleflow.site with your reference number. Submit new requests at{" "}
          <Link href="/law-enforcement" className="text-accent underline underline-offset-2">/law-enforcement</Link>.
        </p>
      </section>
    </main>
  );
}
