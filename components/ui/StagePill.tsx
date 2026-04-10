import type { Stage } from "@/types";

interface StagePillProps {
  stage: Stage;
}

const STAGE_CLASSES: Record<Stage, string> = {
  Filed: "bg-stone-100 text-stone-500",
  Committee: "bg-amber-50 text-amber-600 border border-amber-200",
  Floor: "bg-orange-50 text-orange-500 border border-orange-200",
  Enacted: "bg-green-50 text-green-700 border border-green-200",
  "Carried Over": "bg-stone-100 text-stone-400 italic",
  Dead: "bg-red-50 text-red-300 line-through",
};

export default function StagePill({ stage }: StagePillProps) {
  return (
    <span
      className={`rounded-full text-xs font-medium px-2.5 py-0.5 ${STAGE_CLASSES[stage]}`}
    >
      {stage}
    </span>
  );
}
