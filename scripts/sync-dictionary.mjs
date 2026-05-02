import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import wordListPath from "word-list";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(
  repoRoot,
  "public",
  "dictionaries",
  "english-5-v1.json",
);

const PLAYABLE_PER_CATEGORY = 700;

const RARE_LETTER_WEIGHTS = {
  J: 5,
  Q: 7,
  X: 6,
  Z: 7,
  K: 4,
  V: 3,
  W: 2,
  Y: 2,
  F: 2,
};

function hashWord(word) {
  let hash = 2166136261;
  for (let i = 0; i < word.length; i += 1) {
    hash ^= word.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function scoreWord(word) {
  const letters = word.split("");
  const uniqueCount = new Set(letters).size;
  const duplicates = letters.length - uniqueCount;
  const vowelCount = letters.filter((ch) => "AEIOU".includes(ch)).length;
  const rareScore = letters.reduce(
    (sum, ch) => sum + (RARE_LETTER_WEIGHTS[ch] ?? 0),
    0,
  );

  let score = 0;
  score += rareScore;
  score += duplicates * 1.5;
  score += vowelCount <= 1 ? 2 : 0;
  score += vowelCount >= 4 ? 1 : 0;

  return score;
}

function chunkByDifficulty(sortedWords) {
  const quarter = Math.floor(sortedWords.length / 4);

  return {
    Easy: sortedWords.slice(0, quarter),
    Medium: sortedWords.slice(quarter, quarter * 2),
    Hard: sortedWords.slice(quarter * 2, quarter * 3),
    Extreme: sortedWords.slice(quarter * 3),
  };
}

function pickPlayableWords(wordsByCategory) {
  return {
    Easy: wordsByCategory.Easy.slice(0, PLAYABLE_PER_CATEGORY),
    Medium: wordsByCategory.Medium.slice(0, PLAYABLE_PER_CATEGORY),
    Hard: wordsByCategory.Hard.slice(0, PLAYABLE_PER_CATEGORY),
    Extreme: wordsByCategory.Extreme.slice(0, PLAYABLE_PER_CATEGORY),
  };
}

async function main() {
  const raw = await readFile(wordListPath, "utf8");

  const allFiveLetterWords = Array.from(
    new Set(
      raw
        .split(/\r?\n/)
        .map((w) => w.trim().toUpperCase())
        .filter((w) => /^[A-Z]{5}$/.test(w)),
    ),
  );

  const sortedByDifficulty = allFiveLetterWords
    .map((word) => ({
      word,
      score: scoreWord(word),
      tieBreaker: hashWord(word),
    }))
    .sort((a, b) => a.score - b.score || a.tieBreaker - b.tieBreaker)
    .map((entry) => entry.word);

  const wordsByCategory = chunkByDifficulty(sortedByDifficulty);
  const playableWords = pickPlayableWords(wordsByCategory);

  const payload = {
    version: "2.1.0",
    source: "word-list (npm)",
    generatedAt: new Date().toISOString(),
    stats: {
      totalValidWords: allFiveLetterWords.length,
      playablePerCategory: PLAYABLE_PER_CATEGORY,
      totalPlayableWords:
        playableWords.Easy.length +
        playableWords.Medium.length +
        playableWords.Hard.length +
        playableWords.Extreme.length,
    },
    validWords: allFiveLetterWords,
    categories: playableWords,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `Dictionary generated: ${allFiveLetterWords.length} valid words, ${payload.stats.totalPlayableWords} playable words`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
