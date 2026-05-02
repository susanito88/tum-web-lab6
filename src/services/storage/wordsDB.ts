import { openDB } from "idb";
import type { Word } from "@/types";

let db: any = null;
let dictionaryCache: Set<string> | null = null;

const DB_NAME = "WordleDB";
const DB_VERSION = 2;

const WORD_ENCODING_TAG = "WDL1";

type StoredWord = Omit<Word, "word"> & { word: string };

function encodeWord(word: string): string {
  const payload = `${word.toUpperCase()}|${WORD_ENCODING_TAG}`;
  return btoa(payload).replace(/=+$/g, "");
}

function decodeWord(value: string): string {
  if (!value) return "";
  if (/^[A-Z]+$/.test(value)) return value;

  try {
    const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
    const decoded = atob(padded);

    if (decoded.endsWith(`|${WORD_ENCODING_TAG}`)) {
      return decoded.slice(0, decoded.lastIndexOf("|"));
    }

    if (/^[A-Z]+$/.test(decoded)) {
      return decoded;
    }

    return value.toUpperCase();
  } catch {
    return value.toUpperCase();
  }
}

function toPublicWord(stored: StoredWord): Word {
  return {
    ...stored,
    word: decodeWord(stored.word),
  };
}

export async function initWordsDB(): Promise<void> {
  if (db) return;

  db = await openDB(DB_NAME, DB_VERSION, {
    async upgrade(db: any, oldVersion: number, _newVersion: number, tx: any) {
      if (!db.objectStoreNames.contains("words")) {
        const store = db.createObjectStore("words", { keyPath: "id" });
        store.createIndex("by-category", "category");
        store.createIndex("by-isCustom", "isCustom");
      }

      // Migrate plain-text words from earlier versions.
      if (oldVersion < 2 && tx && db.objectStoreNames.contains("words")) {
        const store = tx.objectStore("words");
        let cursor = await store.openCursor();

        while (cursor) {
          const value = cursor.value as StoredWord;
          if (value?.word && /^[A-Z]+$/.test(value.word)) {
            value.word = encodeWord(value.word);
            await cursor.update(value);
          }
          cursor = await cursor.continue();
        }
      }
    },
  });

  await ensureDefaultWords();
}

const COMMON_WORDS = [
  "ABOUT",
  "ABOVE",
  "ABUSE",
  "ADAPT",
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
  "ASIDE",
  "ASSET",
  "AUDIO",
  "AVOID",
  "AWAKE",
  "AWARE",
  "BADLY",
  "BAKER",
  "BASIC",
  "BEACH",
  "BEGAN",
  "BEGIN",
  "BELOW",
  "BLACK",
  "BLAME",
  "BLEND",
  "BLIND",
  "BLOCK",
  "BLOOD",
  "BOARD",
  "BRAIN",
  "BRAND",
  "BRAVE",
  "BREAD",
  "BREAK",
  "BRING",
  "BROAD",
  "BROKE",
  "BROWN",
  "BUILD",
  "CABLE",
  "CARRY",
  "CATCH",
  "CAUSE",
  "CHAIN",
  "CHAIR",
  "CHART",
  "CHASE",
  "CHECK",
  "CHILD",
  "CLEAN",
  "CLEAR",
  "CLICK",
  "CLOCK",
  "CLOSE",
  "CLOUD",
  "COACH",
  "COAST",
  "COVER",
  "CRAFT",
  "CRASH",
  "CREAM",
  "CRIME",
  "CROSS",
  "CROWD",
  "CROWN",
  "DAILY",
  "DANCE",
  "DEALT",
  "DEATH",
  "DELAY",
  "DEPTH",
  "DRAFT",
  "DRAMA",
  "DREAM",
  "DRESS",
  "DRINK",
  "DRIVE",
  "EARTH",
  "EIGHT",
  "ENJOY",
  "ENTER",
  "ENTRY",
  "ERROR",
  "EVENT",
  "EVERY",
  "EXACT",
  "EXIST",
  "EXTRA",
  "FAITH",
  "FALSE",
  "FAVOR",
  "FIELD",
  "FIGHT",
  "FINAL",
  "FIRST",
  "FOCUS",
  "FORCE",
  "FRESH",
  "FRONT",
  "FRUIT",
  "GIANT",
  "GIVEN",
  "GLASS",
  "GLOBE",
  "GRACE",
  "GRADE",
  "GRAND",
  "GRANT",
  "GRASS",
  "GREAT",
  "GREEN",
  "GROUP",
  "GROWN",
  "GUARD",
  "GUESS",
  "GUEST",
  "GUIDE",
  "HAPPY",
  "HEART",
  "HEAVY",
  "HORSE",
  "HOTEL",
  "HOUSE",
  "HUMAN",
  "IDEAL",
  "IMAGE",
  "INDEX",
  "INNER",
  "INPUT",
  "ISSUE",
  "JOINT",
  "JUDGE",
  "KNIFE",
  "LARGE",
  "LASER",
  "LATER",
  "LAUGH",
  "LAYER",
  "LEARN",
  "LEAST",
  "LEAVE",
  "LIGHT",
  "LIMIT",
  "LOCAL",
  "LOGIC",
  "MAGIC",
  "MAJOR",
  "MAKER",
  "MARCH",
  "MATCH",
  "MAYBE",
  "METAL",
  "MIGHT",
  "MINOR",
  "MODEL",
  "MONEY",
  "MONTH",
  "MOTOR",
  "MOUTH",
  "MOVIE",
  "MUSIC",
  "NEVER",
  "NIGHT",
  "NOISE",
  "NORTH",
  "NOVEL",
  "NURSE",
  "OCEAN",
  "OFFER",
  "OFTEN",
  "ORDER",
  "OTHER",
  "OWNER",
  "PANEL",
  "PAPER",
  "PARTY",
  "PEACE",
  "PHASE",
  "PHONE",
  "PHOTO",
  "PIECE",
  "PILOT",
  "PIZZA",
  "PLACE",
  "PLAIN",
  "PLANE",
  "PLANT",
  "PLATE",
  "POINT",
  "POWER",
  "PRESS",
  "PRICE",
  "PRIDE",
  "PRIME",
  "PRINT",
  "PRIOR",
  "PRIZE",
  "PROOF",
  "PROUD",
  "QUEEN",
  "QUICK",
  "QUIET",
  "RADIO",
  "RAISE",
  "RANGE",
  "RAPID",
  "RATIO",
  "REACH",
  "REACT",
  "READY",
  "RELAX",
  "REPLY",
  "RIGHT",
  "RIVER",
  "ROUGH",
  "ROUND",
  "ROUTE",
  "ROYAL",
  "RURAL",
  "SCALE",
  "SCENE",
  "SCOPE",
  "SCORE",
  "SENSE",
  "SERVE",
  "SEVEN",
  "SHALL",
  "SHAPE",
  "SHARE",
  "SHIFT",
  "SHINE",
  "SHIRT",
  "SHOCK",
  "SHORT",
  "SHOWN",
  "SIGHT",
  "SINCE",
  "SKILL",
  "SLEEP",
  "SLICE",
  "SMALL",
  "SMART",
  "SMILE",
  "SMOKE",
  "SOLID",
  "SOLVE",
  "SOUND",
  "SOUTH",
  "SPACE",
  "SPARE",
  "SPEAK",
  "SPEED",
  "SPEND",
  "SPLIT",
  "SPOKE",
  "SPORT",
  "STAFF",
  "STAGE",
  "STAND",
  "START",
  "STATE",
  "STEEL",
  "STICK",
  "STILL",
  "STOCK",
  "STONE",
  "STORE",
  "STORY",
  "STRIP",
  "STYLE",
  "SUGAR",
  "TABLE",
  "TAKEN",
  "TASTE",
  "TEACH",
  "THANK",
  "THEIR",
  "THEME",
  "THERE",
  "THICK",
  "THING",
  "THINK",
  "THIRD",
  "THOSE",
  "THREE",
  "THROW",
  "TIGHT",
  "TIMES",
  "TIRED",
  "TITLE",
  "TODAY",
  "TOPIC",
  "TOTAL",
  "TOUCH",
  "TOUGH",
  "TOWER",
  "TRACK",
  "TRADE",
  "TRAIN",
  "TREAT",
  "TREND",
  "TRIAL",
  "TRUCK",
  "TRULY",
  "TRUST",
  "TRUTH",
  "TWICE",
  "UNDER",
  "UNION",
  "UNITY",
  "UNTIL",
  "UPPER",
  "URBAN",
  "USAGE",
  "VALUE",
  "VIDEO",
  "VISIT",
  "VOICE",
  "WASTE",
  "WATCH",
  "WATER",
  "WHEEL",
  "WHERE",
  "WHICH",
  "WHILE",
  "WHITE",
  "WHOLE",
  "WOMAN",
  "WORLD",
  "WORRY",
  "WORTH",
  "WRITE",
  "WRONG",
  "YOUTH",
] as const;

const DEFAULT_WORDS: Record<Word["category"], string[]> = {
  Easy: COMMON_WORDS.slice(0, 110),
  Medium: COMMON_WORDS.slice(110, 220),
  Hard: COMMON_WORDS.slice(220, 330),
  Extreme: COMMON_WORDS.slice(330),
};

const DEFAULT_WORDS_ENCODED = Object.fromEntries(
  Object.entries(DEFAULT_WORDS).map(([category, words]) => [
    category,
    words.map((word) => encodeWord(word)),
  ]),
) as Record<Word["category"], string[]>;

async function ensureDefaultWords(): Promise<void> {
  if (!db) return;

  const tx = db.transaction("words", "readwrite");
  const now = Date.now();

  for (const [category, encodedWords] of Object.entries(
    DEFAULT_WORDS_ENCODED,
  )) {
    for (const encodedWord of encodedWords) {
      const decodedWord = decodeWord(encodedWord);
      const id = `${category.toLowerCase()}-${decodedWord.toLowerCase()}`;
      const existing = await tx.store.get(id);
      if (!existing) {
        const wordObj: StoredWord = {
          id,
          word: encodedWord,
          category: category as Word["category"],
          length: decodedWord.length,
          liked: false,
          addedAt: now,
          isCustom: false,
        };
        await tx.store.put(wordObj);
      }
    }
  }

  await tx.done;
}

export async function addWord(
  word: Omit<Word, "id" | "addedAt">,
): Promise<Word> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const normalizedWord = word.word.trim().toUpperCase();

  const wordObj: StoredWord = {
    ...word,
    word: encodeWord(normalizedWord),
    id: `custom-${Date.now()}`,
    addedAt: Date.now(),
  };

  await db.add("words", wordObj);
  dictionaryCache = null;
  return {
    ...wordObj,
    word: normalizedWord,
  };
}

export async function deleteWord(id: string): Promise<void> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const word = (await db.get("words", id)) as StoredWord | undefined;
  if (!word) throw new Error("Word not found");
  if (!word.isCustom) throw new Error("Cannot delete default words");

  await db.delete("words", id);
  dictionaryCache = null;
}

export async function getWordsByCategory(
  category: Word["category"],
): Promise<Word[]> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const allWords = (await db.getAllFromIndex(
    "words",
    "by-category",
    category,
  )) as StoredWord[];
  return allWords.map(toPublicWord);
}

export async function getRandomWord(category: Word["category"]): Promise<Word> {
  const words = await getWordsByCategory(category);
  if (words.length === 0) throw new Error("No words available");
  return words[Math.floor(Math.random() * words.length)];
}

export async function toggleLike(id: string): Promise<void> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const word = (await db.get("words", id)) as StoredWord | undefined;
  if (!word) throw new Error("Word not found");

  word.liked = !word.liked;
  await db.put("words", word);
}

export async function getAllWords(): Promise<Word[]> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const words = (await db.getAll("words")) as StoredWord[];
  return words.map(toPublicWord);
}

export async function isWordInDictionary(word: string): Promise<boolean> {
  const normalized = word.trim().toUpperCase();
  if (!normalized) return false;

  if (!dictionaryCache) {
    const words = await getAllWords();
    dictionaryCache = new Set(words.map((w) => w.word.toUpperCase()));
  }

  return dictionaryCache.has(normalized);
}
