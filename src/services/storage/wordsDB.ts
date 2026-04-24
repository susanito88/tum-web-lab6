import { openDB } from "idb";
import type { Word } from "@/types";

let db: any = null;
let dictionaryCache: Set<string> | null = null;

const DB_NAME = "WordleDB";
const DB_VERSION = 2;

const WORD_ENCODING_TAG = "WDL1";
const WORD_CIPHER_TAG = "WDL2";
const KEY_MATERIAL = "wordle-client-dictionary-key-v1";
const KEY_SALT = "wordle-client-dictionary-salt-v1";

type StoredWord = Omit<Word, "word"> & { word: string };
let encryptionKeyPromise: Promise<CryptoKey> | null = null;

function normalizeCategory(
  category: string | undefined,
): Word["category"] | null {
  if (!category) return null;

  const normalized = category.trim().toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";
  if (normalized === "extreme") return "Extreme";
  return null;
}

function inferCategoryFromId(id: string | undefined): Word["category"] | null {
  if (!id) return null;

  if (id.startsWith("easy-")) return "Easy";
  if (id.startsWith("medium-")) return "Medium";
  if (id.startsWith("hard-")) return "Hard";
  if (id.startsWith("extreme-")) return "Extreme";
  return null;
}

function resolveCategory(
  category: string | undefined,
  id: string | undefined,
): Word["category"] | null {
  return normalizeCategory(category) ?? inferCategoryFromId(id);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/=+$/g, "");
}

function fromBase64(value: string): Uint8Array {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function isEncryptedWord(value: string): boolean {
  return value.startsWith(`${WORD_CIPHER_TAG}:`);
}

async function getEncryptionKey(): Promise<CryptoKey> {
  if (!encryptionKeyPromise) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(KEY_MATERIAL),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    encryptionKeyPromise = crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: enc.encode(KEY_SALT),
        iterations: 120000,
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  return encryptionKeyPromise;
}

function encodeLegacyWord(word: string): string {
  const payload = `${word.toUpperCase()}|${WORD_ENCODING_TAG}`;
  return btoa(payload).replace(/=+$/g, "");
}

function decodeLegacyWord(value: string): string {
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

async function encryptWord(word: string): Promise<string> {
  const normalized = word.trim().toUpperCase();
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(normalized);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(data),
  );

  return `${WORD_CIPHER_TAG}:${toBase64(iv)}:${toBase64(new Uint8Array(encrypted))}`;
}

async function decryptWord(value: string): Promise<string> {
  if (!value) return "";

  if (isEncryptedWord(value)) {
    try {
      const [tag, ivEncoded, payloadEncoded] = value.split(":");
      if (tag !== WORD_CIPHER_TAG || !ivEncoded || !payloadEncoded) {
        return value.toUpperCase();
      }

      const iv = fromBase64(ivEncoded);
      const payload = fromBase64(payloadEncoded);
      const key = await getEncryptionKey();
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: toArrayBuffer(iv) },
        key,
        toArrayBuffer(payload),
      );

      return new TextDecoder().decode(decrypted).toUpperCase();
    } catch {
      return value.toUpperCase();
    }
  }

  return decodeLegacyWord(value);
}

async function toPublicWord(stored: StoredWord): Promise<Word> {
  return {
    ...stored,
    word: await decryptWord(stored.word),
  };
}

async function migrateWordsToEncryption(): Promise<void> {
  if (!db) return;

  const tx = db.transaction("words", "readwrite");
  let cursor = await tx.store.openCursor();

  while (cursor) {
    const value = cursor.value as StoredWord;
    let needsUpdate = false;

    if (value?.word && !isEncryptedWord(value.word)) {
      const plainWord = await decryptWord(value.word);
      value.word = await encryptWord(plainWord);
      needsUpdate = true;
    }

    const normalizedCategory = resolveCategory(
      value?.category as string,
      value?.id,
    );
    if (normalizedCategory && value.category !== normalizedCategory) {
      value.category = normalizedCategory;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await cursor.update(value);
    }

    cursor = await cursor.continue();
  }

  await tx.done;
  dictionaryCache = null;
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
            value.word = encodeLegacyWord(value.word);
            await cursor.update(value);
          }
          cursor = await cursor.continue();
        }
      }
    },
  });

  await ensureDefaultWords();
  await migrateWordsToEncryption();
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

async function ensureDefaultWords(): Promise<void> {
  if (!db) return;

  const tx = db.transaction("words", "readwrite");
  const now = Date.now();
  let changedAny = false;

  for (const [category, words] of Object.entries(DEFAULT_WORDS)) {
    for (const plainWord of words) {
      const normalizedWord = plainWord.toUpperCase();
      const id = `${category.toLowerCase()}-${normalizedWord.toLowerCase()}`;
      const existing = (await tx.store.get(id)) as StoredWord | undefined;
      if (!existing) {
        const wordObj: StoredWord = {
          id,
          word: await encryptWord(normalizedWord),
          category: category as Word["category"],
          length: normalizedWord.length,
          liked: false,
          addedAt: now,
          isCustom: false,
        };
        await tx.store.put(wordObj);
        changedAny = true;
      } else {
        let needsUpdate = false;
        const resolvedCategory = resolveCategory(
          existing.category as string,
          existing.id,
        );

        if (resolvedCategory !== category) {
          existing.category = category as Word["category"];
          needsUpdate = true;
        }

        if (existing.length !== normalizedWord.length) {
          existing.length = normalizedWord.length;
          needsUpdate = true;
        }

        if (existing.isCustom) {
          existing.isCustom = false;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await tx.store.put(existing);
          changedAny = true;
        }
      }
    }
  }

  await tx.done;
  if (changedAny) {
    dictionaryCache = null;
  }
}

export async function addWord(
  word: Omit<Word, "id" | "addedAt">,
): Promise<Word> {
  if (!db) await initWordsDB();
  if (!db) throw new Error("Failed to initialize DB");

  const normalizedWord = word.word.trim().toUpperCase();

  const wordObj: StoredWord = {
    ...word,
    word: await encryptWord(normalizedWord),
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

  let allWords: StoredWord[] = [];

  try {
    allWords = (await db.getAllFromIndex(
      "words",
      "by-category",
      category,
    )) as StoredWord[];
  } catch {
    const fallbackWords = (await db.getAll("words")) as StoredWord[];
    allWords = fallbackWords.filter((w) => {
      const normalizedCategory = resolveCategory(w.category as string, w.id);
      return normalizedCategory === category;
    });
  }

  // Recover if defaults were removed or storage got cleared while the app was open.
  if (allWords.length === 0) {
    await ensureDefaultWords();
    try {
      allWords = (await db.getAllFromIndex(
        "words",
        "by-category",
        category,
      )) as StoredWord[];
    } catch {
      const fallbackWords = (await db.getAll("words")) as StoredWord[];
      allWords = fallbackWords.filter((w) => {
        const normalizedCategory = resolveCategory(w.category as string, w.id);
        return normalizedCategory === category;
      });
    }
  }

  return Promise.all(allWords.map(toPublicWord));
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
  return Promise.all(words.map(toPublicWord));
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
