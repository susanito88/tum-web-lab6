import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Word } from "@/types";

interface WordsDB extends DBSchema {
  words: {
    key: string;
    value: Word;
    indexes: {
      "by-category": Word["category"];
      "by-isCustom": boolean;
    };
  };
}

let db: IDBPDatabase<WordsDB> | null = null;

const DB_NAME = "WordleDB";
const DB_VERSION = 1;

export async function initWordsDB(): Promise<void> {
  if (db) return;

  db = await openDB<WordsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("words")) {
        const store = db.createObjectStore("words", { keyPath: "id" });
        store.createIndex("by-category", "category");
        store.createIndex("by-isCustom", "isCustom");
      }
    },
  });

  // Initialize with default words if empty
  const count = await db.count("words");
  if (count === 0) {
    await initializeDefaultWords();
  }
}

const DEFAULT_WORDS = {
  Easy: [
    "ABOUT",
    "ABOVE",
    "ABUSE",
    "ADMIT",
    "ADOPT",
    "ADULT",
    "AFTER",
    "AGAIN",
    "AGENT",
    "AGREE",
    "AHEAD",
    "ALARM",
    "ALBUM",
    "ALERT",
    "ALIKE",
    "ALIVE",
    "ALLOW",
    "ALONE",
    "ALONG",
    "ALTER",
    "ANGEL",
    "ANGER",
    "ANGLE",
    "ANGRY",
    "APART",
    "APPLE",
    "APPLY",
    "ARENA",
    "ARGUE",
    "ARISE",
    "ARRAY",
    "ARROW",
  ],
  Medium: [
    "BADGE",
    "BADLY",
    "BAGEL",
    "BAKER",
    "BANJO",
    "BARON",
    "BEACH",
    "BEAST",
    "BLANK",
    "BOARD",
    "BOOST",
    "BOOTH",
    "BOXER",
    "BRAIN",
    "BRAND",
    "BRAVE",
    "BREAD",
    "BREAK",
    "BREED",
    "BRIEF",
    "BRING",
    "BROAD",
    "BROKE",
    "BROWN",
    "BUILD",
    "BULK",
    "BUYER",
    "CABLE",
    "CABIN",
    "CAGED",
    "CAMEL",
    "CANAL",
  ],
  Hard: [
    "DAZED",
    "DEALT",
    "DEATH",
    "DECAL",
    "DECAY",
    "DECOR",
    "DEFER",
    "DEITY",
    "DELAY",
    "DELTA",
    "DELVE",
    "DEMON",
    "DENSE",
    "DEPOT",
    "DEPTH",
    "DERBY",
    "DETER",
    "DETOX",
    "DEUCE",
    "DIARY",
    "DICED",
    "DICER",
    "DICKY",
    "DICOT",
    "DIGIT",
    "DILLY",
    "DIMLY",
    "DINER",
    "DINKY",
    "DIODE",
    "DIOPT",
    "DIPSY",
  ],
  Extreme: [
    "FJORD",
    "GLYPH",
    "PSYCH",
    "NYMPH",
    "LYMPH",
    "MYRRH",
    "MYTHS",
    "PROXY",
    "CRWTH",
    "WRYLY",
    "SYZYGY",
    "WHIZZ",
    "JAZZY",
    "FUZZY",
    "DIZZY",
    "FIZZY",
    "BOZOS",
    "BONZE",
    "PZAZZ",
    "RAZZED",
    "TUXEDO",
    "VEXED",
    "BOXED",
    "HEXED",
  ],
};

async function initializeDefaultWords(): Promise<void> {
  if (!db) return;

  const tx = db.transaction("words", "readwrite");
  const now = Date.now();

  for (const [category, words] of Object.entries(DEFAULT_WORDS)) {
    for (const word of words) {
      const wordObj: Word = {
        id: `${category.toLowerCase()}-${word.toLowerCase()}`,
        word: word.toUpperCase(),
        category: category as Word["category"],
        length: word.length,
        liked: false,
        addedAt: now,
        isCustom: false,
      };
      await tx.store.put(wordObj);
    }
  }

  await tx.done;
}

export async function addWord(
  word: Omit<Word, "id" | "addedAt">,
): Promise<Word> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const wordObj: Word = {
    ...word,
    id: `${word.category.toLowerCase()}-${word.word.toLowerCase()}-${Date.now()}`,
    addedAt: Date.now(),
  };

  await db.put("words", wordObj);
  return wordObj;
}

export async function deleteWord(id: string): Promise<void> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const word = await db.get("words", id);
  if (word && !word.isCustom) {
    throw new Error("Cannot delete default words");
  }

  await db.delete("words", id);
}

export async function getWordsByCategory(
  category: Word["category"],
): Promise<Word[]> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  return db.getAllFromIndex("words", "by-category", category);
}

export async function getAllWords(): Promise<Word[]> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  return db.getAll("words");
}

export async function updateWord(
  id: string,
  updates: Partial<Word>,
): Promise<Word> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const word = await db.get("words", id);
  if (!word) throw new Error("Word not found");

  const updatedWord: Word = { ...word, ...updates, id };
  await db.put("words", updatedWord);
  return updatedWord;
}

export async function toggleLike(id: string): Promise<Word> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const word = await db.get("words", id);
  if (!word) throw new Error("Word not found");

  word.liked = !word.liked;
  await db.put("words", word);
  return word;
}

export async function getRandomWord(category: Word["category"]): Promise<Word> {
  const words = await getWordsByCategory(category);
  if (words.length === 0) throw new Error(`No words found in ${category}`);
  return words[Math.floor(Math.random() * words.length)];
}

export async function searchWords(
  query: string,
  category?: Word["category"],
): Promise<Word[]> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  let words: Word[] = [];
  if (category) {
    words = await getWordsByCategory(category);
  } else {
    words = await db.getAll("words");
  }

  const lowerQuery = query.toLowerCase();
  return words.filter((w) => w.word.toLowerCase().includes(lowerQuery));
}
