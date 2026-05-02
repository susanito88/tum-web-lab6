import { useNavigate } from "react-router-dom";
import styles from "./styles/Stats.module.css";

export function Statistics() {
  const navigate = useNavigate();

  return (
    <div className={styles.stats}>
      <header className={styles.header}>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          ← Back
        </button>
        <h1>Statistics</h1>
        <div></div>
      </header>
      <main className={styles.main}>
        <p>Statistics dashboard coming soon...</p>
      </main>
    </div>
  );
}
