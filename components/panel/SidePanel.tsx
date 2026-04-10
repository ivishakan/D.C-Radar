"use client";

import type { Entity, GovLevel } from "@/types";
import StanceBadge from "@/components/ui/StanceBadge";
import ContextBlurb from "./ContextBlurb";
import LegislationList from "./LegislationList";
import KeyFigures from "./KeyFigures";
import NewsSection from "./NewsSection";

interface SidePanelProps {
  entity: Entity | null;
  onViewStates: () => void;
}

const LEVEL_LABEL: Record<GovLevel, string> = {
  federal: "Federal Government",
  state: "State Government",
  bloc: "Regional Bloc",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
      {children}
    </h3>
  );
}

export default function SidePanel({ entity, onViewStates }: SidePanelProps) {
  if (!entity) {
    return (
      <aside className="w-80 h-full bg-card border-r border-border-soft overflow-y-auto flex items-center justify-center">
        <p className="text-sm text-muted text-center px-6">
          Select a country or region to explore legislation
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full bg-card border-r border-border-soft overflow-y-auto">
      <div className="p-4 border-b border-border-soft">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-semibold text-ink">{entity.name}</h2>
          <StanceBadge stance={entity.stance} size="sm" />
        </div>
        <div className="text-xs text-muted mt-1">{LEVEL_LABEL[entity.level]}</div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <ContextBlurb text={entity.contextBlurb} />

        {entity.canDrillDown && (
          <button
            type="button"
            onClick={onViewStates}
            className="w-full border border-border-soft rounded-lg py-2 text-sm text-ink hover:bg-stone-50 transition-colors"
          >
            View State Legislation →
          </button>
        )}

        {entity.legislation.length > 0 && (
          <section>
            <SectionHeading>Legislation</SectionHeading>
            <LegislationList legislation={entity.legislation} />
          </section>
        )}

        {entity.keyFigures.length > 0 && (
          <section>
            <SectionHeading>Key Figures</SectionHeading>
            <KeyFigures figures={entity.keyFigures} />
          </section>
        )}

        {entity.news.length > 0 && (
          <section>
            <SectionHeading>News</SectionHeading>
            <NewsSection news={entity.news} />
          </section>
        )}
      </div>
    </aside>
  );
}
