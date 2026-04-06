import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import styles from "./styles/Settings.module.css";

export function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.settings}>
      <header className={styles.header}>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          ← Back
        </button>
        <h1>Settings</h1>
        <div></div>
      </header>
      <main className={styles.main}>
        <section className={styles.section}>
          <h2>Theme</h2>
          <div className={styles.themeOptions}>
            {(["light", "dark", "colorblind"] as const).map((t) => (
              <button
                key={t}
                className={`${styles.themeButton} ${theme === t ? styles.active : ""}`}
                onClick={() => setTheme(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
