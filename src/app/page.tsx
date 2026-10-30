import Calculator from './calculator';

export default function Home() {
  return (
    <main className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Pocket arithmetic</p>
        <h1>Everyday calculator</h1>
        <p className="intro-copy">A clear little tool for everyday math.</p>
      </header>

      <Calculator />

      <p className="keyboard-hint">
        <span>Keyboard ready</span>
        <span>0–9 · + - * / % · Enter · Backspace · Esc</span>
      </p>
    </main>
  );
}
