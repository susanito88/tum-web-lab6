import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Word, GameMode } from "@/types";
import { getWordsByCategory } from "@/services/storage/wordsDB";
import { useCoins } from "@/hooks/useCoins";
import styles from "./styles/Home.module.css";

const CATEGORIES = ["Easy", "Medium", "Hard", "Extreme"] as const;

export function Home() {
  const navigate = useNavigate();
  const { coins } = useCoins();
  const [selectedCategory, setSelectedCategory] =
    useState<Word["category"]>("Easy");
  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");

  const handleStartGame = async () => {
    const words = await getWordsByCategory(selectedCategory);
    if (words.length === 0) {
      alert("No words available in this category");
      return;
    }
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
    </div>
  );
}
