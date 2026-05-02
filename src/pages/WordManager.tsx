import { useNavigate } from "react-router-dom";
import styles from "./styles/WordManager.module.css";

export function WordManager() {
  const navigate = useNavigate();

  return (
    <div className={styles.wordManager}>
      <header className={styles.header}>
        <button onClick={() => navigate("/")} className={styles.backButton}>
          ← Back
        </button>
        <h1>Word Manager</h1>
        <div></div>
      </header>
      <main className={styles.main}>
        <p>Word manager coming soon...</p>
      </main>
    </div>
  );
}
