import type { NewsItem } from "@/types";

interface NewsSectionProps {
  news: NewsItem[];
}

export default function NewsSection({ news }: NewsSectionProps) {
  return (
    <div className="flex flex-col">
      {news.map((item) => (
        <div
          key={item.id}
          className="py-2 border-b last:border-0 border-border-soft"
        >
          <a
            href={item.url}
            className="text-sm text-ink hover:underline cursor-pointer block"
          >
            {item.headline}
          </a>
          <div className="text-xs text-muted mt-0.5">
            {item.source} · {item.date}
          </div>
        </div>
      ))}
    </div>
  );
}
