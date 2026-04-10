interface ContextBlurbProps {
  text: string;
}

export default function ContextBlurb({ text }: ContextBlurbProps) {
  return <p className="text-sm text-stone-600 leading-relaxed">{text}</p>;
}
