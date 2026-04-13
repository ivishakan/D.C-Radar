"use client";

import { useState } from "react";
import type { NewsItem } from "@/types";

interface NewsSectionProps {
  news: NewsItem[];
}

function NewsCard({ item }: { item: NewsItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-black/[.06] bg-black/[.02]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3.5 py-3 flex items-start gap-2"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink tracking-tight leading-snug">
            {item.headline}
          </div>
          <div className="text-xs text-muted mt-1">
            {item.source} · {item.date}
          </div>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`mt-1 flex-shrink-0 text-muted/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4.5 L6 7.5 L9 4.5" />
        </svg>
      </button>

      {open && (
        <div className="px-3.5 pb-3 pt-0">
          {item.summary && (
            <p className="text-xs text-muted leading-relaxed mb-2">
              {item.summary}
            </p>
          )}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted/70 hover:text-muted transition-colors"
          >
            Read more →
          </a>
        </div>
      )}
    </div>
  );
}

export default function NewsSection({ news }: NewsSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      {news.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
