"use client";

import { useEffect, useState } from "react";
import {
  chooseComputerMove,
  getGameResult,
  type Board,
  type Mark,
} from "@/lib/game";

type Phase =
  "player-turn" | "computer-turn" | "player-won" | "computer-won" | "draw";

const EMPTY_BOARD: Board = Array.from({ length: 9 }, () => null);

const PHASE_COPY: Record<Phase, string> = {
  "player-turn": "Your move",
  "computer-turn": "The computer is thinking…",
  "player-won": "You got three in a row!",
  "computer-won": "The computer got this one.",
  draw: "A perfectly matched draw.",
};

export default function Game() {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [phase, setPhase] = useState<Phase>("player-turn");
  const [notice, setNotice] = useState("");
  const result = getGameResult(board);
  const gameOver =
    phase === "player-won" || phase === "computer-won" || phase === "draw";

  useEffect(() => {
    if (phase !== "computer-turn") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const move = chooseComputerMove(board);

      if (move === null) {
        setPhase("draw");
        return;
      }

      const nextBoard = board.slice();
      nextBoard[move] = "O";
      setBoard(nextBoard);

      if (getGameResult(nextBoard).winner === "O") {
        setPhase("computer-won");
      } else if (nextBoard.every((mark) => mark !== null)) {
        setPhase("draw");
      } else {
        setPhase("player-turn");
      }
    }, 620);

    return () => window.clearTimeout(timeoutId);
  }, [board, phase]);

  function handleMove(index: number) {
    if (phase !== "player-turn") {
      return;
    }

    if (board[index] !== null) {
      setNotice("That square is taken. Try another one.");
      return;
    }

    const nextBoard = board.slice();
    nextBoard[index] = "X";
    setBoard(nextBoard);
    setNotice("");

    if (getGameResult(nextBoard).winner === "X") {
      setPhase("player-won");
    } else if (nextBoard.every((mark) => mark !== null)) {
      setPhase("draw");
    } else {
      setPhase("computer-turn");
    }
  }

  function startNewGame() {
    setBoard(Array.from({ length: 9 }, () => null));
    setPhase("player-turn");
    setNotice("");
  }

  const statusCopy = PHASE_COPY[phase];
  const currentMark: Mark | null =
    phase === "player-turn" ? "X" : phase === "computer-turn" ? "O" : null;

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#game" aria-label="Good Game Club home">
          <span className="brand-mark" aria-hidden="true">
            <span>X</span>
            <span>O</span>
          </span>
          <span className="brand-name">GOOD GAME CLUB</span>
        </a>
        <span className="header-note">A tiny break, well played.</span>
      </header>

      <main className="game-page" id="game">
        <div className="intro">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            THE CLASSIC, YOURS AGAIN
          </p>
          <h1>
            Tic tac toe,
            <br />
            <em>your way.</em>
          </h1>
          <p className="intro-copy">
            A few good moves can turn a day around.
            <br className="desktop-break" /> You’re X. The computer’s O. You go
            first.
          </p>
        </div>

        <div className="game-layout">
          <section className="board-panel" aria-label="Tic Tac Toe board">
            <div className="board-topline">
              <span>
                ROUND <strong>01</strong>
              </span>
              <span>3 IN A ROW WINS</span>
            </div>

            <div className="board" role="group" aria-label="Choose a square">
              {board.map((mark, index) => {
                const isWinningCell =
                  result.winningLine?.includes(index) ?? false;
                const label = mark
                  ? `Square ${index + 1}, ${mark}`
                  : `Square ${index + 1}, empty`;

                return (
                  <button
                    key={index}
                    className={`square${mark ? ` mark-${mark.toLowerCase()}` : ""}${isWinningCell ? " is-winning" : ""}`}
                    type="button"
                    aria-label={label}
                    aria-pressed={mark !== null}
                    disabled={phase !== "player-turn" || gameOver}
                    onClick={() => handleMove(index)}
                  >
                    {mark && <span aria-hidden="true">{mark}</span>}
                  </button>
                );
              })}
            </div>

            <div className="board-footline">
              <span className="footline-dot" />
              <span>TAKE YOUR TIME</span>
              <span className="footline-dot" />
            </div>
          </section>

          <aside className="game-aside" aria-label="Match information">
            <div className={`turn-card${gameOver ? " is-finished" : ""}`}>
              <p className="eyebrow">ON THE BOARD</p>
              <p className="turn-title" aria-live="polite" aria-atomic="true">
                {statusCopy}
              </p>
              <div className="players">
                <div
                  className={`player-row${currentMark === "X" ? " is-current" : ""}`}
                >
                  <span className="player-mark mark-x" aria-hidden="true">
                    X
                  </span>
                  <span className="player-copy">
                    <strong>You</strong>
                    <small>PLAYER ONE</small>
                  </span>
                  <span className="player-indicator" aria-hidden="true" />
                </div>
                <div
                  className={`player-row${currentMark === "O" ? " is-current" : ""}`}
                >
                  <span className="player-mark mark-o" aria-hidden="true">
                    O
                  </span>
                  <span className="player-copy">
                    <strong>Computer</strong>
                    <small>PLAYER TWO</small>
                  </span>
                  <span className="player-indicator" aria-hidden="true" />
                </div>
              </div>
              <p className="notice" role="status">
                {notice || (gameOver ? "Ready for another round?" : "")}
              </p>
              <button className="new-game" type="button" onClick={startNewGame}>
                <span aria-hidden="true">↻</span> New game
              </button>
            </div>

            <div className="tip-card">
              <span className="tip-mark" aria-hidden="true">
                ✳
              </span>
              <div>
                <p className="tip-heading">A little friendly advice</p>
                <p className="tip-copy">
                  Watch the corners. And don’t forget to have fun.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <span>GOOD GAME CLUB</span>
        <span>NO SCORE TO KEEP. JUST ONE MORE ROUND.</span>
      </footer>
    </div>
  );
}
