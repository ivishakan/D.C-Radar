import type { Legislation } from "@/types";
import Card from "@/components/ui/Card";
import StagePill from "@/components/ui/StagePill";

interface LegislationListProps {
  legislation: Legislation[];
}

export default function LegislationList({ legislation }: LegislationListProps) {
  return (
    <div className="flex flex-col gap-2">
      {legislation.map((bill) => (
        <Card key={bill.id}>
          <div className="flex items-center">
            <span className="text-xs text-muted">{bill.billCode}</span>
            <span className="ml-auto">
              <StagePill stage={bill.stage} />
            </span>
          </div>
          <div className="text-sm font-medium mt-0.5 text-ink">{bill.title}</div>
          <p className="text-xs text-muted mt-1 leading-relaxed">{bill.summary}</p>
          {bill.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {bill.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
