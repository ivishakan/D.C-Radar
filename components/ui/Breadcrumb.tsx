"use client";

import { Fragment } from "react";
import type { Layer } from "@/types";

export interface BreadcrumbItem {
  label: string;
  layer: Layer;
  entityName?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (layer: Layer) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <Fragment key={`${item.layer}-${idx}`}>
            {isLast ? (
              <span className="text-ink font-medium text-sm">{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(item.layer)}
                className="text-muted hover:text-ink cursor-pointer text-sm transition-colors"
              >
                {item.label}
              </button>
            )}
            {!isLast && <span className="text-muted mx-2">›</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
