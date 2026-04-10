import type { Legislator } from "@/types";
import StanceBadge from "@/components/ui/StanceBadge";

interface KeyFiguresProps {
  figures: Legislator[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export default function KeyFigures({ figures }: KeyFiguresProps) {
  return (
    <div className="flex flex-col">
      {figures.map((figure) => (
        <div
          key={figure.id}
          className="flex items-start gap-3 py-2 border-b last:border-0 border-border-soft"
        >
          <div className="w-8 h-8 rounded-full bg-stone-100 flex-shrink-0 flex items-center justify-center text-xs font-medium text-stone-500">
            {getInitials(figure.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink">{figure.name}</div>
            <div className="text-xs text-muted">
              {figure.role} · {figure.party}
            </div>
            <div className="mt-1">
              <StanceBadge stance={figure.stance} size="sm" />
            </div>
            {figure.quote && (
              <p className="text-xs italic text-muted mt-1 border-l-2 border-border-soft pl-2">
                {figure.quote}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
