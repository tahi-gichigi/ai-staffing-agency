"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Scroll-reveal observer: adds .visible to .reveal elements           */
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
      { threshold: 0.08 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ------------------------------------------------------------------ */
/* Nav scroll detection                                                */
/* ------------------------------------------------------------------ */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/* ------------------------------------------------------------------ */
/* Section wrapper with reveal animation                               */
/* ------------------------------------------------------------------ */
function Section({
  children,
  className = "",
  id,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  wide?: boolean;
}) {
  return (
    <section
      id={id}
      className={`reveal px-6 md:px-12 lg:px-20 py-20 md:py-28 ${
        wide ? "max-w-7xl" : "max-w-6xl"
      } mx-auto w-full ${className}`}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Label: small uppercase marker above section headings                */
/* ------------------------------------------------------------------ */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-5">
      <span className="w-6 h-px bg-accent inline-block" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Checkmark icon                                                      */
/* ------------------------------------------------------------------ */
function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="text-accent flex-shrink-0 mt-0.5"
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================== */
/* PAGE                                                                */
/* ================================================================== */
export default function Home() {
  useScrollReveal();
  const scrolled = useScrolled();

  return (
    <div className="bg-paper font-sans text-ink selection:bg-accent/10 selection:text-accent-dark">
      {/* ---------------------------------------------------------- */}
      {/* NAV                                                         */}
      {/* ---------------------------------------------------------- */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "nav-scrolled backdrop-blur-md border-b border-divider"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between">
          <span className="font-serif text-xl tracking-tight">
            AI Staffing Agency
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#how-it-works"
              className="hidden md:inline text-sm text-muted hover:text-ink transition-colors accent-link"
            >
              How it works
            </a>
            <a
              href="#roles"
              className="hidden md:inline text-sm text-muted hover:text-ink transition-colors accent-link"
            >
              Roles
            </a>
            <a
              href="#contact"
              className="inline-flex items-center h-9 px-5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition-colors"
            >
              Get in touch
            </a>
          </div>
        </div>
      </nav>

      {/* ---------------------------------------------------------- */}
      {/* HERO                                                        */}
      {/* ---------------------------------------------------------- */}
      <header className="relative pt-36 pb-24 md:pt-48 md:pb-32 px-6 md:px-12 lg:px-20 max-w-6xl mx-auto overflow-hidden">
        {/* Decorative accent line running down the left */}
        <div className="absolute left-6 md:left-12 lg:left-20 top-28 md:top-40 w-px h-24 bg-gradient-to-b from-accent to-transparent animate-fade-in delay-500 opacity-0" />

        <div className="animate-fade-up opacity-0">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-accent mb-8 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            A new kind of hire
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] tracking-tight max-w-5xl mb-8">
            Your next hire isn&rsquo;t&nbsp;human.
            <br />
            <em className="text-accent">And that&rsquo;s a&nbsp;good&nbsp;thing.</em>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl leading-relaxed mb-12">
            We place AI employees in accounting, legal, and property management
            firms. They reconcile bank statements, chase missing receipts,
            handle ledger data entry, and triage intake documents - at a
            fraction of the cost, without NI, pension, or sick days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#contact"
              className="cta-btn inline-flex items-center justify-center h-13 px-9 rounded-full bg-accent text-white font-medium hover:bg-accent-dark transition-colors text-base"
            >
              Start a conversation
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center h-13 px-9 rounded-full border border-divider text-ink font-medium hover:border-ink transition-colors text-base group"
            >
              How it works
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="ml-2 transition-transform group-hover:translate-y-0.5"
              >
                <path
                  d="M8 3v10M4 9l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-6">
          Your tools are smart.{" "}
          <span className="text-muted-light">The follow-up still isn&rsquo;t.</span>
        </h2>
        <p className="text-muted text-lg max-w-2xl leading-relaxed mb-12">
          Dext captures the receipt. Xero posts the entry. But between
          &ldquo;flagged&rdquo; and &ldquo;resolved&rdquo;, there&rsquo;s
          still a person writing emails, chasing clients, and making
          judgement calls.
        </p>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          <div className="space-y-6 text-muted leading-relaxed">
            <p>
              Someone has to figure out that &ldquo;AMZN*2847XJ&rdquo; is
              actually Amazon Web Services. Someone has to send the WhatsApp,
              wait a week, follow up, wait again. Someone has to remember
              that Client B always pays 3 invoices in 1 transfer.
            </p>
            <p>
              That in-between work - the chasing, the matching, the context
              switching across 15 sets of client quirks - is where your
              junior&rsquo;s week actually goes. And at 22-28k a year,
              it&rsquo;s expensive for what it is.
            </p>
          </div>
          <div className="relative">
            {/* Stylised stat callout */}
            <div className="bg-card-bg rounded-2xl border border-divider/60 p-8 md:p-10">
              <p className="font-serif text-4xl md:text-5xl text-accent mb-3 leading-none">
                30+ hrs
              </p>
              <p className="text-sm text-muted leading-relaxed max-w-xs">
                per month spent chasing documents, matching transactions, and
                following up with clients who haven&rsquo;t replied.
              </p>
              <div className="mt-6 pt-6 border-t border-divider">
                <p className="text-ink font-medium text-sm">
                  That&rsquo;s 30 hours your senior staff aren&rsquo;t
                  spending on advisory work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <hr className="editorial-rule max-w-6xl mx-auto" />

      {/* ---------------------------------------------------------- */}
      {/* OUR APPROACH                                                 */}
      {/* ---------------------------------------------------------- */}
      <Section id="approach">
        <Label>What you get</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-6">
          Not software. A&nbsp;team&nbsp;member.
        </h2>
        <p className="text-lg text-muted max-w-2xl leading-relaxed mb-14">
          You don&rsquo;t need another dashboard. You need someone to do the
          work your junior does - chase the receipt, match the transaction,
          send the follow-up - without the salary, the training, or the
          turnover.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              number: "01",
              title: "Does the work, not just the flagging",
              body: "Your tools spot the missing receipt. Your AI employee chases it - drafts the message, sends it, processes the reply when it arrives.",
            },
            {
              number: "02",
              title: "Sits inside your workflow",
              body: "Email, WhatsApp, spreadsheets. No new dashboard to check. No new login to remember. They work where your team already works.",
            },
            {
              number: "03",
              title: "Learns your clients' quirks",
              body: "Construction site receipts. Vendors with confusing names. One payment covering 3 invoices. We train your AI employee on the messy reality of your specific firm.",
            },
          ].map((item) => (
            <div
              key={item.number}
              className="stagger-child opacity-0 bg-card-bg rounded-2xl p-8 border border-divider/60 hover:border-accent/20 transition-colors"
            >
              <span className="font-serif text-sm text-accent mb-4 block">
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
        <Label>Who we place</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-4">
          Trained for your industry.{" "}
          <span className="text-muted-light">Ready to start.</span>
        </h2>
        <p className="text-muted text-lg max-w-2xl leading-relaxed mb-12">
          Each AI employee is scoped to a specific role in a specific type of
          firm - the same way you&rsquo;d write a job description before
          hiring.
        </p>

        <div className="space-y-6">
          {/* AI Bookkeeper */}
          <div className="role-card bg-card-bg rounded-2xl border border-divider/60 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-accent text-white flex items-center justify-center font-serif text-xl">
                B
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h3 className="font-semibold text-xl">AI Bookkeeper</h3>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-accent bg-accent-light px-3 py-1 rounded-full w-fit">
                    Available now
                  </span>
                </div>
                <p className="text-sm text-muted mb-6">
                  Replaces your junior bookkeeper. For accounting firms in Belfast and Lisbon.
                </p>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    "Matches bank statements against invoices automatically",
                    "Spots missing receipts and chases them via WhatsApp and email",
                    "Handles the messy stuff: partial payments, vendor name mismatches",
                    "Catches duplicates and anomalies before they become problems",
                    "Delivers clean reconciliation reports, ready for your review",
                    "Works across all your clients without context-switching fatigue",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check />
                      <span className="text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Paralegal */}
          <div className="role-card bg-card-bg rounded-2xl border border-divider/60 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-ink text-paper flex items-center justify-center font-serif text-xl">
                P
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-1">AI Paralegal</h3>
                <p className="text-sm text-muted mb-6">
                  Frees up your partner time. For law firms in Belfast and Lisbon.
                </p>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    "Triages new intake so your partners only see what matters",
                    "Pulls dates, parties, and key clauses from messy client uploads",
                    "Turns 20-page PDFs into structured 5-point briefs",
                    "Converts unstructured documents into clean, usable spreadsheets",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check />
                      <span className="text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Leasing Agent */}
          <div className="role-card bg-card-bg rounded-2xl border border-divider/60 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-paper-warm text-ink flex items-center justify-center font-serif text-xl">
                L
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-1">
                  AI Leasing Agent
                </h3>
                <p className="text-sm text-muted mb-6">
                  Stops leads slipping through the cracks. For property management in Lisbon.
                </p>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    "Answers every enquiry instantly, in any language, any time zone",
                    "Handles the first 5 rounds of FAQs before your team gets involved",
                    "Books viewings directly into your calendar",
                    "No more lost leads because someone was too slow to reply",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check />
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
          Probation first. Commitment later.
        </h2>
        <p className="text-lg text-muted max-w-2xl leading-relaxed mb-16">
          Your AI employee starts the same way any new hire would - on
          probation. They shadow your team, you review their output, and
          you only promote them to live work once you&rsquo;re satisfied.
        </p>

        <div className="grid md:grid-cols-4 gap-8 md:gap-6">
          {[
            {
              step: "1",
              title: "Shadow",
              body: "Your AI employee works alongside your team for the first few weeks. They process everything your junior does and produce a weekly report. No client exposure yet.",
            },
            {
              step: "2",
              title: "Compare",
              body: "You compare their output against your team's. What they caught, what they missed, how long it took. Real numbers from your real data.",
            },
            {
              step: "3",
              title: "Promote",
              body: "Once you trust the output - usually 4 to 8 weeks - your AI employee moves from observer to active team member handling real work.",
            },
            {
              step: "4",
              title: "Scale",
              body: "One role proven, you add more. Start with an AI Bookkeeper, bring on an AI Credit Controller next quarter. Build out your back office without building out your headcount.",
            },
          ].map((item) => (
            <div key={item.step} className="step-card relative stagger-child opacity-0">
              <span className="step-number font-serif text-7xl text-accent/15 absolute -top-5 -left-1 select-none pointer-events-none">
                {item.step}
              </span>
              <div className="pt-14">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quote block */}
        <div className="mt-16 quote-block">
          <p className="font-serif text-xl md:text-2xl text-ink leading-snug max-w-2xl">
            &ldquo;Let us shadow your junior for a month. Compare our work
            against theirs. If we&rsquo;re not better, you&rsquo;ve lost
            nothing.&rdquo;
          </p>
        </div>
      </Section>

      <hr className="editorial-rule max-w-6xl mx-auto" />

      {/* ---------------------------------------------------------- */}
      {/* WHY NOT JUST USE [TOOL]                                      */}
      {/* ---------------------------------------------------------- */}
      <Section id="differentiators">
        <Label>Already using Dext?</Label>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight max-w-3xl mb-4">
          Good. Keep it.{" "}
          <em className="text-accent">We pick up where it stops.</em>
        </h2>
        <p className="text-muted text-lg max-w-2xl leading-relaxed mb-12">
          Capture tools handle the structured part. Your AI employee handles
          everything after - the chasing, the matching, the judgement calls
          your tools can&rsquo;t make.
        </p>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-4 pr-6 font-semibold w-[30%]">
                  &nbsp;
                </th>
                <th className="text-left py-4 px-4 font-semibold text-muted-light">
                  Your current tools
                </th>
                <th className="text-left py-4 px-4 font-semibold text-accent">
                  Your AI employee
                </th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {[
                [
                  "Missing receipt",
                  "Flags it. You still write the email.",
                  "Drafts the chase, sends it, processes the reply.",
                ],
                [
                  "Confusing match",
                  "Matched or unmatched. No middle ground.",
                  "Uses context to make the call, like a good junior.",
                ],
                [
                  "Messy documents",
                  "Needs clean, standard formats.",
                  "Handles crumpled receipts, photos, odd layouts.",
                ],
                [
                  "Upcoming deadlines",
                  "No alerts. You track them yourself.",
                  "Spots patterns, flags risks, reminds you before it's late.",
                ],
                [
                  "Where you use it",
                  "Inside its own dashboard.",
                  "Email, WhatsApp, spreadsheets. Wherever you already work.",
                ],
              ].map((row, i) => (
                <tr key={i} className="comparison-row border-b border-divider">
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
          See it work on your&nbsp;data.
        </h2>
        <p className="text-lg text-muted max-w-xl mx-auto leading-relaxed mb-10">
          No commitment. No setup fee during probation. Your AI employee
          shadows your team on real work, and you decide whether to hire
          them.
        </p>
        <a
          href="mailto:tahi@mooch.work?subject=AI%20Staffing%20Agency%20-%20Let%27s%20talk"
          className="cta-btn inline-flex items-center justify-center h-14 px-10 rounded-full bg-accent text-white font-medium text-lg hover:bg-accent-dark transition-colors"
        >
          Start a conversation
        </a>
        <p className="text-sm text-muted-light mt-6">
          Or email us directly at{" "}
          <a
            href="mailto:tahi@mooch.work"
            className="text-accent accent-link"
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
          <span>
            &copy; {new Date().getFullYear()} Mooch. Belfast &amp; Lisbon.
          </span>
        </div>
      </footer>
    </div>
  );
}
