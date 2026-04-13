"use client";

import { useState } from "react";
import type { DataCenter, ImpactTag } from "@/types";
import { IMPACT_TAG_LABEL } from "@/types";
import { DC_COLOR } from "@/components/map/DataCenterDots";

interface FacilityDetailProps {
  facility: DataCenter;
}

function formatMW(mw: number | undefined): string | null {
  if (!mw) return null;
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${Math.round(mw)} MW`;
}

function formatH100e(n: number | undefined): string | null {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M H100e`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k H100e`;
  return `${Math.round(n)} H100e`;
}

function formatCost(n: number | undefined): string | null {
  if (!n) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n}`;
}

function stripConfidence(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return s.replace(/\s*#\w+/g, "").trim();
}

const STATUS_LABEL: Record<DataCenter["status"], string> = {
  operational: "Operational",
  "under-construction": "Under construction",
  proposed: "Proposed",
};

/**
 * Pinned facility detail shown inside the side panel. Intentionally
 * minimal — matches the entity panel's rhythm (header + blurb + simple
 * definition list) instead of the busy pill-heavy treatment it had
 * before.
 */
function prettyConcern(tag: string): string {
  return (
    IMPACT_TAG_LABEL[tag as ImpactTag] ??
    tag
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export default function FacilityDetail({
  facility,
}: FacilityDetailProps) {
  const [issuesOpen, setIssuesOpen] = useState(true);
  const operator = stripConfidence(facility.operator) ?? facility.operator;
  const user = stripConfidence(facility.primaryUser);
  const capacity = formatMW(facility.capacityMW);
  const compute = formatH100e(facility.computeH100e);
  const cost = formatCost(facility.costUSD);
  const color = DC_COLOR[facility.status];
  const isProposed = facility.status === "proposed";
  const showUser = !!user;

  const details: Array<{ label: string; value: string }> = [];
  if (showUser) details.push({ label: "Primary user", value: user! });
  if (capacity) details.push({ label: "Capacity", value: capacity });
  if (compute) details.push({ label: "Compute", value: compute });
  if (cost) details.push({ label: "Invested", value: cost });
  if (facility.yearBuilt)
    details.push({ label: "Built", value: String(facility.yearBuilt) });
  else if (facility.yearProposed)
    details.push({ label: "Proposed", value: String(facility.yearProposed) });
  details.push({ label: "Location", value: facility.location });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header — mirrors the entity panel (h2 + small status line) */}
      <div className="px-6 pt-1 pb-5 border-b border-black/[.06]">
        <h2 className="text-2xl font-semibold text-ink tracking-tight leading-[1.1]">
          {operator}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: isProposed ? "transparent" : color,
              border: isProposed ? `1.25px solid ${color}` : "none",
            }}
          />
          <span>{STATUS_LABEL[facility.status]}</span>
          {capacity && (
            <>
              <span aria-hidden>·</span>
              <span>{capacity}</span>
            </>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Notes paragraph — equivalent of ContextBlurb for facilities */}
        {facility.notes && (
          <p className="text-sm text-muted leading-relaxed">
            {facility.notes}
          </p>
        )}

        {/* Simple definition list — no pills, no cards, just key/value */}
        {details.length > 0 && (
          <dl className="flex flex-col">
            {details.map((d, i) => (
              <div
                key={d.label}
                className={`flex items-start justify-between gap-4 py-2.5 text-[13px] ${
                  i === 0 ? "" : "border-t border-black/[.04]"
                }`}
              >
                <dt className="text-muted flex-shrink-0">{d.label}</dt>
                <dd className="text-ink font-medium text-right tracking-tight">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Issues dropdown — collapsible list of concern tags */}
        {facility.concerns && facility.concerns.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setIssuesOpen((o) => !o)}
              aria-expanded={issuesOpen}
              className="w-full flex items-center justify-between py-2 text-[13px] font-medium text-ink hover:text-ink/70 transition-colors"
            >
              <span>
                Issues{" "}
                <span className="text-muted font-normal">
                  ({facility.concerns.length})
                </span>
              </span>
              <span
                aria-hidden
                className="text-muted text-[11px] transition-transform"
                style={{
                  transform: issuesOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                ▾
              </span>
            </button>
            {issuesOpen && (
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {facility.concerns.map((c) => (
                  <li
                    key={c}
                    className="text-[11.5px] px-2 py-1 rounded-full bg-black/[.04] text-ink/80 tracking-tight"
                  >
                    {prettyConcern(c)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Source attribution — single muted line, not a badge */}
        <p className="text-[11px] text-muted/80">
          {facility.source === "epoch-ai"
            ? "Data from Epoch AI (CC-BY)"
            : "Sourced from public reporting"}
        </p>
      </div>
    </div>
  );
}
