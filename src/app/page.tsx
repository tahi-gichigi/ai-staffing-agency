"use client";

import { useEffect } from "react";

/* ------------------------------------------------------------------ */
/* Scroll-reveal: adds .visible to .reveal elements when in viewport  */
/* ------------------------------------------------------------------ */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ------------------------------------------------------------------ */
/* Shared section wrapper                                              */
/* ------------------------------------------------------------------ */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`reveal px-6 md:px-12 lg:px-20 py-20 md:py-28 max-w-6xl mx-auto w-full ${className}`}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Label pill used above section headings                              */
/* ------------------------------------------------------------------ */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
      {children}
    </span>
  );
}

/* ================================================================== */
/* PAGE                                                                */
/* ================================================================== */
export default function Home() {
  useScrollReveal();

  return (
    <div className="bg-paper font-sans text-ink">
      {/* ---------------------------------------------------------- */}
      {/* NAV                                                         */}
      {/* ---------------------------------------------------------- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur-md border-b border-divider">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 h-14 flex items-center justify-between">
          <span className="font-serif text-xl tracking-tight">
            AI Staffing Agency
          </span>
          <a
            href="#contact"
            className="hidden sm:inline-flex items-center h-9 px-5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            Get in touch
          </a>
        </div>
      </nav>

      {/* ---------------------------------------------------------- */}
      {/* HERO                                                        */}
      {/* ---------------------------------------------------------- */}
      <header className="pt-32 pb-20 md:pt-44 md:pb-28 px-6 md:px-12 lg:px-20 max-w-6xl mx-auto">
        <div className="animate-fade-up">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-accent mb-6">
            A new kind of hire
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight max-w-4xl mb-8">
            We don&rsquo;t sell AI&nbsp;tools.{" "}
            <em className="text-accent">We staff&nbsp;AI.</em>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl leading-relaxed mb-10">
            Digital employees for accounting, legal, and property management
            firms. Not another dashboard you have to learn. A new team member
            that handles the work your juniors do today - faster, cheaper, and
            without the admin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#contact"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-accent text-white font-medium hover:bg-accent-dark transition-colors text-base"
            >
              Let&rsquo;s talk
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-divider text-ink font-medium hover:border-ink transition-colors text-base"
            >
              How it works
            </a>
          </div>
        </div>
      </header>

      <hr className="editorial-rule max-w-6xl mx-auto" />

      {/* ---------------------------------------------------------- */}
      {/* THE PROBLEM                                                  */}
      {/* ---------------------------------------------------------- */}
      <Section id="problem">
        <Label>The problem</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-8">
          Your tools find the gaps.{" "}
          <em className="text-muted-light">Nobody closes them.</em>
        </h2>
        <div className="grid md:grid-cols-2 gap-10 mt-10">
          <div className="space-y-5 text-muted leading-relaxed">
            <p>
              You already have Dext, Hubdoc, maybe AutoEntry. They capture
              receipts, extract data, push it to Xero. The structured part is
              handled.
            </p>
            <p>
              But your firm still hires juniors at 22-28k a year. Why? Because
              someone has to chase the missing receipt. Someone has to figure out
              that &ldquo;AMZN*2847XJ&rdquo; on the bank statement is actually
              an Amazon Web Services charge. Someone has to send the WhatsApp,
              wait a week, send another one.
            </p>
          </div>
          <div className="space-y-5 text-muted leading-relaxed">
            <p>
              The tools handle the clean, structured work. The messy,
              unstructured work - the chasing, the judgement calls, the context
              switching between 15 different clients - that still falls on
              people.
            </p>
            <p className="text-ink font-medium">
              That gap between &ldquo;tool found a problem&rdquo; and
              &ldquo;problem actually resolved&rdquo; is where most of the cost
              sits. We close it.
            </p>
          </div>
        </div>
      </Section>

      <hr className="editorial-rule max-w-6xl mx-auto" />

      {/* ---------------------------------------------------------- */}
      {/* OUR APPROACH                                                 */}
      {/* ---------------------------------------------------------- */}
      <Section id="approach">
        <Label>Our approach</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-6">
          A role, not a tool.
        </h2>
        <p className="text-lg text-muted max-w-2xl leading-relaxed mb-12">
          We frame AI as an employee, not a product. An &ldquo;AI
          Bookkeeper&rdquo; beats &ldquo;invoice chatbot&rdquo; because your
          clients already know what a bookkeeper does. The question shifts from
          &ldquo;what does this software do?&rdquo; to &ldquo;how much cheaper
          is this than a person?&rdquo;
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              number: "01",
              title: "Closing, not finding",
              body: "Most tools detect gaps. Our AI closes them - drafting the follow-up, sending the reminder, processing the reply.",
            },
            {
              number: "02",
              title: "Dialogue over dashboards",
              body: "Works where your team already works: email, WhatsApp, spreadsheets. No new login, no new interface to learn.",
            },
            {
              number: "03",
              title: "Bespoke to the mess",
              body: "Tuned to industry-specific edge cases. Construction site receipts. Vendor naming quirks. Multi-invoice payments. The real stuff.",
            },
          ].map((item) => (
            <div
              key={item.number}
              className="bg-card-bg rounded-2xl p-8 border border-divider/60"
            >
              <span className="text-sm font-semibold text-accent mb-3 block">
                {item.number}
              </span>
              <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <hr className="editorial-rule max-w-6xl mx-auto" />

      {/* ---------------------------------------------------------- */}
      {/* ROLE CATALOGUE                                               */}
      {/* ---------------------------------------------------------- */}
      <Section id="roles">
        <Label>Role catalogue</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-12">
          Three roles. Three industries.
        </h2>

        <div className="space-y-8">
          {/* AI Bookkeeper */}
          <div className="bg-card-bg rounded-2xl border border-divider/60 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-accent-light flex items-center justify-center text-2xl">
                💼
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h3 className="font-semibold text-xl">AI Bookkeeper</h3>
                  <span className="text-xs font-semibold tracking-wider uppercase text-accent bg-accent-light px-3 py-1 rounded-full w-fit">
                    First role - available now
                  </span>
                </div>
                <p className="text-sm text-muted mb-5">
                  For accounting firms in Belfast and Lisbon
                </p>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    "Reconciles bank statements against invoices",
                    "Detects gaps - charges with no matching receipt",
                    "Chases missing documents via WhatsApp and email",
                    "Handles messy data: multi-invoice payments, vendor naming quirks",
                    "Flags duplicates, anomalies, and patterns",
                    "Produces clean reconciliation reports",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-accent mt-0.5 flex-shrink-0">
                        &#10003;
                      </span>
                      <span className="text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Paralegal */}
          <div className="bg-card-bg rounded-2xl border border-divider/60 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-accent-light flex items-center justify-center text-2xl">
                &#x2696;&#xFE0F;
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-1">AI Paralegal</h3>
                <p className="text-sm text-muted mb-5">
                  For law firms in Belfast and Lisbon
                </p>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    "Filters and triages intake documents",
                    "Extracts dates, parties, and clauses from messy uploads",
                    "Summarises 20-page PDFs into structured 5-point briefs",
                    "Converts unstructured documents to usable spreadsheets",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-accent mt-0.5 flex-shrink-0">
                        &#10003;
                      </span>
                      <span className="text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Leasing Agent */}
          <div className="bg-card-bg rounded-2xl border border-divider/60 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-accent-light flex items-center justify-center text-2xl">
                🏠
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-1">
                  AI Leasing Agent
                </h3>
                <p className="text-sm text-muted mb-5">
                  For property management firms in Lisbon
                </p>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    "Qualifies leads in any language - first 5 rounds of FAQs handled",
                    "Schedules viewings with calendar integration",
                    "Responds instantly to every inquiry, any time zone",
                    "Eliminates lead leakage from slow manual follow-up",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-accent mt-0.5 flex-shrink-0">
                        &#10003;
                      </span>
                      <span className="text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <hr className="editorial-rule max-w-6xl mx-auto" />

      {/* ---------------------------------------------------------- */}
      {/* HOW IT WORKS                                                 */}
      {/* ---------------------------------------------------------- */}
      <Section id="how-it-works">
        <Label>How it works</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-6">
          The probation model.
        </h2>
        <p className="text-lg text-muted max-w-2xl leading-relaxed mb-14">
          We know this sounds unusual. So we make it zero risk. Your AI employee
          starts on probation - just like any new hire.
        </p>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              step: "1",
              title: "Shadow",
              body: 'The AI runs alongside your existing team. It observes everything and produces a weekly "what I would have done" report. Zero client exposure.',
            },
            {
              step: "2",
              title: "Compare",
              body: "Your accountant compares the AI output against what the junior actually did. Accuracy, speed, gaps caught. Hard numbers.",
            },
            {
              step: "3",
              title: "Promote",
              body: "If the AI earns trust over 4-8 weeks, it graduates from observer to active team member. Starts handling real work.",
            },
            {
              step: "4",
              title: "Scale",
              body: "One role proven, we add more. AI Bookkeeper today, AI Credit Controller next month. Build a full digital back office.",
            },
          ].map((item) => (
            <div key={item.step} className="relative">
              <span className="font-serif text-6xl text-accent/20 absolute -top-4 -left-1 select-none">
                {item.step}
              </span>
              <div className="pt-12">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 bg-accent-light rounded-2xl p-8 md:p-10 border border-accent/10">
          <p className="font-serif text-xl md:text-2xl text-ink leading-snug max-w-2xl">
            &ldquo;Let us shadow your junior for a month. Compare our output. If
            we&rsquo;re not better, you&rsquo;ve lost nothing.&rdquo;
          </p>
        </div>
      </Section>

      <hr className="editorial-rule max-w-6xl mx-auto" />

      {/* ---------------------------------------------------------- */}
      {/* WHY NOT JUST USE [TOOL]                                      */}
      {/* ---------------------------------------------------------- */}
      <Section id="differentiators">
        <Label>Why not just use Dext?</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-12">
          Tools find the gap.{" "}
          <em className="text-accent">We close it.</em>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[540px]">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-4 pr-6 font-semibold w-1/3">
                  &nbsp;
                </th>
                <th className="text-left py-4 px-4 font-semibold text-muted">
                  Dext / Hubdoc / AutoEntry
                </th>
                <th className="text-left py-4 px-4 font-semibold text-accent">
                  AI Staffing Agency
                </th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {[
                [
                  "Missing document chase",
                  "Flags it. You write the email.",
                  "Drafts, sends, follows up, closes.",
                ],
                [
                  "Ambiguous matches",
                  "Matched or unmatched. No middle ground.",
                  "Uses context to make judgement calls, like a junior would.",
                ],
                [
                  "Messy data",
                  "Works with clean, standard documents.",
                  "Handles construction receipts, photos, multi-format statements.",
                ],
                [
                  "Proactive patterns",
                  'Doesn\'t surface "VAT deadline in 3 weeks, client hasn\'t submitted".',
                  "Spots trends, flags risks, anticipates deadlines.",
                ],
                [
                  "Where it works",
                  "Inside its own dashboard.",
                  "Email, WhatsApp, spreadsheets - wherever you already are.",
                ],
              ].map((row, i) => (
                <tr key={i} className="border-b border-divider">
                  <td className="py-4 pr-6 font-medium text-ink">{row[0]}</td>
                  <td className="py-4 px-4">{row[1]}</td>
                  <td className="py-4 px-4 text-ink font-medium">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <hr className="editorial-rule max-w-6xl mx-auto" />

      {/* ---------------------------------------------------------- */}
      {/* CTA                                                          */}
      {/* ---------------------------------------------------------- */}
      <Section id="contact" className="text-center">
        <Label>Get started</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-2xl mx-auto mb-6">
          Ready to meet your first AI&nbsp;employee?
        </h2>
        <p className="text-lg text-muted max-w-xl mx-auto leading-relaxed mb-10">
          No commitment. No setup fee during probation. We shadow your junior,
          prove the value, and you decide.
        </p>
        <a
          href="mailto:tahi@mooch.work?subject=AI%20Staffing%20Agency%20-%20Let%27s%20talk"
          className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-accent text-white font-medium text-lg hover:bg-accent-dark transition-colors"
        >
          Let&rsquo;s talk
        </a>
        <p className="text-sm text-muted-light mt-6">
          Or email us directly at{" "}
          <a
            href="mailto:tahi@mooch.work"
            className="text-accent underline underline-offset-2"
          >
            tahi@mooch.work
          </a>
        </p>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* FOOTER                                                       */}
      {/* ---------------------------------------------------------- */}
      <footer className="border-t border-divider py-10 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <span className="font-serif text-base text-ink">
            AI Staffing Agency
          </span>
          <span>&copy; {new Date().getFullYear()} Mooch. Belfast &amp; Lisbon.</span>
        </div>
      </footer>
    </div>
  );
}
