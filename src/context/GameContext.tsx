import React, { createContext, useContext, useState, useCallback } from "react";
import type { GameState, GameMode, Guess, Word } from "@/types";

interface GameContextType {
  gameState: GameState | null;
  startGame: (targetWord: Word, gameMode: GameMode) => void;
  addGuess: (guess: string) => boolean;
  revealLetter: (index: number) => void;
  revealPosition: (index: number) => void;
  eliminateLetters: (letters: Set<string>) => void;
  endGame: (won: boolean) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const startGame = useCallback((targetWord: Word, gameMode: GameMode) => {
    setGameState({
      targetWord: targetWord.word,
      guesses: [],
      gameMode,
      category: targetWord.category,
      startTime: Date.now(),
      won: false,
      hintsUsed: {
        revealed: new Set(),
        positions: new Set(),
        eliminated: new Set(),
      },
    });
  }, []);

  const addGuess = useCallback(
    (guess: string) => {
      if (!gameState) return false;
      if (gameState.won || gameState.guesses.length >= 6) return false;

      // This will be properly evaluated when we build the game component
      const newGuesses: Guess[] = [
        ...gameState.guesses,
        {
          word: guess,
          result: [],
        },
      ];

      setGameState((prev) => (prev ? { ...prev, guesses: newGuesses } : null));
      return true;
    },
    [gameState],
  );

  const revealLetter = useCallback((index: number) => {
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            hintsUsed: {
              ...prev.hintsUsed,
              revealed: new Set([...prev.hintsUsed.revealed, index]),
            },
          }
        : null,
    );
  }, []);

  const revealPosition = useCallback((index: number) => {
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            hintsUsed: {
              ...prev.hintsUsed,
              positions: new Set([...prev.hintsUsed.positions, index]),
            },
          }
        : null,
    );
  }, []);

  const eliminateLetters = useCallback((letters: Set<string>) => {
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            hintsUsed: {
              ...prev.hintsUsed,
              eliminated: new Set([...prev.hintsUsed.eliminated, ...letters]),
            },
          }
        : null,
    );
  }, []);

  const endGame = useCallback((won: boolean) => {
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            won,
            endTime: Date.now(),
          }
        : null,
    );
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        startGame,
        addGuess,
        revealLetter,
        revealPosition,
        eliminateLetters,
        endGame,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
