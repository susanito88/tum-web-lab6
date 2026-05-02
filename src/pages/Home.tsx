import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Word, GameMode } from "@/types";
import { useCoins } from "@/hooks/useCoins";
import styles from "./styles/Home.module.css";

const CATEGORIES = ["Easy", "Medium", "Hard", "Extreme"] as const;

export function Home() {
  const navigate = useNavigate();
  const { coins } = useCoins();
  const [selectedCategory, setSelectedCategory] =
    useState<Word["category"]>("Easy");
  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");
  const [showInfo, setShowInfo] = useState(false);

  const handleStartGame = () => {
    navigate(`/game/${selectedCategory}/${selectedMode}`);
  };

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <h1>Wordle</h1>
        <div className={styles.headerInfo}>
          <div className={styles.coins}>Coins: {coins}</div>
          <button
            className={styles.navButton}
            onClick={() => navigate("/stats")}
            title="Statistics"
          >
            Stats
          </button>
          <button
            className={styles.navButton}
            onClick={() => navigate("/words")}
            title="Manage Words"
          >
            Words
          </button>
          <button
            className={styles.navButton}
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            Settings
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <button
          className={styles.infoButton}
          onClick={() => setShowInfo(true)}
          title="How scoring and modes work"
          aria-label="Show game rules and scoring info"
        >
          i
        </button>

        <section className={styles.section}>
          <h2>Select Difficulty</h2>
          <div className={styles.grid}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={`${styles.card} ${
                  selectedCategory === category ? styles.active : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                <div className={styles.cardTitle}>{category}</div>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Select Game Mode</h2>
          <div className={styles.gameModes}>
            <div
              className={`${styles.mode} ${
                selectedMode === "classic" ? styles.active : ""
              }`}
              onClick={() => setSelectedMode("classic")}
            >
              <h3>Classic</h3>
              <p>6 guesses to find the 5-letter word</p>
            </div>
            <div
              className={`${styles.mode} ${
                selectedMode === "speed" ? styles.active : ""
              }`}
              onClick={() => setSelectedMode("speed")}
            >
              <h3>Speed</h3>
              <p>Race against the clock!</p>
            </div>
            <div
              className={`${styles.mode} ${
                selectedMode === "hardcore" ? styles.active : ""
              }`}
              onClick={() => setSelectedMode("hardcore")}
            >
              <h3>Hardcore</h3>
              <p>Shows only if letters exist, not positions</p>
            </div>
          </div>
        </section>

        <button className={styles.startButton} onClick={handleStartGame}>
          Start Game
        </button>
      </main>

      {showInfo && (
        <div
          className={styles.infoOverlay}
          onClick={() => setShowInfo(false)}
          role="presentation"
        >
          <div
            className={styles.infoModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Game rules and scoring"
          >
            <div className={styles.infoModalHeader}>
              <h3>Quick Rules</h3>
              <button
                className={styles.infoClose}
                onClick={() => setShowInfo(false)}
                aria-label="Close info"
              >
                x
              </button>
            </div>

            <div className={styles.infoContent}>
              <p>
                Win a game to earn coins. Faster solves and harder modes give
                more.
              </p>
              <p>
                Coins formula: floor((10 + guess bonus + difficulty bonus) x
                mode multiplier)
              </p>
              <p>Guess bonus: (6 - guesses used) x 2</p>
              <p>
                Difficulty bonus: Easy +5, Medium +10, Hard +15, Extreme +20
              </p>
              <p>Mode multiplier: Classic x1.0, Speed x1.2, Hardcore x1.5</p>

              <h4>Game Modes</h4>
              <p>Classic: 6 guesses, normal feedback.</p>
              <p>Speed: same rules, but with a 5-minute timer.</p>
              <p>
                Hardcore: correct letters are not shown by exact position
                (harder feedback).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
