import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · D.C Radar",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-8 py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-16"
        >
          ← Back
        </Link>

        <div className="text-[13px] font-medium text-muted tracking-tight mb-3">
          About
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold text-ink tracking-tight leading-[1.05] mb-10">
          What this is
        </h1>

        <div className="text-base text-ink/80 leading-relaxed space-y-5">
          <p>
            D.C Radar is a live map of the policy landscape around data center
            development — across the US (federal and every state), the EU and
            major member states, and key Asia-Pacific jurisdictions.
          </p>
          <p>
            The goal is simple: make it easy to see, at a glance, which
            governments are restricting data center growth, which are courting
            it, which are still studying it, and which are doing nothing. Click
            into any jurisdiction to read the bills currently moving, the
            politicians driving them, and the latest news.
          </p>
          <p>
            Policy is the part of this that gets the least attention. Most of
            the conversation around AI is about chips and models. But where
            compute gets built, how much it costs the grid, and what
            governments will allow is being decided right now in state
            capitols and agency filings. This is that map.
          </p>
          <p>
            Every country, US state, and bloc on the site has a stance and a
            set of impact tags based on the bills currently moving through it.
            Click a region to see its legislation, who&rsquo;s sponsoring
            what, recent news, and the data centers already on the ground.
          </p>

          <div className="pt-5 mt-5 border-t border-black/[.06]">
            <p className="text-muted">
              Built by Vishakan Umapathy. The repo is public at{" "}
              <a
                href="https://github.com/ivishakan/D.C-Radar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                github.com/ivishakan/D.C-Radar
              </a>
              .
            </p>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-black/[.06]">
          <div className="text-[13px] font-medium text-muted tracking-tight mb-4">
            Credits
          </div>
          <ul className="text-sm text-ink/80 leading-relaxed space-y-2">
            <li>
              Frontier data center data from{" "}
              <a
                href="https://epoch.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                Epoch AI
              </a>{" "}
              (CC-BY)
            </li>
            <li>
              Legislation data from{" "}
              <a
                href="https://legiscan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                LegiScan
              </a>
            </li>
            <li className="pt-2 text-muted">
              Full data sources are listed on the{" "}
              <Link
                href="/methodology"
                className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
              >
                methodology
              </Link>{" "}
              page.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
