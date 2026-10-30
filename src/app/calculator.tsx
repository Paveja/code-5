'use client';

import { useEffect, useReducer } from 'react';
import {
  calculatorReducer,
  createInitialState,
  formatNumber,
  OPERATOR_SYMBOLS,
} from '../lib/calculator.mjs';

type CalculatorAction = Parameters<typeof calculatorReducer>[1];
type KeyDefinition = {
  label: string;
  accessibleName: string;
  action: CalculatorAction;
  kind?: 'utility' | 'operator' | 'equals' | 'zero';
};

const KEYS: KeyDefinition[] = [
  { label: 'AC', accessibleName: 'All clear', action: { type: 'clear' }, kind: 'utility' },
  { label: '±', accessibleName: 'Change sign', action: { type: 'sign' }, kind: 'utility' },
  { label: '%', accessibleName: 'Percent', action: { type: 'percentage' }, kind: 'utility' },
  {
    label: OPERATOR_SYMBOLS.divide,
    accessibleName: 'Divide',
    action: { type: 'operator', operator: 'divide' },
    kind: 'operator',
  },
  { label: '7', accessibleName: '7', action: { type: 'digit', value: '7' } },
  { label: '8', accessibleName: '8', action: { type: 'digit', value: '8' } },
  { label: '9', accessibleName: '9', action: { type: 'digit', value: '9' } },
  {
    label: OPERATOR_SYMBOLS.multiply,
    accessibleName: 'Multiply',
    action: { type: 'operator', operator: 'multiply' },
    kind: 'operator',
  },
  { label: '4', accessibleName: '4', action: { type: 'digit', value: '4' } },
  { label: '5', accessibleName: '5', action: { type: 'digit', value: '5' } },
  { label: '6', accessibleName: '6', action: { type: 'digit', value: '6' } },
  {
    label: OPERATOR_SYMBOLS.subtract,
    accessibleName: 'Subtract',
    action: { type: 'operator', operator: 'subtract' },
    kind: 'operator',
  },
  { label: '1', accessibleName: '1', action: { type: 'digit', value: '1' } },
  { label: '2', accessibleName: '2', action: { type: 'digit', value: '2' } },
  { label: '3', accessibleName: '3', action: { type: 'digit', value: '3' } },
  {
    label: OPERATOR_SYMBOLS.add,
    accessibleName: 'Add',
    action: { type: 'operator', operator: 'add' },
    kind: 'operator',
  },
  { label: '0', accessibleName: '0', action: { type: 'digit', value: '0' }, kind: 'zero' },
  { label: '.', accessibleName: 'Decimal point', action: { type: 'decimal' }, kind: 'utility' },
  {
    label: '⌫',
    accessibleName: 'Delete last digit',
    action: { type: 'backspace' },
    kind: 'utility',
  },
  { label: '=', accessibleName: 'Equals', action: { type: 'equals' }, kind: 'equals' },
];

const KEYBOARD_ACTIONS: Record<string, CalculatorAction> = {
  Enter: { type: 'equals' },
  '=': { type: 'equals' },
  Backspace: { type: 'backspace' },
  Escape: { type: 'clear' },
  Delete: { type: 'clear' },
  '%': { type: 'percentage' },
  '+': { type: 'operator', operator: 'add' },
  '-': { type: 'operator', operator: 'subtract' },
  '*': { type: 'operator', operator: 'multiply' },
  '/': { type: 'operator', operator: 'divide' },
};

export default function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, undefined, createInitialState);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const action = /^\d$/.test(event.key)
        ? ({ type: 'digit', value: event.key } as const)
        : event.key === '.'
          ? ({ type: 'decimal' } as const)
          : KEYBOARD_ACTIONS[event.key];

      if (action) {
        event.preventDefault();
        dispatch(action);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const displayValue =
    state.hasResult || (state.waitingForOperand && state.operator)
      ? formatNumber(Number(state.display))
      : state.display;

  return (
    <section className="calculator" aria-label="Calculator">
      <div className="calculator-screen">
        <p className="calculator-expression" aria-hidden="true">
          {state.expression || 'Ready for a calculation'}
        </p>
        <output
          className={displayValue.length > 12 ? 'calculator-display is-long' : 'calculator-display'}
          aria-label="Calculator display"
          aria-live="polite"
          aria-atomic="true"
        >
          {displayValue}
        </output>
        {state.error && (
          <p className="calculator-error" role="alert">
            {state.error}
          </p>
        )}
      </div>

      <div className="calculator-keys" role="group" aria-label="Calculator keys">
        {KEYS.map((key) => (
          <button
            key={key.accessibleName}
            type="button"
            className={['calculator-key', key.kind].filter(Boolean).join(' ')}
            aria-label={key.accessibleName}
            aria-pressed={
              key.action.type === 'operator' ? state.operator === key.action.operator : undefined
            }
            onClick={() => dispatch(key.action)}
          >
            {key.label}
          </button>
        ))}
      </div>
    </section>
  );
}
