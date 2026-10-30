export const OPERATOR_SYMBOLS = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

const DIGIT_LIMIT = 12;

/**
 * @typedef {'add' | 'subtract' | 'multiply' | 'divide'} Operator
 * @typedef {{
 *   display: string,
 *   expression: string,
 *   firstOperand: number | null,
 *   operator: Operator | null,
 *   waitingForOperand: boolean,
 *   hasResult: boolean,
 *   error: string | null,
 * }} CalculatorState
 * @typedef {{ type: 'digit', value: string }
 *   | { type: 'decimal' }
 *   | { type: 'operator', operator: Operator }
 *   | { type: 'equals' }
 *   | { type: 'percentage' }
 *   | { type: 'sign' }
 *   | { type: 'backspace' }
 *   | { type: 'clear' }} CalculatorAction
 */

export function createInitialState() {
  return {
    display: '0',
    expression: '',
    firstOperand: null,
    operator: null,
    waitingForOperand: false,
    hasResult: false,
    error: null,
  };
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return 'Error';
  }

  if (value === 0) {
    return '0';
  }

  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1e15 || absoluteValue < 1e-7) {
    return value
      .toExponential(8)
      .replace(/(\.\d*?[1-9])0+e/, '$1e')
      .replace(/\.0+e/, 'e');
  }

  return new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 12,
    useGrouping: true,
  }).format(value);
}

function normalizeResult(value) {
  if (!Number.isFinite(value)) {
    throw new RangeError('That result is too large to calculate.');
  }

  const rounded = Number.parseFloat(value.toPrecision(12));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function assertFiniteOperands(left, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    throw new TypeError('Enter valid numbers to continue.');
  }
}

export function calculate(left, right, operator) {
  assertFiniteOperands(left, right);

  let result;

  switch (operator) {
    case 'add':
      result = left + right;
      break;
    case 'subtract':
      result = left - right;
      break;
    case 'multiply':
      result = left * right;
      break;
    case 'divide':
      if (right === 0) {
        throw new RangeError('Cannot divide by zero.');
      }
      result = left / right;
      break;
    default:
      throw new TypeError('Choose a valid operation.');
  }

  return normalizeResult(result);
}

export function percentageValue(left, right, operator) {
  assertFiniteOperands(left, right);

  if (operator === 'add' || operator === 'subtract') {
    return normalizeResult((left * right) / 100);
  }

  return normalizeResult(right / 100);
}

function makeErrorState(state, message) {
  return {
    ...state,
    display: 'Error',
    expression: '',
    firstOperand: null,
    operator: null,
    waitingForOperand: true,
    hasResult: false,
    error: message,
  };
}

function entryStateAfterError(state) {
  return state.error ? createInitialState() : state;
}

function handleDigit(currentState, value) {
  let state = entryStateAfterError(currentState);

  if (state.waitingForOperand || state.hasResult) {
    state = {
      ...state,
      display: '0',
      expression: state.hasResult ? '' : state.expression,
      waitingForOperand: false,
      hasResult: false,
    };
  }

  const digitCount = state.display.replace(/\D/g, '').length;

  if (digitCount >= DIGIT_LIMIT) {
    return state;
  }

  const display = state.display === '0' ? value : `${state.display}${value}`;

  return { ...state, display, error: null };
}

function handleDecimal(currentState) {
  let state = entryStateAfterError(currentState);

  if (state.waitingForOperand || state.hasResult) {
    state = {
      ...state,
      display: '0',
      expression: state.hasResult ? '' : state.expression,
      waitingForOperand: false,
      hasResult: false,
    };
  }

  if (state.display.includes('.')) {
    return state;
  }

  return { ...state, display: `${state.display}.`, error: null };
}

function handleOperator(state, nextOperator) {
  if (state.error) {
    return state;
  }

  const currentValue = Number(state.display);

  if (state.operator && state.firstOperand !== null && !state.waitingForOperand) {
    try {
      const result = calculate(state.firstOperand, currentValue, state.operator);
      return {
        ...state,
        display: String(result),
        expression: `${formatNumber(result)} ${OPERATOR_SYMBOLS[nextOperator]}`,
        firstOperand: result,
        operator: nextOperator,
        waitingForOperand: true,
        hasResult: false,
      };
    } catch (error) {
      return makeErrorState(state, error.message);
    }
  }

  const firstOperand =
    state.waitingForOperand && state.firstOperand !== null ? state.firstOperand : currentValue;

  return {
    ...state,
    display: String(firstOperand),
    expression: `${formatNumber(firstOperand)} ${OPERATOR_SYMBOLS[nextOperator]}`,
    firstOperand,
    operator: nextOperator,
    waitingForOperand: true,
    hasResult: false,
  };
}

function handleEquals(state) {
  if (state.error || !state.operator || state.firstOperand === null) {
    return state;
  }

  const right = state.waitingForOperand ? state.firstOperand : Number(state.display);

  try {
    const result = calculate(state.firstOperand, right, state.operator);
    const expression = `${formatNumber(state.firstOperand)} ${OPERATOR_SYMBOLS[state.operator]} ${formatNumber(right)} =`;

    return {
      ...state,
      display: String(result),
      expression,
      firstOperand: null,
      operator: null,
      waitingForOperand: true,
      hasResult: true,
      error: null,
    };
  } catch (error) {
    return makeErrorState(state, error.message);
  }
}

function handlePercentage(state) {
  if (state.error) {
    return state;
  }

  const currentValue = Number(state.display);
  const originalValue = formatNumber(currentValue);
  const percentOf =
    state.operator && state.firstOperand !== null
      ? percentageValue(state.firstOperand, currentValue, state.operator)
      : percentageValue(0, currentValue, null);

  return {
    ...state,
    display: String(percentOf),
    expression:
      state.operator && state.firstOperand !== null
        ? `${formatNumber(state.firstOperand)} ${OPERATOR_SYMBOLS[state.operator]} ${originalValue}%`
        : `${originalValue}%`,
    waitingForOperand: false,
    hasResult: false,
  };
}

export function calculatorReducer(state, action) {
  switch (action.type) {
    case 'digit':
      return handleDigit(state, action.value);
    case 'decimal':
      return handleDecimal(state);
    case 'operator':
      return handleOperator(state, action.operator);
    case 'equals':
      return handleEquals(state);
    case 'percentage':
      return handlePercentage(state);
    case 'sign': {
      if (state.error || Number(state.display) === 0) {
        return state;
      }

      const display = state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`;

      return { ...state, display, hasResult: false };
    }
    case 'backspace': {
      if (state.error) {
        return createInitialState();
      }

      if (state.waitingForOperand) {
        return state;
      }

      const shortened = state.display.length > 1 ? state.display.slice(0, -1) : '0';
      const display = shortened === '-' ? '0' : shortened;

      return { ...state, display, hasResult: false };
    }
    case 'clear':
      return createInitialState();
    default:
      return state;
  }
}
