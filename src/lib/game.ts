export type Mark = "X" | "O";
export type Board = Array<Mark | null>;

export type GameResult = {
  winner: Mark | null;
  winningLine: number[] | null;
};

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function getGameResult(board: Board): GameResult {
  for (const line of WINNING_LINES) {
    const [first, second, third] = line;
    const mark = board[first];

    if (mark && mark === board[second] && mark === board[third]) {
      return { winner: mark, winningLine: line };
    }
  }

  return { winner: null, winningLine: null };
}

function findWinningMove(board: Board, mark: Mark): number | null {
  for (const line of WINNING_LINES) {
    const matching = line.filter((index) => board[index] === mark);
    const empty = line.find((index) => board[index] === null);

    if (matching.length === 2 && empty !== undefined) {
      return empty;
    }
  }

  return null;
}

export function chooseComputerMove(
  board: Board,
  random: () => number = Math.random,
): number | null {
  const available = board.flatMap((mark, index) =>
    mark === null ? [index] : [],
  );

  if (available.length === 0) {
    return null;
  }

  if (random() < 0.68) {
    const winningMove = findWinningMove(board, "O");
    const blockingMove = findWinningMove(board, "X");
    const strategicMove = winningMove ?? blockingMove;

    if (strategicMove !== null) {
      return strategicMove;
    }

    const preferred = [4, 0, 2, 6, 8].filter((index) =>
      available.includes(index),
    );

    if (preferred.length > 0) {
      return preferred[Math.floor(random() * preferred.length)];
    }
  }

  return available[Math.floor(random() * available.length)];
}
