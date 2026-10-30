import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatorReducer, calculate, createInitialState } from './calculator.mjs';

const press = (state, action) => calculatorReducer(state, action);
const enterDigits = (state, digits) =>
  [...digits].reduce((current, digit) => press(current, { type: 'digit', value: digit }), state);

test('calculates each basic arithmetic operation', () => {
  assert.equal(calculate(8, 3, 'add'), 11);
  assert.equal(calculate(8, 3, 'subtract'), 5);
  assert.equal(calculate(8, 3, 'multiply'), 24);
  assert.equal(calculate(8, 4, 'divide'), 2);
});

test('normalizes common floating-point rounding noise', () => {
  assert.equal(calculate(0.1, 0.2, 'add'), 0.3);
});

test('rejects division by zero instead of returning an invalid number', () => {
  assert.throws(() => calculate(10, 0, 'divide'), {
    name: 'RangeError',
    message: 'Cannot divide by zero.',
  });
});

test('rejects invalid operands and operations', () => {
  assert.throws(() => calculate(Number.NaN, 2, 'add'), { name: 'TypeError' });
  assert.throws(() => calculate(2, 1, 'unknown'), { name: 'TypeError' });
});

test('supports context-aware percentage arithmetic', () => {
  let state = enterDigits(createInitialState(), '100');
  state = press(state, { type: 'operator', operator: 'add' });
  state = enterDigits(state, '10');
  state = press(state, { type: 'percentage' });
  state = press(state, { type: 'equals' });
  assert.equal(state.display, '110');

  state = enterDigits(createInitialState(), '100');
  state = press(state, { type: 'operator', operator: 'multiply' });
  state = enterDigits(state, '10');
  state = press(state, { type: 'percentage' });
  state = press(state, { type: 'equals' });
  assert.equal(state.display, '10');

  state = enterDigits(createInitialState(), '100');
  state = press(state, { type: 'operator', operator: 'subtract' });
  state = enterDigits(state, '10');
  state = press(state, { type: 'percentage' });
  state = press(state, { type: 'equals' });
  assert.equal(state.display, '90');

  state = enterDigits(createInitialState(), '100');
  state = press(state, { type: 'operator', operator: 'divide' });
  state = enterDigits(state, '10');
  state = press(state, { type: 'percentage' });
  state = press(state, { type: 'equals' });
  assert.equal(state.display, '1000');

  state = enterDigits(createInitialState(), '10');
  state = press(state, { type: 'percentage' });
  assert.equal(state.display, '0.1');
});

test('chains operations immediately and clears or deletes entered digits', () => {
  let state = enterDigits(createInitialState(), '12');
  state = press(state, { type: 'operator', operator: 'add' });
  state = enterDigits(state, '3');
  state = press(state, { type: 'operator', operator: 'multiply' });
  assert.equal(state.display, '15');
  state = enterDigits(state, '2');
  state = press(state, { type: 'equals' });
  assert.equal(state.display, '30');

  state = enterDigits(createInitialState(), '123');
  state = press(state, { type: 'backspace' });
  assert.equal(state.display, '12');
  state = press(state, { type: 'clear' });
  assert.equal(state.display, '0');
});

test('supports decimal entry and sign changes', () => {
  let state = enterDigits(createInitialState(), '12');
  state = press(state, { type: 'decimal' });
  state = press(state, { type: 'digit', value: '5' });
  state = press(state, { type: 'sign' });
  assert.equal(state.display, '-12.5');

  state = press(state, { type: 'sign' });
  assert.equal(state.display, '12.5');
});

test('shows a recoverable error for division by zero', () => {
  let state = enterDigits(createInitialState(), '5');
  state = press(state, { type: 'operator', operator: 'divide' });
  state = enterDigits(state, '0');
  state = press(state, { type: 'equals' });

  assert.equal(state.display, 'Error');
  assert.match(state.error, /divide by zero/i);

  state = press(state, { type: 'digit', value: '7' });
  assert.equal(state.display, '7');
  assert.equal(state.error, null);
});
