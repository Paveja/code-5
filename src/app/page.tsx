'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Operator = '+' | '−' | '×' | '÷';
type HistoryEntry = { expression: string; result: string };

const operatorLabels: Record<Operator, string> = {
  '+': 'plus',
  '−': 'minus',
  '×': 'multiply',
  '÷': 'divide',
};

const keypad: Array<{
  label: string;
  action: string;
  style: string;
  value?: string;
  ariaLabel?: string;
}> = [
  { label: 'AC', action: 'clear', style: 'utility' },
  { label: '⌫', action: 'backspace', style: 'utility', ariaLabel: 'Backspace' },
  { label: '%', action: 'percent', style: 'utility', ariaLabel: 'Percent' },
  { label: '÷', action: 'operator', value: '÷', style: 'operator' },
  { label: '7', action: 'digit', style: 'number' },
  { label: '8', action: 'digit', style: 'number' },
  { label: '9', action: 'digit', style: 'number' },
  { label: '×', action: 'operator', value: '×', style: 'operator' },
  { label: '4', action: 'digit', style: 'number' },
  { label: '5', action: 'digit', style: 'number' },
  { label: '6', action: 'digit', style: 'number' },
  { label: '−', action: 'operator', value: '−', style: 'operator' },
  { label: '1', action: 'digit', style: 'number' },
  { label: '2', action: 'digit', style: 'number' },
  { label: '3', action: 'digit', style: 'number' },
  { label: '+', action: 'operator', value: '+', style: 'operator' },
  { label: '0', action: 'digit', style: 'number wide' },
  { label: '.', action: 'decimal', style: 'number' },
  { label: '=', action: 'equals', style: 'equals' },
];

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return 'Error';
  return Number(value.toPrecision(12)).toString();
}

function calculate(left: number, right: number, operator: Operator) {
  if (operator === '+') return left + right;
  if (operator === '−') return left - right;
  if (operator === '×') return left * right;
  if (right === 0) return null;
  return left / right;
}

export default function Home() {
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [lastOperation, setLastOperation] = useState<{
    operator: Operator;
    operand: number;
  } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const expression = useMemo(() => {
    if (accumulator !== null && operator) return `${formatNumber(accumulator)} ${operator}`;
    return 'Ready when you are';
  }, [accumulator, operator]);

  const reset = useCallback(() => {
    setDisplay('0');
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
    setLastOperation(null);
    setError(null);
  }, []);

  const inputDigit = useCallback(
    (digit: string) => {
      setError(null);
      setDisplay((current) => {
        if (waitingForOperand || current === '0') return digit;
        return current.length < 14 ? current + digit : current;
      });
      setWaitingForOperand(false);
    },
    [waitingForOperand]
  );

  const inputDecimal = useCallback(() => {
    setError(null);
    setDisplay((current) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      return current.includes('.') ? current : `${current}.`;
    });
  }, [waitingForOperand]);

  const chooseOperator = useCallback(
    (nextOperator: Operator) => {
      setError(null);
      const inputValue = Number(display);
      if (accumulator === null) {
        setAccumulator(inputValue);
      } else if (operator && !waitingForOperand) {
        const result = calculate(accumulator, inputValue, operator);
        if (result === null) {
          setError('Cannot divide by zero');
          return;
        }
        setAccumulator(result);
        setDisplay(formatNumber(result));
      }
      setOperator(nextOperator);
      setWaitingForOperand(true);
      setLastOperation(null);
    },
    [accumulator, display, operator, waitingForOperand]
  );

  const equals = useCallback(() => {
    setError(null);
    let activeOperator = operator;
    let left = accumulator;
    let right = Number(display);

    if (activeOperator && left !== null && !waitingForOperand) {
      right = Number(display);
    } else if (lastOperation) {
      activeOperator = lastOperation.operator;
      left = Number(display);
      right = lastOperation.operand;
    }

    if (activeOperator === null || left === null) return;
    const result = calculate(left, right, activeOperator);
    if (result === null) {
      setError('Cannot divide by zero');
      return;
    }

    const formattedResult = formatNumber(result);
    setHistory((current) =>
      [
        {
          expression: `${formatNumber(left)} ${activeOperator} ${formatNumber(right)}`,
          result: formattedResult,
        },
        ...current,
      ].slice(0, 8)
    );
    setDisplay(formattedResult);
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(true);
    setLastOperation({ operator: activeOperator, operand: right });
  }, [accumulator, display, lastOperation, operator, waitingForOperand]);

  const backspace = useCallback(() => {
    setError(null);
    setDisplay((current) => (current.length > 1 ? current.slice(0, -1) : '0'));
  }, []);

  const percent = useCallback(() => {
    setError(null);
    setDisplay(formatNumber(Number(display) / 100));
    setWaitingForOperand(true);
  }, [display]);

  const handleAction = useCallback(
    (action: string, value?: string) => {
      if (action === 'clear') reset();
      if (action === 'backspace') backspace();
      if (action === 'percent') percent();
      if (action === 'digit' && value !== undefined) inputDigit(value);
      if (action === 'decimal') inputDecimal();
      if (action === 'operator' && value) chooseOperator(value as Operator);
      if (action === 'equals') equals();
    },
    [backspace, chooseOperator, equals, inputDecimal, inputDigit, percent, reset]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) handleAction('digit', event.key);
      else if (event.key === '.') handleAction('decimal');
      else if (event.key === 'Enter' || event.key === '=') handleAction('equals');
      else if (event.key === 'Escape') handleAction('clear');
      else if (event.key === 'Backspace') handleAction('backspace');
      else if (event.key === '%') handleAction('percent');
      else if (event.key === '+') handleAction('operator', '+');
      else if (event.key === '-') handleAction('operator', '−');
      else if (event.key === '*') handleAction('operator', '×');
      else if (event.key === '/') handleAction('operator', '÷');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleAction]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="calculator-shell">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Everyday arithmetic</p>
              <h1 className="text-ink mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                The clear answer.
              </h1>
            </div>
            <div className="status-pill">
              <span className="status-dot" />
              Ready
            </div>
          </header>

          <div className="display-panel" aria-live="polite">
            <p className="display-expression">{error ?? expression}</p>
            <p className={`display-value ${error ? 'display-error' : ''}`}>{display}</p>
          </div>

          <div className="keypad" aria-label="Calculator keypad">
            {keypad.map((key) => (
              <button
                key={key.label}
                type="button"
                className={`key key-${key.style}`}
                aria-label={
                  key.ariaLabel ??
                  (key.action === 'operator' ? operatorLabels[key.value as Operator] : key.label)
                }
                onClick={() => handleAction(key.action, key.value ?? key.label)}
              >
                {key.label}
              </button>
            ))}
          </div>
          <p className="keyboard-hint">
            <span>⌘</span> Tip: use your keyboard to move faster
          </p>
        </section>

        <aside className="history-shell">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Calculation tape</p>
              <h2 className="text-ink mt-2 text-xl font-semibold tracking-[-0.03em]">
                Recent work
              </h2>
            </div>
            {history.length > 0 && (
              <button type="button" className="clear-history" onClick={() => setHistory([])}>
                Clear
              </button>
            )}
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">
                <span className="empty-mark">∑</span>
                <p>Your completed calculations will land here.</p>
              </div>
            ) : (
              history.map((item, index) => (
                <button
                  type="button"
                  className="history-item"
                  key={`${item.expression}-${index}`}
                  onClick={() => setDisplay(item.result)}
                >
                  <span>{item.expression}</span>
                  <strong>{item.result}</strong>
                </button>
              ))
            )}
          </div>
          <p className="session-note">History stays on this page and clears when you refresh.</p>
        </aside>
      </div>
    </main>
  );
}
