import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStatistics } from "@/services/storage/gameHistoryDB";
import type { GameMode, Statistics as StatsType } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./styles/Stats.module.css";

export function Statistics() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode | "all">("all");
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const mode =
          selectedMode === "all" ? undefined : (selectedMode as GameMode);
        const data = await getStatistics(mode);
        setStats(data);
      } catch (error) {
        console.error("Failed to load statistics:", error);
      }
      setLoading(false);
    };
    loadStats();
  }, [selectedMode]);

  if (loading || !stats) {
    return (
      <div className={styles.stats}>
        <header className={styles.header}>
          <button onClick={() => navigate("/")} className={styles.backButton}>
            Back
          </button>
          <h1>Statistics</h1>
          <div></div>
        </header>
        <main className={styles.main}>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  const chartData = [
    { guesses: "1", count: stats.guessDistribution[1] || 0 },
    { guesses: "2", count: stats.guessDistribution[2] || 0 },
    { guesses: "3", count: stats.guessDistribution[3] || 0 },
    { guesses: "4", count: stats.guessDistribution[4] || 0 },
    { guesses: "5", count: stats.guessDistribution[5] || 0 },
    { guesses: "6", count: stats.guessDistribution[6] || 0 },
  ];

  const winRate =
    stats.totalGames > 0
      ? ((stats.wins / stats.totalGames) * 100).toFixed(1)
      : 0;

  return (
    <div className={styles.stats}>
      <header className={styles.header}>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          Back
        </button>
        <h1>Statistics</h1>
        <div></div>
      </header>

      <main className={styles.main}>
        <div className={styles.modeFilter}>
          <button
            className={`${styles.modeFilterButton} ${
              selectedMode === "all" ? styles.active : ""
            }`}
            onClick={() => setSelectedMode("all")}
          >
            All Games
          </button>
          <button
            className={`${styles.modeFilterButton} ${
              selectedMode === "classic" ? styles.active : ""
            }`}
            onClick={() => setSelectedMode("classic")}
          >
            Classic
          </button>
          <button
            className={`${styles.modeFilterButton} ${
              selectedMode === "speed" ? styles.active : ""
            }`}
            onClick={() => setSelectedMode("speed")}
          >
            Speed
          </button>
          <button
            className={`${styles.modeFilterButton} ${
              selectedMode === "hardcore" ? styles.active : ""
            }`}
            onClick={() => setSelectedMode("hardcore")}
          >
            Hardcore
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Played</div>
            <div className={styles.statValue}>{stats.totalGames}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Win Rate</div>
            <div className={styles.statValue}>{winRate}%</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Wins</div>
            <div className={styles.statValue}>{stats.wins}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Current Streak</div>
            <div className={styles.statValue}>{stats.currentStreak}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Longest Streak</div>
            <div className={styles.statValue}>{stats.longestStreak}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg. Guesses</div>
            <div className={styles.statValue}>
              {stats.averageGuesses.toFixed(2)}
            </div>
          </div>
        </div>

        {stats.totalGames > 0 && (
          <div className={styles.chartContainer}>
            <h2>Guess Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--cell-border)"
                />
                <XAxis dataKey="guesses" stroke="var(--text-color)" />
                <YAxis stroke="var(--text-color)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--cell-bg)",
                    border: `1px solid var(--cell-border)`,
                    color: "var(--text-color)",
                  }}
                />
                <Bar dataKey="count" fill="var(--correct-bg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.totalGames === 0 && (
          <div className={styles.emptyState}>
            <p>No games yet. Play a game to see statistics!</p>
          </div>
        )}
      </main>
    </div>
  );
}
