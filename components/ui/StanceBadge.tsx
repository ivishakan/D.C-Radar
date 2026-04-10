import type { StanceType } from "@/types";

interface StanceBadgeProps {
  stance: StanceType;
  size?: "sm" | "md";
}

const LABELS: Record<StanceType, string> = {
  restrictive: "Restrictive",
  review: "Under Review",
  favorable: "Favorable",
  concerning: "Favorable / Concerning",
  none: "No Activity",
};

const COLOR_CLASSES: Record<StanceType, string> = {
  restrictive: "bg-stance-restrictive/15 text-stance-restrictive",
  review: "bg-stance-review/15 text-stance-review",
  favorable: "bg-stance-favorable/15 text-stance-favorable",
  concerning: "bg-stance-concerning/15 text-stance-concerning",
  none: "bg-stance-none/30 text-muted",
};

export default function StanceBadge({ stance, size = "md" }: StanceBadgeProps) {
  const sizeClasses =
    size === "md"
      ? "px-2.5 py-1 text-xs rounded-full font-medium"
      : "px-2 py-0.5 text-xs rounded-full";
  return (
    <span className={`${sizeClasses} ${COLOR_CLASSES[stance]} inline-block`}>
      {LABELS[stance]}
    </span>
  );
}
