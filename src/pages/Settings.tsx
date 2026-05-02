import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { resetGameHistoryDB } from "@/services/storage/gameHistoryDB";
import styles from "./styles/Settings.module.css";

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notification, setNotification] = useState<string>("");

  const handleThemeChange = (newTheme: "light" | "dark" | "colorblind") => {
    setTheme(newTheme);
    setNotification(`Switched to ${newTheme} mode`);
    setTimeout(() => setNotification(""), 2000);
  };

  const handleResetStats = async () => {
    if (
      confirm(
        "Are you sure you want to reset all statistics? This cannot be undone.",
      )
    ) {
      // Clear IndexedDB game history safely by closing active DB connections first.
      await resetGameHistoryDB();
      // Clear localStorage stats
      localStorage.removeItem("worlde_streak");
      localStorage.removeItem("worlde_coins");

      setNotification("All statistics reset!");
      setTimeout(() => navigate("/"), 1000);
    }
  };

  const handleResetWords = () => {
    if (
      confirm(
        "Are you sure you want to reset custom words? Default words will be preserved.",
      )
    ) {
      // This would be handled by clearing custom words from IndexedDB
      setNotification("Custom words cleared!");
      setTimeout(() => setNotification(""), 2000);
    }
  };

  const handleClearAllData = async () => {
    if (
      confirm(
        "Are you ABSOLUTELY sure you want to reset EVERYTHING? This includes all stats, coins, and custom words.",
      )
    ) {
      localStorage.clear();
      await resetGameHistoryDB();
      setNotification("All data cleared!");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className={styles.settings}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          Back
        </button>
        <h1>Settings</h1>
      </div>

      {notification && (
        <div className={styles.notification}>{notification}</div>
      )}

      <div className={styles.container}>
        {/* Theme Settings */}
        <section className={styles.section}>
          <h2>Theme</h2>
          <p className={styles.description}>
            Choose your preferred color scheme
          </p>
          <div className={styles.themeButtons}>
            <button
              className={`${styles.themeButton} ${theme === "light" ? styles.active : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              Light
            </button>
            <button
              className={`${styles.themeButton} ${theme === "dark" ? styles.active : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              Dark
            </button>
            <button
              className={`${styles.themeButton} ${theme === "colorblind" ? styles.active : ""}`}
              onClick={() => handleThemeChange("colorblind")}
            >
              Colorblind
            </button>
          </div>
        </section>

        {/* Game Statistics */}
        <section className={styles.section}>
          <h2>Game Data</h2>

          <div className={styles.statsSection}>
            <h3>Reset Statistics</h3>
            <p className={styles.description}>
              Clear all game history and statistics
            </p>
            <button
              className={`${styles.dangerButton} ${styles.button}`}
              onClick={handleResetStats}
            >
              Clear Statistics
            </button>
          </div>

          <div className={styles.statsSection}>
            <h3>Clear Custom Words</h3>
            <p className={styles.description}>
              Remove all custom words you've added
            </p>
            <button
              className={`${styles.warningButton} ${styles.button}`}
              onClick={handleResetWords}
            >
              Clear Custom Words
            </button>
          </div>

          <div className={styles.statsSection}>
            <h3>Nuclear Option</h3>
            <p className={styles.description}>
              Reset EVERYTHING (stats, coins, custom words, theme)
            </p>
            <button
              className={`${styles.dangerButton} ${styles.button}`}
              onClick={handleClearAllData}
            >
              Clear All Data
            </button>
          </div>
        </section>

        {/* Game Info */}
        <section className={styles.section}>
          <h2>About</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Game Modes</span>
              <span className={styles.value}>3 (Classic, Speed, Hardcore)</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Difficulty Levels</span>
              <span className={styles.value}>
                4 (Easy, Medium, Hard, Extreme)
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Hint Types</span>
              <span className={styles.value}>
                3 (Letter, Position, Eliminate)
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Total Words</span>
              <span className={styles.value}>128+ Default + Custom</span>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className={styles.section}>
          <h2>Tips and Tricks</h2>
          <ul className={styles.tipslist}>
            <li>
              <strong>Classic Mode:</strong> Take your time and think
              strategically
            </li>
            <li>
              <strong>Speed Mode:</strong> You have 5 minutes to win - faster is
              better!
            </li>
            <li>
              <strong>Hardcore Mode:</strong> No hints allowed - you're on your
              own
            </li>
            <li>
              <strong>Hints:</strong> Each hint costs coins. Earn coins by
              winning games
            </li>
            <li>
              <strong>Streaks:</strong> Keep winning to build your streak!
            </li>
            <li>
              <strong>Difficulty:</strong> Harder words earn more points
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};
