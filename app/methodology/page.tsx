import Link from "next/link";
import type { Metadata } from "next";
import NuanceLegend from "@/components/sections/NuanceLegend";

export const metadata: Metadata = {
  title: "Methodology · Track Policy",
};

export default function MethodologyPage() {
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
          Methodology
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold text-ink tracking-tight leading-[1.05] mb-10">
          How I build the data
        </h1>

        <div className="text-base text-ink/80 leading-relaxed space-y-5">
          <p>
            If you read something wrong,{" "}
            <a
              href="mailto:reksopuro.isabelle@gmail.com"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              please let me know
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-ink tracking-tight pt-4">
            Where the bills come from
          </h2>
          <p>
            Every bill comes from an official source. US state bills come
            through{" "}
            <a
              href="https://legiscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              LegiScan
            </a>
            . Federal bills come from congress.gov. EU bills come from
            EUR-Lex, and other jurisdictions use their own government
            sources.
          </p>

          <h2 className="text-xl font-semibold text-ink tracking-tight pt-4">
            How bills get tagged
          </h2>
          <p>
            Each bill gets a set of{" "}
            <strong className="text-ink font-semibold">impact tags</strong>
            . Examples include grid capacity, water consumption, carbon
            emissions, local control, AI safety, and deepfake regulation.
            Tags describe what a bill is about. They don&rsquo;t say
            whether it&rsquo;s good or bad.
          </p>
          <p>
            Tagging is done with Claude Sonnet 4.6. The model reads each
            bill&rsquo;s summary and picks the applicable tags from a
            fixed taxonomy. I spot-check the output but I don&rsquo;t
            hand-review every bill.
          </p>

          <h2 className="text-xl font-semibold text-ink tracking-tight pt-4">
            How stance gets picked
          </h2>
          <p>
            A jurisdiction&rsquo;s{" "}
            <strong className="text-ink font-semibold">stance</strong> can
            be restrictive, concerning, review, favorable, or none. Claude
            Sonnet 4.6 picks it from the direction and weight of each
            jurisdiction&rsquo;s active bills. Enacted bills count more
            than voted, voted more than committee, committee more than
            filed.
          </p>
          <p>
            When a jurisdiction has contradictory bills in flight, it
            gets labeled &ldquo;review&rdquo; instead of one side. When
            there&rsquo;s no policy activity at all, it&rsquo;s
            &ldquo;none,&rdquo; not favorable-by-default.
          </p>
          <p>
            Some of these calls will be wrong, or will age badly as bills
            move. If you work in one of these jurisdictions and think the
            read is off,{" "}
            <Link
              href="/contact"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              please reach out
            </Link>
            .
          </p>

          <h2 className="text-xl font-semibold text-ink tracking-tight pt-4">
            Data centers
          </h2>
          <p>
            The frontier data center layer comes from{" "}
            <a
              href="https://epochai.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-2 hover:text-muted transition-colors"
            >
              Epoch AI
            </a>
            &rsquo;s open dataset (CC-BY). I supplement it with
            hand-researched entries from public reporting for sites
            Epoch doesn&rsquo;t cover yet. Cost and compute figures only
            appear when the operator or a filing has disclosed them. A
            missing number means unknown, not zero.
          </p>
        </div>

        <div className="mt-16 mb-3 text-[13px] font-medium text-muted tracking-tight">
          Impact tags by dimension
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight leading-[1.1] mb-6">
          The full tag taxonomy
        </h2>
        <p className="text-base text-ink/80 leading-relaxed mb-8">
          Tags are grouped into two lenses: Data Centers and AI Regulation.
          Each lens has its own set of dimensions. The map&rsquo;s{" "}
          &ldquo;Color map by&rdquo; toggle uses these groupings to recolor
          jurisdictions by tag density.
        </p>
        <NuanceLegend />
      </div>
    </main>
  );
}
