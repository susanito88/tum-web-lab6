import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { initWordsDB } from "@/services/storage/wordsDB";
import { initGameHistoryDB } from "@/services/storage/gameHistoryDB";
import { useTheme } from "@/hooks/useTheme";
import { Home } from "@/pages/Home";
import { GameComponent } from "@/components/Game/Game";
import { Statistics } from "@/pages/Statistics";
import { WordManager } from "@/pages/WordManager";
import { Settings } from "@/pages/Settings";
import "./App.css";

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game/:category/:mode" element={<GameComponent />} />
      <Route path="/stats" element={<Statistics />} />
      <Route path="/words" element={<WordManager />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

function App() {
  useTheme();

  useEffect(() => {
    // Initialize databases
    initWordsDB();
    initGameHistoryDB();
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
