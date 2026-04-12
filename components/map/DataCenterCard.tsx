"use client";

import type { DataCenter } from "@/types";
import { DC_COLOR } from "./DataCenterDots";

interface DataCenterCardProps {
  facility: DataCenter;
  x: number;
  y: number;
  /** If > 1, this card is showing the largest facility in a cluster. */
  clusterSize?: number;
}

function formatMW(mw: number | undefined): string | null {
  if (!mw) return null;
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${Math.round(mw)} MW`;
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
 * Minimal Apple-style hover card. Just the name, one meta line, and a
 * cluster hint. Anything deeper lives in the pinned side panel — this is
 * the glance view.
 */
export default function DataCenterCard({
  facility,
  x,
  y,
  clusterSize = 1,
}: DataCenterCardProps) {
  const operator = stripConfidence(facility.operator) ?? facility.operator;
  const capacity = formatMW(facility.capacityMW);
  const color = DC_COLOR[facility.status];
  const isProposed = facility.status === "proposed";
  const isCluster = clusterSize > 1;

  // Keep the card on-screen — flip sides near the viewport edges.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const cardWidth = 240;
  const flipRight = x > vw - cardWidth - 24;
  const flipDown = y > vh - 120;
  const left = flipRight ? x - cardWidth - 16 : x + 16;
  const top = flipDown ? y - 100 : y + 16;

  const meta = [STATUS_LABEL[facility.status], capacity]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left,
        top,
        width: cardWidth,
        fontFamily:
          "-apple-system, 'SF Pro Text', system-ui, sans-serif",
      }}
      aria-hidden
    >
      <div
        className="rounded-xl bg-white/94 backdrop-blur-2xl border border-black/[.04] px-3.5 py-3"
        style={{
          boxShadow:
            "0 10px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-start gap-2">
          <span
            className="mt-[5px] inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: isProposed ? "transparent" : color,
              border: isProposed ? `1.25px solid ${color}` : "none",
            }}
          />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-ink tracking-tight truncate leading-tight">
              {operator}
            </div>
            <div className="text-[11px] text-muted truncate mt-0.5">
              {meta}
            </div>
            {isCluster && (
              <div className="text-[10px] text-muted mt-1.5">
                + {clusterSize - 1} more nearby
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
