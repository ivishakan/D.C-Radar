"use client";

import { useState } from "react";
import type { Legislation } from "@/types";
import BillTimeline from "@/components/ui/BillTimeline";
import BillExpanded from "./BillExpanded";

interface LegislationListProps {
  legislation: Legislation[];
  /** Two-letter state code ("US", "VA", ...) for donor lookup. */
  stateCode?: string;
}

export default function LegislationList({
  legislation,
  stateCode,
}: LegislationListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {legislation.map((bill) => {
        const isOpen = openId === bill.id;
        return (
          <button
            key={bill.id}
            type="button"
            onClick={() => setOpenId(isOpen ? null : bill.id)}
            className={`w-full text-left rounded-2xl p-4 transition-colors ${
              isOpen ? "bg-bg" : "bg-bg/60 hover:bg-bg"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted">{bill.billCode}</div>
                <div className="text-sm font-medium mt-1 text-ink tracking-tight">
                  {bill.title}
                </div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`flex-shrink-0 mt-1.5 text-muted transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                <path
                  d="M3 4.5l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              {bill.summary}
            </p>
            <BillTimeline stage={bill.stage} />

            {/* Smooth expand — grid-template-rows 0fr → 1fr trick */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                {isOpen && (
                  <BillExpanded bill={bill} stateCode={stateCode} />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
