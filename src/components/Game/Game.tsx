import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Word, GameMode, Guess } from "@/types";
import { getRandomWord, isWordInDictionary } from "@/services/storage/wordsDB";
import { addGameToHistory } from "@/services/storage/gameHistoryDB";
import { addGameToHistoryAPI } from "@/services/storage/gameHistoryAPI";
import { useCoins, useStreak } from "@/hooks/useCoins";
import {
  evaluateGuess,
  calculateCoinsEarned,
  getDifficultyNumber,
  getKeyboardState,
} from "@/utils/gameUtils";
import { localStorageService } from "@/services/storage/localStorageService";
import styles from "./Game.module.css";

function decodeChallengeWord(token: string): string {
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded).toUpperCase();
}

export function GameComponent() {
  const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const { category, mode } = useParams<{ category: string; mode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { addCoins, coins, spendCoins } = useCoins();
  const { incrementStreak } = useStreak();

  const [word, setWord] = useState<Word | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [message, setMessage] = useState("");
  const [hintsRemaining, setHintsRemaining] = useState({
    reveal: 5,
    position: 5,
    eliminate: 5,
  });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [isChallenge, setIsChallenge] = useState(false);

  useEffect(() => {
    const initGame = async () => {
      try {
        const challengeToken = new URLSearchParams(location.search).get(
          "challenge",
        );

        if (challengeToken) {
          const challengeWord = decodeChallengeWord(challengeToken);

          if (!/^[A-Z]{5}$/.test(challengeWord)) {
            throw new Error("Invalid challenge word");
          }

          setIsChallenge(true);
          setWord({
            id: `challenge-${challengeWord}`,
            word: challengeWord,
            category: category as Word["category"],
            length: challengeWord.length,
            liked: false,
            addedAt: Date.now(),
            isCustom: true,
          });
          localStorageService.setLastPlayedAt(Date.now());
          return;
        }

        setIsChallenge(false);
        const randomWord = await getRandomWord(category as Word["category"]);
        setWord(randomWord);
        localStorageService.setLastPlayedAt(Date.now());
      } catch (error) {
        console.error("Failed to load word:", error);
        navigate("/");
      }
    };
    initGame();
  }, [category, location.search, navigate]);

  // Timer for speed mode
  useEffect(() => {
    if (!timerActive || mode !== "speed") return;

    const timer = setInterval(() => {
      setTimeElapsed((t) => {
        if (t >= 300) {
          // 5 minutes
          setGameLost(true);
          setTimerActive(false);
          return t;
        }
        return t + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, mode]);

  const handleGuess = async () => {
    if (!word) return;
    if (gameLost || gameWon) return;
    const normalizedGuess = currentGuess.trim().toUpperCase();

    if (normalizedGuess.length !== 5) {
      setMessage("Word must be 5 letters");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    if (!/^[A-Z]{5}$/.test(normalizedGuess)) {
      setMessage("Use only letters A-Z");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const existsInDictionary = await isWordInDictionary(normalizedGuess);
    const isExactChallengeAnswer =
      isChallenge && normalizedGuess === word.word.toUpperCase();
    if (!existsInDictionary && !isExactChallengeAnswer) {
      setMessage("Word not in dictionary");
      setTimeout(() => setMessage(""), 1800);
      return;
    }

    const evaluatedResult = evaluateGuess(normalizedGuess, word.word);
    const result =
      mode === "hardcore"
        ? evaluatedResult.map((r) => (r === "absent" ? "absent" : "present"))
        : evaluatedResult;
    const newGuesses = [...guesses, { word: normalizedGuess, result }];
    setGuesses(newGuesses);
    setCurrentGuess("");

    const isCorrect = normalizedGuess === word.word.toUpperCase();

    if (isCorrect) {
      setGameWon(true);
      setTimerActive(false);

      const gameMode = mode as GameMode;
      const difficulty = getDifficultyNumber(category || "Easy");
      const coinsEarned = calculateCoinsEarned(
        newGuesses.length,
        gameMode,
        difficulty,
      );

      addCoins(coinsEarned);
      incrementStreak();

      const historyEntry = {
        word: word.word,
        gameMode,
        category: word.category,
        won: true,
        guessCount: newGuesses.length,
        timeElapsed,
        coinsEarned,
        difficulty,
        playedAt: Date.now(),
      };

      // Save to local storage
      await addGameToHistory(historyEntry);
      
      // Try to save to API
      try {
        await addGameToHistoryAPI(historyEntry, newGuesses.map((g) => g.word));
      } catch (error) {
        console.warn("Failed to save game to backend:", error);
        // Continue anyway as it's saved locally
      }
    } else if (newGuesses.length >= 6) {
      setGameLost(true);
      setTimerActive(false);

      const gameMode = mode as GameMode;
      const difficulty = getDifficultyNumber(category || "Easy");

      const historyEntry = {
        word: word.word,
        gameMode,
        category: word.category,
        won: false,
        guessCount: newGuesses.length,
        timeElapsed,
        coinsEarned: 0,
        difficulty,
        playedAt: Date.now(),
      };

      // Save to local storage
      await addGameToHistory(historyEntry);
      
      // Try to save to API
      try {
        await addGameToHistoryAPI(historyEntry, newGuesses.map((g) => g.word));
      } catch (error) {
        console.warn("Failed to save game to backend:", error);
        // Continue anyway as it's saved locally
      }
    }
  };

  const handleRevealLetter = () => {
    if (!word || mode === "hardcore" || hintsRemaining.reveal === 0) return;
    if (!spendCoins(5)) {
      setMessage("Not enough coins (need 5)!");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const revealedIndices = new Set(
      guesses
        .flatMap((g) => g.result.map((r, j) => (r === "correct" ? j : -1)))
        .filter((j) => j !== -1),
    );

    let unrevealedIndex = -1;
    for (let i = 0; i < word.word.length; i++) {
      if (!revealedIndices.has(i)) {
        unrevealedIndex = i;
        break;
      }
    }

    if (unrevealedIndex !== -1) {
      const hint = word.word[unrevealedIndex];
      setMessage(`Letter ${unrevealedIndex + 1}: ${hint}`);
      setHintsRemaining((h) => ({ ...h, reveal: h.reveal - 1 }));
    }
  };

  const handleRevealPosition = () => {
    if (!word || mode === "hardcore" || hintsRemaining.position === 0) return;
    if (!spendCoins(10)) {
      setMessage("Not enough coins (need 10)!");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const correctLetters = word.word.split("");
    const revealedPositions = guesses
      .flatMap((g) => g.result.map((r, j) => (r === "correct" ? j : -1)))
      .filter((j) => j !== -1);

    const unrevealedPositions = correctLetters
      .map((_, i) => (!revealedPositions.includes(i) ? i : -1))
      .filter((i) => i !== -1);

    if (unrevealedPositions.length > 0) {
      const idx =
        unrevealedPositions[
          Math.floor(Math.random() * unrevealedPositions.length)
        ];
      setMessage(`Position ${idx + 1}: ${word.word[idx]}`);
      setHintsRemaining((h) => ({ ...h, position: h.position - 1 }));
    }
  };

  const handleEliminateLetters = () => {
    if (!word || mode === "hardcore" || hintsRemaining.eliminate === 0) return;
    if (!spendCoins(8)) {
      setMessage("Not enough coins (need 8)!");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const wordLetters = new Set(word.word.toUpperCase());
    const guessedLetters = new Set(
      guesses.flatMap((g) => g.word.toUpperCase()),
    );

    const wrongNotGuessed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("")
      .filter((l) => !wordLetters.has(l) && !guessedLetters.has(l));

    const toEliminate = wrongNotGuessed.slice(0, 3).join(", ");
    setMessage(`Not in word: ${toEliminate || "None new"}`);
    setHintsRemaining((h) => ({ ...h, eliminate: h.eliminate - 1 }));
  };

  if (!word) {
    return (
      <div className={styles.game}>
        <p>Loading...</p>
      </div>
    );
  }

  const gameMode = mode as GameMode;
  const timeRemaining = 300 - timeElapsed;
  const keyboardState = getKeyboardState(guesses);

  return (
    <div className={styles.game}>
      <header className={styles.gameHeader}>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          Back
        </button>
        <h2>
          {category} - {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}
        </h2>
        <div className={styles.headerStats}>
          <span>Coins: {coins}</span>
          {gameMode === "speed" && (
            <span className={styles.timer}>
              {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>
      </header>

      <main className={styles.gameMain}>
        <div className={styles.guesses}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.guessRow}>
              {guesses[i]
                ? guesses[i].word.split("").map((letter, j) => {
                    const result = guesses[i].result[j];
                    return (
                      <div
                        key={j}
                        className={`${styles.letter} ${styles[result]}`}
                      >
                        {letter.toUpperCase()}
                      </div>
                    );
                  })
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
          <>
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

            {gameMode !== "hardcore" && (
              <div className={styles.hints}>
                <button
                  onClick={handleRevealLetter}
                  disabled={hintsRemaining.reveal === 0}
                >
                  Reveal Letter (5 coins) {hintsRemaining.reveal}
                </button>
                <button
                  onClick={handleRevealPosition}
                  disabled={hintsRemaining.position === 0}
                >
                  Reveal Position (10 coins) {hintsRemaining.position}
                </button>
                <button
                  onClick={handleEliminateLetters}
                  disabled={hintsRemaining.eliminate === 0}
                >
                  Eliminate Letters (8 coins) {hintsRemaining.eliminate}
                </button>
              </div>
            )}

            <div className={styles.keyboard}>
              {KEYBOARD_ROWS.map((row) => (
                <div key={row} className={styles.keyboardRow}>
                  {row.split("").map((letter) => {
                    const state = keyboardState[letter];
                    return (
                      <span
                        key={letter}
                        className={`${styles.key} ${state ? styles[state] : ""}`}
                      >
                        {letter}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {message && <div className={styles.message}>{message}</div>}

        {gameWon && (
          <div className={styles.result}>
            <h3>You Won!</h3>
            <p>Guesses: {guesses.length}/6</p>
            <button onClick={() => navigate("/")} className={styles.nextButton}>
              Play Again
            </button>
          </div>
        )}

        {gameLost && (
          <div className={styles.result}>
            <h3>Game Over</h3>
            <p>
              The word was: <strong>{word.word}</strong>
            </p>
            <button onClick={() => navigate("/")} className={styles.nextButton}>
              Back to Menu
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
