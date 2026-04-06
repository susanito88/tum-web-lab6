import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Word } from '@/types';
import {
  getAllWords,
  addWord,
  deleteWord,
  toggleLike,
  getWordsByCategory,
} from '@/services/storage/wordsDB';
import styles from './styles/WordManager.module.css';

export function WordManager() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Word['category']>('Easy');
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState('');
  const [newWord, setNewWord] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadWords();
  }, [selectedCategory]);

  const loadWords = async () => {
    try {
      const categoryWords = await getWordsByCategory(selectedCategory);
      setWords(categoryWords);
    } catch (error) {
      console.error('Failed to load words:', error);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim().length !== 5) {
      setMessage('Word must be exactly 5 letters');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    try {
      await addWord({
        word: newWord.toUpperCase(),
        category: selectedCategory,
        length: 5,
        liked: false,
        isCustom: true,
      });
      setNewWord('');
      setMessage('Word added successfully!');
      loadWords();
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Failed to add word:', error);
      setMessage('Failed to add word');
    }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      await deleteWord(id);
      loadWords();
      setMessage('Word deleted');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Failed to delete word:', error);
      setMessage('Can only delete custom words');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      await toggleLike(id);
      loadWords();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const filteredWords = words.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase())
  );

  const customWords = filteredWords.filter((w) => w.isCustom);
  const defaultWords = filteredWords.filter((w) => !w.isCustom);

  return (
    <div className={styles.wordManager}>
      <header className={styles.header}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          ← Back
        </button>
        <h1>Word Manager</h1>
        <div></div>
      </header>

      <main className={styles.main}>
        <div className={styles.categoryTabs}>
          {(['Easy', 'Medium', 'Hard', 'Extreme'] as const).map((cat) => (
            <button
              key={cat}
              className={`${styles.tab} ${selectedCategory === cat ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <form className={styles.addForm} onSubmit={handleAddWord}>
          <input
            type="text"
            maxLength={5}
            value={newWord}
            onChange={(e) => setNewWord(e.target.value.toUpperCase())}
            placeholder="Add new 5-letter word..."
            className={styles.input}
          />
          <button type="submit" className={styles.addButton}>
            Add Word
          </button>
        </form>

        {message && <div className={styles.message}>{message}</div>}

        <div className={styles.searchBox}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words..."
            className={styles.searchInput}
          />
        </div>

        {customWords.length > 0 && (
          <section className={styles.section}>
            <h2>Custom Words ({customWords.length})</h2>
            <div className={styles.wordsList}>
              {customWords.map((word) => (
                <div key={word.id} className={styles.wordCard}>
                  <div className={styles.wordText}>{word.word}</div>
                  <div className={styles.wordActions}>
                    <button
                      onClick={() => handleToggleLike(word.id)}
                      className={styles.likeButton}
                    >
                      {word.liked ? '❤️' : '🤍'}
                    </button>
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      className={styles.deleteButton}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {defaultWords.length > 0 && (
          <section className={styles.section}>
            <h2>Default Words ({defaultWords.length})</h2>
            <div className={styles.wordsList}>
              {defaultWords.map((word) => (
                <div key={word.id} className={styles.wordCard}>
                  <div className={styles.wordText}>{word.word}</div>
                  <button
                    onClick={() => handleToggleLike(word.id)}
                    className={styles.likeButton}
                  >
                    {word.liked ? '❤️' : '🤍'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {filteredWords.length === 0 && (
          <div className={styles.emptyState}>
            <p>No words found</p>
          </div>
        )}
      </main>
    </div>
  );
}
