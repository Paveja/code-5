export type Operator = 'add' | 'subtract' | 'multiply' | 'divide';

export type CalculatorState = {
  display: string;
  expression: string;
  firstOperand: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
  hasResult: boolean;
  error: string | null;
};

export type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operator'; operator: Operator }
  | { type: 'equals' }
  | { type: 'percentage' }
  | { type: 'sign' }
  | { type: 'backspace' }
  | { type: 'clear' };

export const OPERATOR_SYMBOLS: Record<Operator, string>;

export function createInitialState(): CalculatorState;
export function formatNumber(value: number): string;
export function calculate(left: number, right: number, operator: Operator): number;
export function percentageValue(left: number, right: number, operator: Operator | null): number;
export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState;
