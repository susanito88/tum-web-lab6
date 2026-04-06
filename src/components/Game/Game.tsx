import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Word, GameMode } from "@/types";
import { getRandomWord } from "@/services/storage/wordsDB";
import { addGameToHistory } from "@/services/storage/gameHistoryDB";
import { useCoins, useStreak } from "@/hooks/useCoins";
import {
  evaluateGuess,
  calculateCoinsEarned,
  getDifficultyNumber,
} from "@/utils/gameUtils";
import styles from "./Game.module.css";

export function GameComponent() {
  const { category, mode } = useParams<{ category: string; mode: string }>();
  const navigate = useNavigate();
  const { addCoins } = useCoins();
  const { incrementStreak } = useStreak();

  const [word, setWord] = useState<Word | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const initGame = async () => {
      try {
        const randomWord = await getRandomWord(category as Word["category"]);
        setWord(randomWord);
      } catch (error) {
        console.error("Failed to load word:", error);
        navigate("/");
      }
    };
    initGame();
  }, [category, navigate]);

  const handleGuess = async () => {
    if (!word) return;
    if (currentGuess.length !== 5) {
      setMessage("Word must be 5 letters");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    const isCorrect = currentGuess.toUpperCase() === word.word.toUpperCase();

    if (isCorrect) {
      setGameWon(true);
      const coinsEarned = calculateCoinsEarned(
        newGuesses.length,
        mode as GameMode,
        getDifficultyNumber(category || "Easy"),
      );
      addCoins(coinsEarned);
      incrementStreak();

      await addGameToHistory({
        id: `${Date.now()}`,
        word: word.word,
        gameMode: mode as GameMode,
        category: word.category,
        won: true,
        guessCount: newGuesses.length,
        timeElapsed: 0,
        coinsEarned,
        difficulty: getDifficultyNumber(category || "Easy"),
        playedAt: Date.now(),
      });
    } else if (newGuesses.length >= 6) {
      setGameLost(true);
      await addGameToHistory({
        id: `${Date.now()}`,
        word: word.word,
        gameMode: mode as GameMode,
        category: word.category,
        won: false,
        guessCount: newGuesses.length,
        timeElapsed: 0,
        coinsEarned: 0,
        difficulty: getDifficultyNumber(category || "Easy"),
        playedAt: Date.now(),
      });
    }
  };

  if (!word) {
    return (
      <div className={styles.game}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.game}>
      <header className={styles.gameHeader}>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          ← Back
        </button>
        <h2>
          {category} - {mode && mode.charAt(0).toUpperCase() + mode.slice(1)}
        </h2>
        <div></div>
      </header>

      <main className={styles.gameMain}>
        <div className={styles.guesses}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.guessRow}>
              {guesses[i]
                ? guesses[i].split("").map((letter, j) => (
                    <div key={j} className={styles.letter}>
                      {letter.toUpperCase()}
                    </div>
                  ))
                : i === guesses.length
                  ? currentGuess.split("").map((letter, j) => (
                      <div key={j} className={styles.letter}>
                        {letter.toUpperCase()}
                      </div>
                    ))
                  : null}
            </div>
          ))}
        </div>

        {!gameWon && !gameLost && (
          <div className={styles.input}>
            <input
              type="text"
              maxLength={5}
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              placeholder="Type 5 letters..."
              autoFocus
            />
            <button onClick={handleGuess} className={styles.submitButton}>
              Submit
            </button>
          </div>
        )}

        {message && <div className={styles.message}>{message}</div>}

        {gameWon && (
          <div className={styles.result}>
            <h3>🎉 You Won!</h3>
            <p>Guesses: {guesses.length}/6</p>
            <button onClick={() => navigate("/")} className={styles.nextButton}>
              Play Again
            </button>
          </div>
        )}

        {gameLost && (
          <div className={styles.result}>
            <h3>😢 Game Over</h3>
            <p>The word was: {word.word}</p>
            <button onClick={() => navigate("/")} className={styles.nextButton}>
              Back to Menu
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
