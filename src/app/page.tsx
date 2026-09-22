'use client';

import { useMemo, useState } from 'react';

type Player = 'X' | 'O';
type Cell = Player | null;

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function getWinningLine(board: Cell[]): (typeof WINNING_LINES)[number] | null {
  return (
    WINNING_LINES.find(([first, second, third]) => {
      return board[first] && board[first] === board[second] && board[first] === board[third];
    }) ?? null
  );
}

export default function Home() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');

  const winningLine = useMemo(() => getWinningLine(board), [board]);
  const winner = winningLine ? board[winningLine[0]] : null;
  const isDraw = !winner && board.every(Boolean);
  const isComplete = Boolean(winner || isDraw);

  function handleMove(index: number) {
    if (board[index] || isComplete) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);

    if (!getWinningLine(nextBoard) && !nextBoard.every(Boolean)) {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }

  function startNewRound() {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
  }

  const status = winner
    ? `${winner} wins the round!`
    : isDraw
      ? 'It’s a draw.'
      : `${currentPlayer} to move`;

  const statusDetail = winner
    ? 'That was a clean finish.'
    : isDraw
      ? 'No empty squares left this time.'
      : 'Pick an open square to make your move.';

  return (
    <main className="game-shell">
      <section className="game-panel" aria-labelledby="game-title">
        <header className="game-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Two-player classic
          </div>
          <h1 id="game-title">Tic tac toe</h1>
          <p className="game-intro">
            Take turns, stay sharp, and make your line before your opponent does.
          </p>
        </header>

        <div className="game-content">
          <div className="status-card" aria-live="polite">
            <div>
              <p className="status-label">Current round</p>
              <p className="status-message">{status}</p>
              <p className="status-detail">{statusDetail}</p>
            </div>
            <span
              className={`turn-mark turn-mark-${winner ?? (isDraw ? 'draw' : currentPlayer)}`}
              aria-hidden="true"
            >
              {winner ?? (isDraw ? '—' : currentPlayer)}
            </span>
          </div>

          <div className="board-wrap">
            <div className="board" role="grid" aria-label="Tic tac toe board">
              {board.map((cell, index) => {
                const isWinningCell =
                  winningLine?.some((winningIndex) => winningIndex === index) ?? false;

                return (
                  <button
                    className={`cell ${cell ? `cell-${cell.toLowerCase()}` : ''} ${
                      isWinningCell ? 'cell-winning' : ''
                    }`}
                    key={index}
                    type="button"
                    role="gridcell"
                    aria-label={
                      cell ? `Square ${index + 1}: ${cell}` : `Square ${index + 1}: empty`
                    }
                    disabled={Boolean(cell) || isComplete}
                    onClick={() => handleMove(index)}
                  >
                    {cell && <span aria-hidden="true">{cell}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="new-round" type="button" onClick={startNewRound}>
            <span aria-hidden="true">↻</span>
            New round
          </button>
        </div>

        <footer className="game-footer">
          <div className="legend-item">
            <span className="legend-mark legend-x" aria-hidden="true">
              X
            </span>
            <span>Player one</span>
          </div>
          <div className="legend-divider" aria-hidden="true" />
          <div className="legend-item">
            <span className="legend-mark legend-o" aria-hidden="true">
              O
            </span>
            <span>Player two</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
