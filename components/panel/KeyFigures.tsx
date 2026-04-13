"use client";

import { useState } from "react";
import { STANCE_LABEL, type Legislation, type Legislator } from "@/types";
import StanceBadge from "@/components/ui/StanceBadge";

interface KeyFiguresProps {
  figures: Legislator[];
  /** Bill list from the parent entity — used to surface bills the figure
   *  has sponsored inside the expanded card. Optional; nothing renders
   *  when omitted. */
  legislation?: Legislation[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

// Loose name match: a sponsor string from a bill matches a figure if the
// figure's last name appears in the sponsor (case-insensitive). Bills
// often list sponsors as "Sen. Padilla" / "Rep. Schiff (D-CA)" rather
// than the figure's exact display name, so we anchor on the last name
// and require ≥3 chars to avoid false positives.
function sponsorMatches(figure: Legislator, sponsor: string): boolean {
  const parts = figure.name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  if (last.length < 3) return false;
  return sponsor.toLowerCase().includes(last.toLowerCase());
}

function findSponsoredBills(
  figure: Legislator,
  legislation: Legislation[],
): Legislation[] {
  return legislation.filter((bill) =>
    bill.sponsors?.some((s) => sponsorMatches(figure, s)),
  );
}

export default function KeyFigures({ figures, legislation }: KeyFiguresProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      {figures.map((figure) => {
        const isOpen = openId === figure.id;
        const sponsored = legislation ? findSponsoredBills(figure, legislation) : [];

        return (
          <div key={figure.id} className="flex flex-col">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : figure.id)}
              aria-expanded={isOpen}
              aria-controls={`figure-card-${figure.id}`}
              className={`flex items-start gap-3 -mx-2 px-2 py-2 rounded-xl text-left transition-colors ${
                isOpen ? "bg-bg/70" : "hover:bg-bg/60"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-black/[.04] flex-shrink-0 flex items-center justify-center text-xs font-medium text-muted">
                {getInitials(figure.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink tracking-tight">
                  {figure.name}
                </div>
                <div className="text-xs text-muted">
                  {figure.role} · {figure.party}
                </div>
                <div className="mt-1.5">
                  <StanceBadge stance={figure.stance} size="sm" />
                </div>
              </div>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden
                className={`mt-3 text-muted/60 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M2.5 4L5 6.5L7.5 4"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isOpen && (
              <div
                id={`figure-card-${figure.id}`}
                className="-mx-2 mt-1 mb-2 px-3 py-3 rounded-xl bg-white border border-black/[.05] shadow-[0_4px_16px_rgba(0,0,0,0.04)] animate-fade-rise"
              >
                <div className="text-[11px] font-medium text-muted tracking-tight mb-1">
                  Position
                </div>
                <div className="text-sm text-ink leading-snug">
                  {STANCE_LABEL[figure.stance]} on AI &amp; data center policy.
                </div>

                {figure.quote && (
                  <>
                    <div className="text-[11px] font-medium text-muted tracking-tight mt-3 mb-1">
                      In their words
                    </div>
                    <p className="text-sm italic text-ink/80 leading-snug">
                      &ldquo;{figure.quote}&rdquo;
                    </p>
                  </>
                )}

                {sponsored.length > 0 && (
                  <>
                    <div className="text-[11px] font-medium text-muted tracking-tight mt-3 mb-1.5">
                      Sponsored bills
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {sponsored.map((bill) => {
                        const inner = (
                          <>
                            <span className="font-medium text-ink shrink-0">
                              {bill.billCode}
                            </span>
                            <span className="text-muted truncate">
                              {bill.title}
                            </span>
                          </>
                        );
                        return (
                          <li key={bill.id} className="flex items-baseline gap-2 text-xs">
                            {bill.sourceUrl ? (
                              <a
                                href={bill.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-baseline gap-2 min-w-0 hover:text-ink"
                              >
                                {inner}
                              </a>
                            ) : (
                              <span className="flex items-baseline gap-2 min-w-0">
                                {inner}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {!figure.quote && sponsored.length === 0 && (
                  <p className="text-xs text-muted mt-2">
                    No sponsored bills on file in the current scope.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
