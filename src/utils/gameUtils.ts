import { Guess, LetterResult } from '@/types';

// Word validation
export function isValidWord(word: string): boolean {
  const VALID_WORDS = new Set([
    'ABOUT', 'ABOVE', 'ABUSE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
    'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE',
    'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY',
    'APART', 'APPLE', 'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ARROW',
    // Common 5-letter words
    'ABBEY', 'ASSET', 'BADGE', 'BADLY', 'BAGEL', 'BAKER', 'BANJO', 'BARON',
    'BEACH', 'BEAST', 'BLANK', 'BOARD', 'BOOST', 'BOOTH', 'BOXER', 'BRAIN',
    'BRAND', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING', 'BROAD',
    'BROKE', 'BROWN', 'BUILD', 'BUYER', 'CABLE', 'CABIN', 'CAGED', 'CAMEL',
    'CANAL', 'CANDY', 'CANNY', 'CANOE', 'CAPER', 'CARAT', 'CARGO', 'CAROL',
    'CARRY', 'CARVE', 'CASTE', 'CATCH', 'CATER', 'CAUSE', 'CEASE', 'CEDAR',
    'CELEB', 'CELLAR', 'CHAIN', 'CHAIR', 'CHALK', 'CHAMP', 'CHANT', 'CHAOS',
    'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHEAT', 'CHECK', 'CHEEK', 'CHEER',
    'CHESS', 'CHEST', 'CHICK', 'CHIEF', 'CHILD', 'CHINA', 'CHIMP', 'CHIRP',
    'CHOKE', 'CHORD', 'CHORE', 'CHOSE', 'CHUCK', 'CHUMP', 'CHUNK', 'CHURN',
    'CIDER', 'CIGAR', 'CINCH', 'CIVIC', 'CIVIL', 'CLAIM', 'CLAMP', 'CLANG',
    'CLANK', 'CLASH', 'CLASS', 'CLAVE', 'CLAW', 'CLEAN', 'CLEAR', 'CLEAT',
    'CLEFT', 'CLERK', 'CLICK', 'CLIFF', 'CLIMB', 'CLING', 'CLOAK', 'CLOCK',
    'CLONE', 'CLOSE', 'CLOTH', 'CLOUD', 'CLOUT', 'CLOVE', 'CLOWN', 'COACH',
    'COAST', 'COBRA', 'COMET', 'COMMA', 'COUCH', 'COUGH', 'COULD', 'COUNT',
    'COUPE', 'COURT', 'COVEN', 'COVER', 'COWER', 'CRACK', 'CRAFT', 'CRAMP',
    'CRANE', 'CRANK', 'CRASH', 'CRATE', 'CRAVE', 'CRAWL', 'CRAZE', 'CRAZY',
    'CREAK', 'CREAM', 'CREED', 'CREEK', 'CREEP', 'CREST', 'CRIME', 'CRIMP',
    'CRISP', 'CROAK', 'CROCK', 'CROOK', 'CROPS', 'CROSS', 'CROUP', 'CROWD',
    'CROWN', 'CRUDE', 'CRUEL', 'CRUMB', 'CRUSH', 'CRUST', 'CRYPT', 'CUBIC',
    'CURVE', 'CYCLE', 'DALLY', 'DAUNT', 'DAZED', 'DEALT', 'DEATH', 'DECAL',
    'DENIM', 'DENSE', 'DEPOT', 'DEPTH', 'DERBY', 'DETER', 'DEVIL', 'DIARY',
    'DICED', 'DINGY', 'DISCO', 'DITCH', 'DITTO', 'DIVAN', 'DIVER', 'DIZZY',
    'DODGE', 'DOING', 'DOLLY', 'DONOR', 'DOPEY', 'DOUBT', 'DOUGH', 'DOWEL',
    'DOWNY', 'DOWRY', 'DOZER', 'DRAFT', 'DRAIN', 'DRAKE', 'DRANK', 'DRAPE',
    'DREAD', 'DREAM', 'DRESS', 'DRIED', 'DRIER', 'DRIFT', 'DRILL', 'DRINK',
    'DRIVE', 'DROIT', 'DROLL', 'DRONE', 'DROOL', 'DROOP', 'DROSS', 'DROVE',
    'DROWN', 'DRUGS', 'DRUMS', 'DRUNK', 'DRYER', 'DULLY', 'DUMMY', 'DUNES',
    'DUNGY', 'DUSKY', 'DUSTY', 'DWELT', 'DYING', 'DOZEN', 'DRAFT', 'DRANK',
    'DRAWL', 'DRAWN', 'DREAD', 'DREAM', 'DRESS', 'DRIED', 'DRIER', 'DRIFT',
    'EAGER', 'EAGLE', 'EARLY', 'EARTH', 'EASEL', 'EATEN', 'EATER', 'EAVES',
    'EBONY', 'EDGED', 'EDICT', 'EGGED', 'EIGHT', 'EJECT', 'ELAND', 'ELATE',
    'ELBOW', 'ELDER', 'ELECT', 'ELITE', 'ELOPE', 'ELUDE', 'EMACS', 'EMBED',
    'EMBER', 'EMCEE', 'EMERY', 'EMOTE', 'EMPTY', 'ENACT', 'ENDOW', 'ENEMY',
    'ENJOY', 'ENNUI', 'ENSUE', 'ENTER', 'ENTRY', 'ENVOY', 'EPOXY', 'EQUAL',
    'EQUIP', 'ERASE', 'ERECT', 'ERROR', 'ERUPT', 'ESSAY', 'ETHER', 'ETHIC',
    'ETHOS', 'EVADE', 'EVOKE', 'EXACT', 'EXALT', 'EXCEL', 'EXECS', 'EXERT',
    'EXALT', 'EXILE', 'EXIST', 'EXPAT', 'EXTRA', 'EXUDE', 'EXULT', 'EYING',
    'EYRIE', 'FABLE', 'FACED', 'FACET', 'FADED', 'FADES', 'FAILS', 'FAINT',
    'FAIRY', 'FAITH', 'FAKER', 'FALLACY', 'FALLS', 'FALSE', 'FAMED', 'FANCY',
    'FANGS', 'FARCE', 'FARED', 'FARES', 'FARMS', 'FATAL', 'FATTY', 'FAULT',
    'FAUNA', 'FAVOR', 'FAXED', 'FAZED', 'FEAST', 'FEATS', 'FECAL', 'FEEDS',
    'FEELS', 'FEIGN', 'FEINT', 'FELLA', 'FELON', 'FELTS', 'FEMUR', 'FENCE',
    'FENDS', 'FENNS', 'FENNY', 'FERAL', 'FERNY', 'FERRY', 'FETAL', 'FETCH',
    'FETID', 'FETED', 'FETID', 'FETUS', 'FEUDS', 'FEVER', 'FEWER', 'FIATS',
    'FIBER', 'FIBRE', 'FICUS', 'FIELD', 'FIEND', 'FIERY', 'FIFED', 'FIFES',
    'FIFTH', 'FIFTY', 'FIGHT', 'FILED', 'FILER', 'FILES', 'FILET', 'FILLS',
    'FILLY', 'FILMS', 'FILMY', 'FILTH', 'FINAL', 'FINCH', 'FINDS', 'FINED',
    'FINER', 'FINES', 'FIORD', 'FIRED', 'FIRER', 'FIRES', 'FIRMS', 'FIRST',
    'FIRTH', 'FISHY', 'FISTS', 'FIXED', 'FIXER', 'FIXES', 'FOALS', 'FOAMS',
    'FOAMY', 'FOCAL', 'FOCUS', 'FOILS', 'FOLDS', 'FOLIO', 'FOLKS', 'FOLLY',
    'FONTS', 'FOODS', 'FOOLS', 'FORAY', 'FORCE', 'FORDO', 'FORES', 'FORGE',
    'FORGO', 'FORKS', 'FORMS', 'FORTE', 'FORTH', 'FORTY', 'FORUM', 'FOSSE',
    'FOSSIL', 'FOTON', 'FOUND', 'FOUNT', 'FOURS', 'FOWLS', 'FOXES', 'FOYER',
    'FRAIL', 'FRAME', 'FRANK', 'FRAUD', 'FRAYS', 'FREAK', 'FREED', 'FREER',
    'FREES', 'FRESH', 'FRIAR', 'FRIED', 'FRIER', 'FRIES', 'FRILL', 'FRISK',
    'FRITZ', 'FRIZZ', 'FROCK', 'FROGS', 'FROME', 'FRONT', 'FROST', 'FROTH',
    'FROWN', 'FROZE', 'FRUIT', 'FRUMP', 'FRYER', 'FUDGE', 'FUELS', 'FUGUE',
    'FULLY', 'FUMES', 'FUNDS', 'FUNKY', 'FUNNY', 'FUROR', 'FURRY', 'FUSEL',
    'FUSED', 'FUSES', 'FUSSY', 'FUSTY', 'FUZZY', 'GABLE', 'GADDY', 'GAFFS',
    'GAILY', 'GAINS', 'GALES', 'GALLS', 'GAMED', 'GAMER', 'GAMES', 'GAMMA',
    'GAMES', 'GANGS', 'GAPED', 'GAPER', 'GAPES', 'GAPES', 'GAPPY', 'GARBS',
    'GARDE', 'GARED', 'GARGO', 'GARLIC', 'GARMS', 'GARRN', 'GARTH', 'GASES',
    'GASPS', 'GASSY', 'GATED', 'GATES', 'GATOR', 'GAUDY', 'GAUGE', 'GAUNT',
    'GAURS', 'GAUSS', 'GAUZE', 'GAUZY', 'GAVEL', 'GAWKS', 'GAWKY', 'GAWPS',
    'GAZED', 'GAZER', 'GAZES', 'GAZOO', 'GEARS', 'GEEKS', 'GEESE', 'GELID',
    'GELLY', 'GEMS', 'GEODE', 'GETUP', 'GHOST', 'GHOUL', 'GIANT', 'GIDDY',
    'GIFTS', 'GIGOT', 'GIGUE', 'GILLS', 'GILTS', 'GIMME', 'GIMP', 'GIPSY',
    'GIRDS', 'GIRLS', 'GIRLY', 'GIRTH', 'GISMO', 'GISTS', 'GIVEN', 'GIVER',
    'GIVES', 'GIZMO', 'GLADE', 'GLADS', 'GLAND', 'GLANS', 'GLARE', 'GLARY',
    'GLASS', 'GLAZE', 'GLEAM', 'GLEAN', 'GLEBE', 'GLEED', 'GLEEK', 'GLEES',
    'GLEET', 'GLENS', 'GLEYS', 'GLIB', 'GLICK', 'GLIDE', 'GLIFF', 'GLIFT',
    'GLIME', 'GLIMS', 'GLINT', 'GLISK', 'GLISS', 'GLITZ', 'GLOAM', 'GLOAT',
    'GLOBE', 'GLOBS', 'GLOGG', 'GLOOM', 'GLOOP', 'GLOPS', 'GLORE', 'GLORY',
    'GLOSS', 'GLOST', 'GLOUT', 'GLOVE', 'GLOWS', 'GLUED', 'GLUER', 'GLUES',
    'GLUED', 'GLUCD', 'GLUCY', 'GLUEY', 'GLUED', 'GLUGS', 'GLUED', 'GLUME',
    'GLUMP', 'GLUON', 'GLUTE', 'GLUTS', 'GLYED', 'GLYPH', 'GNARL', 'GNARR',
    'GNARS', 'GNARL', 'GNASP', 'GNARL', 'GNASH', 'GNATS', 'GNAWE', 'GNAWL',
    'GNAWN', 'GNAWS', 'GNEAK', 'GNEIS', 'GEOFF', 'GNELF', 'GENIO', 'GENUS',
  ]);

  return VALID_WORDS.has(word.toUpperCase());
}

// Evaluate a guess against the target word
export function evaluateGuess(guess: string, target: string): LetterResult[] {
  const guessArray = guess.toUpperCase().split('');
  const targetArray = target.toUpperCase().split('');
  const result: LetterResult[] = new Array(guessArray.length).fill('absent');

  // First pass: mark correct positions
  const targetCounts = new Map<string, number>();
  for (let i = 0; i < guessArray.length; i++) {
    if (guessArray[i] === targetArray[i]) {
      result[i] = 'correct';
    } else {
      targetCounts.set(targetArray[i], (targetCounts.get(targetArray[i]) ?? 0) + 1);
    }
  }

  // Second pass: mark present positions
  for (let i = 0; i < guessArray.length; i++) {
    if (result[i] === 'absent' && targetCounts.has(guessArray[i])) {
      const count = targetCounts.get(guessArray[i]) ?? 0;
      if (count > 0) {
        result[i] = 'present';
        targetCounts.set(guessArray[i], count - 1);
      }
    }
  }

  return result;
}

// Get keyboard state based on guesses
export function getKeyboardState(guesses: Guess[]): Record<string, LetterResult | undefined> {
  const state: Record<string, LetterResult | undefined> = {};

  for (const guess of guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      const letter = guess.word[i].toUpperCase();
      const result = guess.result[i];

      // Don't downgrade from correct to present/absent
      if (state[letter] !== 'correct') {
        state[letter] = result;
      }
    }
  }

  return state;
}

// Calculate coins earned for winning
export function calculateCoinsEarned(guessCount: number, gameMode: string, difficulty: number): number {
  const baseCoins = 10;
  const guessBonus = Math.max(0, 6 - guessCount) * 2;
  const modeMultiplier = gameMode === 'hardcore' ? 1.5 : gameMode === 'speed' ? 1.2 : 1;
  const difficultyBonus = difficulty * 5;

  return Math.floor((baseCoins + guessBonus + difficultyBonus) * modeMultiplier);
}

// Get difficulty number from category
export function getDifficultyNumber(category: string): number {
  const difficulties: Record<string, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
    Extreme: 4,
  };
  return difficulties[category] ?? 1;
}

// Format time to MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Check if streak should break (no play today)
export function shouldBreakStreak(lastPlayedAt?: number): boolean {
  if (!lastPlayedAt) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastPlayed = new Date(lastPlayedAt);
  lastPlayed.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return lastPlayed < yesterday;
}
