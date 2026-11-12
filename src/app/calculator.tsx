'use client';

import { useRef, useState, type FormEvent } from 'react';

type FieldName = 'first' | 'second';
type FieldErrors = Partial<Record<FieldName, string>>;

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 15,
});

export default function Calculator() {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const secondInputRef = useRef<HTMLInputElement>(null);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    const firstNumber = Number(first);
    const secondNumber = Number(second);

    if (!first.trim() || !Number.isFinite(firstNumber)) {
      nextErrors.first = 'Enter a valid first number.';
    }

    if (!second.trim() || !Number.isFinite(secondNumber)) {
      nextErrors.second = 'Enter a valid second number.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setResult(null);
      if (nextErrors.first) {
        firstInputRef.current?.focus();
      } else {
        secondInputRef.current?.focus();
      }
      return;
    }

    setResult(firstNumber + secondNumber);
  }

  function handleClear() {
    setFirst('');
    setSecond('');
    setResult(null);
    setErrors({});
    firstInputRef.current?.focus();
  }

  function updateField(field: FieldName, value: string) {
    if (field === 'first') {
      setFirst(value);
    } else {
      setSecond(value);
    }

    setResult(null);
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  const isClearDisabled =
    first === '' && second === '' && result === null && Object.keys(errors).length === 0;

  return (
    <main className="app-shell">
      <header className="topline">
        <div className="wordmark">
          <span className="wordmark-mark" aria-hidden="true">
            +
          </span>
          <span>ADD / SIMPLE</span>
        </div>
        <span className="topline-note">A small tool for everyday math</span>
      </header>

      <section className="calculator" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">JUST THE NUMBERS</p>
          <h1 id="page-title">Let’s add it up.</h1>
          <p className="intro-copy">Two numbers in. One clear answer out.</p>
        </div>

        <form className="calculator-form" onSubmit={handleSubmit} noValidate>
          <div className="number-fields">
            <div className="field-group">
              <label className="field-label" htmlFor="first-number">
                <span>First number</span>
                <span className="field-index" aria-hidden="true">
                  01
                </span>
              </label>
              <input
                ref={firstInputRef}
                autoComplete="off"
                className="number-input"
                id="first-number"
                inputMode="decimal"
                name="first"
                onChange={(event) => updateField('first', event.target.value)}
                placeholder="e.g. 24"
                type="number"
                value={first}
                aria-describedby={errors.first ? 'first-error' : undefined}
                aria-invalid={Boolean(errors.first)}
                required
                step="any"
              />
              {errors.first && (
                <p className="field-error" id="first-error">
                  {errors.first}
                </p>
              )}
            </div>

            <span className="operator" aria-hidden="true">
              +
            </span>

            <div className="field-group">
              <label className="field-label" htmlFor="second-number">
                <span>Second number</span>
                <span className="field-index" aria-hidden="true">
                  02
                </span>
              </label>
              <input
                ref={secondInputRef}
                autoComplete="off"
                className="number-input"
                id="second-number"
                inputMode="decimal"
                name="second"
                onChange={(event) => updateField('second', event.target.value)}
                placeholder="e.g. 18"
                type="number"
                value={second}
                aria-describedby={errors.second ? 'second-error' : undefined}
                aria-invalid={Boolean(errors.second)}
                required
                step="any"
              />
              {errors.second && (
                <p className="field-error" id="second-error">
                  {errors.second}
                </p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button className="add-button" type="submit">
              <span>Add numbers</span>
              <span className="button-arrow" aria-hidden="true">
                →
              </span>
            </button>
            <button
              className="clear-button"
              disabled={isClearDisabled}
              onClick={handleClear}
              type="button"
            >
              Clear
            </button>
          </div>
        </form>

        <section
          className={`result-panel${result !== null ? 'result-panel-success' : ''}`}
          aria-live="polite"
          aria-atomic="true"
          aria-label="Calculation result"
          role="status"
        >
          {result === null ? (
            <div className="result-empty">
              <span className="result-symbol" aria-hidden="true">
                =
              </span>
              <div>
                <p className="result-label">Your answer</p>
                <p className="result-hint">It’ll show up here when you’re ready.</p>
              </div>
            </div>
          ) : (
            <div className="result-success">
              <div className="result-equation" aria-label={`${first} plus ${second}`}>
                <span>{first}</span>
                <span aria-hidden="true">+</span>
                <span>{second}</span>
                <span aria-hidden="true">=</span>
              </div>
              <p className="result-label">Your answer</p>
              <p className="result-value">{numberFormatter.format(result)}</p>
            </div>
          )}
        </section>

        <p className="privacy-note">Nothing saved. Just a quick answer, whenever you need one.</p>
      </section>

      <footer className="page-footer">
        <span>ADD / SIMPLE</span>
        <span>Made for the little sums in life.</span>
      </footer>
    </main>
  );
}
