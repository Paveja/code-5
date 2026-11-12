import assert from "node:assert/strict";
import test from "node:test";
import { chooseComputerMove, getGameResult, type Board } from "../src/lib/game";

test("detects a winning row and returns its cells", () => {
  const board: Board = ["X", "X", "X", "O", null, "O", null, null, null];

  assert.deepEqual(getGameResult(board), {
    winner: "X",
    winningLine: [0, 1, 2],
  });
});

test("recognizes a full board with no winner as a draw", () => {
  const board: Board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];

  assert.deepEqual(getGameResult(board), { winner: null, winningLine: null });
  assert.equal(chooseComputerMove(board), null);
});

test("takes a winning move when the computer plays strategically", () => {
  const board: Board = ["O", "O", null, "X", "X", null, null, null, null];

  assert.equal(
    chooseComputerMove(board, () => 0),
    2,
  );
});

test("blocks a player's immediate win when the computer plays strategically", () => {
  const board: Board = ["X", "X", null, "O", null, null, null, null, null];

  assert.equal(
    chooseComputerMove(board, () => 0),
    2,
  );
});

test("a casual random move never replaces an occupied square", () => {
  const board: Board = ["X", null, "O", null, "X", null, null, null, null];
  const move = chooseComputerMove(board, () => 0.99);

  assert.notEqual(move, null);
  assert.equal(board[move as number], null);
});
