export default function Header() {
  return (
    <header className="h-14 bg-bg border-b border-border-soft px-6 flex items-center justify-between">
      <div className="text-base font-semibold text-ink">AI Policy Tracker</div>
      <nav className="flex items-center gap-6 text-sm text-muted">
        <span>Map</span>
        <span>Legislators</span>
        <span>About</span>
      </nav>
    </header>
  );
}
