import { useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import { WordPuzzle } from './generatePuzzle';
import { shortestPath } from './wordGraph';

export interface GameState {
  history: string[][];
  lives: number;
  currentInput: string[];
  selectedIdx: number;
  phase: 'playing' | 'won' | 'lost';
  lastHintedIndex: number | null;
  lastRevealedWord: string[] | null;
  powerUpsUsed: { hints: number; reveals: number; undos: number };
  failedSubmissions: number;
}

type GameAction =
  | { type: 'PRESS_LETTER'; letter: string }
  | { type: 'DELETE_LETTER' }
  | { type: 'SUBMIT_WORD'; success: boolean }
  | { type: 'APPLY_HINT'; index: number }
  | { type: 'APPLY_REVEAL'; word: string[] }
  | { type: 'CLEAR_HINT' }
  | { type: 'UNDO_STEP' }
  | { type: 'WIN_GAME' }
  | { type: 'LOSE_GAME' }
  | { type: 'RESET_GAME'; puzzle: WordPuzzle };

// Word list for validation (same as in generatePuzzle.ts and wordGraph.ts)
const VALID_WORDS = new Set([
  'ace', 'act', 'add', 'age', 'ago', 'aid', 'aim', 'air', 'all', 'and', 'any', 'are', 'ark', 'arm', 'art', 'ash', 'ask', 'ate', 'awe',
  'axe', 'bad', 'bag', 'ban', 'bar', 'bat', 'bay', 'bed', 'bee', 'bet', 'bid', 'big', 'bin', 'bit', 'boa', 'bog', 'bow', 'box', 'boy',
  'bud', 'bug', 'bus', 'but', 'buy', 'cab', 'can', 'cap', 'car', 'cat', 'cot', 'cow', 'cry', 'cup', 'cut', 'dad', 'dam', 'day', 'den', 'did',
  'die', 'dig', 'dog', 'dot', 'dry', 'due', 'dye', 'ear', 'eat', 'egg', 'ego', 'end', 'era', 'err', 'eve', 'eye', 'fan', 'far', 'fat',
  'fax', 'fed', 'fee', 'few', 'fig', 'fin', 'fit', 'fix', 'fly', 'fog', 'for', 'fox', 'fry', 'fun', 'fur', 'gas', 'gay', 'get', 'gnu',
  'god', 'got', 'gun', 'gym', 'had', 'hag', 'ham', 'has', 'hat', 'hay', 'hem', 'hen', 'her', 'hid', 'him', 'hip', 'his', 'hit', 'hog',
  'hop', 'hot', 'how', 'hub', 'hue', 'hug', 'hut', 'ice', 'icy', 'ill', 'ink', 'inn', 'ion', 'its', 'ivy', 'jab', 'jam', 'jar', 'jaw',
  'jet', 'job', 'jog', 'joy', 'jug', 'key', 'kid', 'kin', 'kit', 'lab', 'lad', 'lag', 'lap', 'law', 'lay', 'lea', 'led', 'leg', 'let',
  'lid', 'lie', 'lip', 'lit', 'log', 'lot', 'low', 'mad', 'man', 'map', 'mar', 'mat', 'may', 'men', 'met', 'mid', 'mix', 'mob', 'mud',
  'mug', 'nap', 'net', 'new', 'nod', 'nor', 'not', 'now', 'nun', 'nut', 'oak', 'oar', 'oat', 'odd', 'ode', 'off', 'oft', 'oil', 'old',
  'one', 'opt', 'our', 'out', 'owe', 'owl', 'own', 'pac', 'pad', 'pal', 'pan', 'pat', 'paw', 'pay', 'pea', 'peg', 'pen', 'pep', 'pet',
  'pie', 'pig', 'pin', 'pit', 'pod', 'pop', 'pot', 'pox', 'put', 'rad', 'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'ref',
  'rep', 'rib', 'rid', 'rim', 'rip', 'rob', 'rod', 'roe', 'rot', 'row', 'rub', 'rug', 'run', 'rut', 'rye', 'sac', 'sad', 'sag', 'sat',
  'saw', 'say', 'sea', 'see', 'set', 'sew', 'shy', 'sin', 'sip', 'sir', 'sis', 'sit', 'six', 'ski', 'sky', 'sly', 'sob', 'son', 'sop',
  'sow', 'soy', 'spa', 'spy', 'sub', 'sue', 'sum', 'sun', 'tab', 'tad', 'tag', 'tan', 'tap', 'tar', 'tat', 'tax', 'tea', 'ten', 'the',
  'tic', 'tie', 'tin', 'tip', 'toe', 'ton', 'too', 'top', 'tot', 'toy', 'try', 'tub', 'tug', 'two', 'urn', 'use', 'van', 'vat', 'vet',
  'via', 'vie', 'vow', 'wad', 'wag', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'won', 'woo',
  'wow', 'yak', 'yam', 'yap', 'yaw', 'yes', 'yet', 'yew', 'you', 'zap', 'zen', 'zip', 'zoo',
  'able', 'ache', 'aged', 'aide', 'aids', 'aims', 'airs', 'also', 'ante', 'arch', 'area', 'arms', 'arts', 'atom',
  'back', 'bald', 'ball', 'band', 'bank', 'bare', 'bark', 'barn', 'base', 'bath', 'bats', 'bean', 'bear', 'beat', 'beds', 'beef', 'been',
  'beer', 'bell', 'belt', 'bend', 'bent', 'best', 'bias', 'bike', 'bill', 'bind', 'bird', 'bite', 'bits', 'bled', 'blue', 'boar', 'boat',
  'body', 'bold', 'bolt', 'bomb', 'bone', 'book', 'boom', 'boot', 'bore', 'born', 'boss', 'both', 'bowl', 'bulk', 'burn', 'bush', 'busy',
  'cage', 'cake', 'calf', 'call', 'calm', 'came', 'camp', 'cane', 'cans', 'cape', 'card', 'care', 'cart', 'case', 'cash', 'cast', 'cats',
  'cell', 'cent', 'chin', 'chop', 'cite', 'city', 'clap', 'clay', 'clip', 'club', 'coal', 'coat', 'code', 'coil', 'coin', 'cold', 'colt',
  'comb', 'come', 'cone', 'cook', 'cool', 'cope', 'copy', 'core', 'cork', 'corn', 'cost', 'cots', 'crew', 'crop', 'crow', 'cube', 'cure',
  'curl', 'cute', 'damp', 'dare', 'dark', 'dash', 'data', 'date', 'dawn', 'days', 'dead', 'deaf', 'deal', 'dean', 'dear', 'debt', 'deck',
  'deed', 'deem', 'deep', 'deer', 'deny', 'desk', 'dial', 'dice', 'diet', 'dime', 'dine', 'dirt', 'disc', 'dish', 'dock', 'does', 'doll',
  'dome', 'done', 'door', 'dose', 'dots', 'dove', 'down', 'drag', 'draw', 'drew', 'drip', 'drop', 'drug', 'duck', 'dull', 'dumb', 'dump',
  'dunk', 'dust', 'duty', 'each', 'earl', 'earn', 'ease', 'east', 'easy', 'echo', 'edge', 'edit', 'else', 'emit', 'ends', 'epic', 'even',
  'ever', 'evil', 'exam', 'exit', 'face', 'fact', 'fade', 'fail', 'fair', 'fall', 'fame', 'fare', 'farm', 'fast', 'fate', 'fear', 'feat',
  'feel', 'feet', 'fell', 'felt', 'file', 'fill', 'film', 'find', 'fine', 'fire', 'firm', 'fish', 'five', 'flag', 'flat', 'fled', 'flee',
  'flew', 'flip', 'flow', 'folk', 'fond', 'food', 'fool', 'foot', 'fork', 'form', 'fort', 'foul', 'four', 'free', 'from', 'fuel', 'full',
  'game', 'gang', 'gate', 'gave', 'gear', 'gene', 'gift', 'glow', 'goal', 'goat', 'goes', 'gold', 'golf', 'gone', 'good', 'grab', 'gray',
  'grew', 'grey', 'grid', 'grim', 'grin', 'grip', 'grow', 'gulf', 'hair', 'half', 'hall', 'halt', 'hand', 'hang', 'hard', 'hare', 'harm',
  'hate', 'have', 'hawk', 'head', 'heal', 'heap', 'hear', 'heat', 'held', 'help', 'herb', 'herd', 'here', 'hero', 'high', 'hike', 'hill',
  'hint', 'hire', 'hole', 'holy', 'home', 'hood', 'hook', 'hope', 'horn', 'hose', 'host', 'hour', 'huge', 'hung', 'hunt', 'hurt', 'idle',
  'inch', 'into', 'iris', 'iron', 'item', 'jade', 'jail', 'joke', 'jump', 'june', 'jury', 'just', 'keen', 'keep', 'kick', 'kill', 'kilo',
  'king', 'kiss', 'knee', 'knew', 'know', 'lack', 'lady', 'lake', 'land', 'lane', 'late', 'lead', 'leaf', 'leak', 'lean', 'leap', 'left',
  'lend', 'lens', 'lent', 'less', 'life', 'lift', 'like', 'line', 'link', 'lion', 'list', 'live', 'load', 'loan', 'lock', 'long', 'look',
  'loom', 'loop', 'lord', 'lore', 'lose', 'loss', 'lost', 'loud', 'love', 'luck', 'lung', 'made', 'maid', 'mail', 'main', 'make', 'male',
  'mall', 'malt', 'mass', 'mate', 'math', 'meal', 'mean', 'meat', 'meek', 'meet', 'melt', 'memo', 'menu', 'mesh', 'mice', 'mild', 'mile',
  'milk', 'mill', 'mind', 'mine', 'mint', 'miss', 'mist', 'mode', 'mold', 'mole', 'mood', 'moon', 'more', 'moss', 'moth', 'move', 'much',
  'must', 'myth', 'nail', 'name', 'near', 'neck', 'need', 'nest', 'next', 'nice', 'nine', 'node', 'none', 'noon', 'norm', 'nose', 'note',
  'noun', 'oath', 'obey', 'odor', 'once', 'onto', 'ooze', 'open', 'oral', 'oven', 'over', 'pace', 'pack', 'page', 'paid', 'pain', 'pair',
  'pale', 'palm', 'pane', 'park', 'part', 'pass', 'past', 'path', 'peak', 'pear', 'peas', 'peck', 'peer', 'pelt', 'pest', 'pick', 'pile',
  'pine', 'pink', 'pipe', 'plan', 'play', 'plea', 'plug', 'plus', 'poem', 'poet', 'pole', 'poll', 'pond', 'pool', 'poor', 'pope', 'pork',
  'port', 'pose', 'post', 'pour', 'pray', 'prey', 'push', 'quit', 'race', 'rack', 'rage', 'raid', 'rail', 'rain', 'rank', 'rare', 'rate',
  'rave', 'read', 'real', 'ream', 'reap', 'rear', 'rely', 'rent', 'rest', 'rice', 'rich', 'ride', 'ring', 'rise', 'risk', 'road', 'roam',
  'roar', 'robe', 'rock', 'rode', 'role', 'roll', 'rome', 'roof', 'room', 'root', 'rope', 'rose', 'rule', 'rush', 'rust', 'safe', 'sage',
  'said', 'sail', 'sake', 'sale', 'salt', 'same', 'sand', 'sane', 'save', 'seal', 'seam', 'seat', 'seed', 'seek', 'seem', 'seen', 'self',
  'sell', 'semi', 'send', 'sent', 'ship', 'shoe', 'shop', 'shot', 'show', 'shut', 'sick', 'side', 'sift', 'sign', 'silk', 'sing', 'sink',
  'size', 'skin', 'slip', 'slow', 'snap', 'snow', 'soap', 'sock', 'soft', 'soil', 'sold', 'sole', 'some', 'song', 'soon', 'sore', 'sort',
  'soul', 'spot', 'star', 'stay', 'stem', 'step', 'stew', 'stop', 'such', 'suit', 'sure', 'surf', 'swap', 'swim', 'tail', 'take', 'tale',
  'talk', 'tall', 'tame', 'tank', 'task', 'team', 'tear', 'teas', 'teen', 'tell', 'tend', 'tent', 'term', 'test', 'text', 'than', 'that',
  'them', 'then', 'they', 'thin', 'this', 'thou', 'thus', 'tide', 'tied', 'ties', 'tile', 'till', 'tilt', 'time', 'tiny', 'tire', 'toad',
  'toes', 'told', 'tone', 'took', 'tool', 'torn', 'tour', 'town', 'trap', 'tray', 'tree', 'trek', 'trim', 'trip', 'trot', 'true', 'tune',
  'turn', 'twin', 'type', 'unit', 'upon', 'used', 'user', 'vain', 'vale', 'vast', 'veal', 'verb', 'very', 'vice', 'view', 'vine', 'wage',
  'wait', 'wake', 'walk', 'wall', 'want', 'ward', 'warm', 'warn', 'wash', 'wave', 'weak', 'wear', 'week', 'well', 'went', 'were', 'west',
  'what', 'when', 'whom', 'will', 'wind', 'wine', 'wing', 'wire', 'wise', 'wish', 'with', 'wolf', 'wood', 'wool', 'word', 'wore', 'work',
  'worm', 'worn', 'wrap', 'yard', 'yarn', 'year', 'yell', 'your', 'zero', 'zone'
]);

function countDifferences(word1: string, word2: string): number {
  if (word1.length !== word2.length) return Infinity;
  let count = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) count++;
  }
  return count;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PRESS_LETTER': {
      if (state.phase !== 'playing' || state.currentInput.length >= 10) {
        return state;
      }
      return {
        ...state,
        currentInput: [...state.currentInput, action.letter.toLowerCase()],
        selectedIdx: state.currentInput.length + 1
      };
    }

    case 'DELETE_LETTER': {
      if (state.currentInput.length === 0) return state;
      return {
        ...state,
        currentInput: state.currentInput.slice(0, -1),
        selectedIdx: Math.max(0, state.selectedIdx - 1)
      };
    }

    case 'SUBMIT_WORD': {
      if (state.phase !== 'playing') return state;

      if (action.success) {
        return {
          ...state,
          history: [...state.history, [...state.currentInput]],
          currentInput: [],
          selectedIdx: 0,
          lastHintedIndex: null,
          lastRevealedWord: null
        };
      } else {
        const newLives = state.lives - 1;
        return {
          ...state,
          lives: newLives,
          currentInput: [],
          selectedIdx: 0,
          failedSubmissions: state.failedSubmissions + 1,
          phase: newLives <= 0 ? 'lost' : 'playing'
        };
      }
    }

    case 'APPLY_HINT': {
      if (state.phase !== 'playing') return state;
      return {
        ...state,
        lastHintedIndex: action.index,
        powerUpsUsed: { ...state.powerUpsUsed, hints: state.powerUpsUsed.hints + 1 }
      };
    }

    case 'APPLY_REVEAL': {
      if (state.phase !== 'playing') return state;
      return {
        ...state,
        lastRevealedWord: action.word,
        powerUpsUsed: { ...state.powerUpsUsed, reveals: state.powerUpsUsed.reveals + 1 }
      };
    }

    case 'CLEAR_HINT': {
      return {
        ...state,
        lastHintedIndex: null
      };
    }

    case 'UNDO_STEP': {
      if (state.history.length <= 1) return state;
      return {
        ...state,
        history: state.history.slice(0, -1),
        currentInput: [],
        selectedIdx: 0,
        lastHintedIndex: null,
        lastRevealedWord: null,
        powerUpsUsed: { ...state.powerUpsUsed, undos: state.powerUpsUsed.undos + 1 }
      };
    }

    case 'WIN_GAME': {
      return {
        ...state,
        phase: 'won'
      };
    }

    case 'LOSE_GAME': {
      return {
        ...state,
        phase: 'lost'
      };
    }

    case 'RESET_GAME': {
      return {
        history: [[...action.puzzle.start.split('')]],
        lives: 3,
        currentInput: [],
        selectedIdx: 0,
        lastHintedIndex: null,
        lastRevealedWord: null,
        powerUpsUsed: { hints: 0, reveals: 0, undos: 0 },
        failedSubmissions: 0,
        phase: 'playing'
      };
    }

    default:
      return state;
  }
}

export function useGameState(puzzle: WordPuzzle) {
  const initialState: GameState = {
    history: [[...puzzle.start.split('')]],
    lives: 3,
    currentInput: [],
    selectedIdx: 0,
    lastHintedIndex: null,
    lastRevealedWord: null,
    powerUpsUsed: { hints: 0, reveals: 0, undos: 0 },
    failedSubmissions: 0,
    phase: 'playing'
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);
  const prevPuzzleRef = useRef<string>(puzzle.start);

  useEffect(() => {
    if (puzzle.start !== prevPuzzleRef.current) {
      prevPuzzleRef.current = puzzle.start;
      dispatch({ type: 'RESET_GAME', puzzle });
    }
  }, [puzzle]);

  const pressLetter = useCallback((letter: string) => {
    dispatch({ type: 'PRESS_LETTER', letter });
  }, []);

  const deleteLetter = useCallback(() => {
    dispatch({ type: 'DELETE_LETTER' });
  }, []);

  const submitWord = useCallback(() => {
    const word = state.currentInput.join('');

    if (word.length !== puzzle.start.length) {
      dispatch({ type: 'SUBMIT_WORD', success: false });
      return;
    }

    if (!VALID_WORDS.has(word)) {
      dispatch({ type: 'SUBMIT_WORD', success: false });
      return;
    }

    const previousWord = state.history[state.history.length - 1].join('');
    if (word === previousWord) {
      dispatch({ type: 'SUBMIT_WORD', success: false });
      return;
    }

    const differences = countDifferences(word, previousWord);
    if (differences !== 1) {
      dispatch({ type: 'SUBMIT_WORD', success: false });
      return;
    }

    dispatch({ type: 'SUBMIT_WORD', success: true });

    if (word === puzzle.end) {
      dispatch({ type: 'WIN_GAME' });
    }
  }, [state, puzzle]);

  const applyHint = useCallback((index: number) => {
    dispatch({ type: 'APPLY_HINT', index });
  }, []);

  const applyReveal = useCallback((word: string[]) => {
    dispatch({ type: 'APPLY_REVEAL', word });
  }, []);

  const clearHint = useCallback(() => {
    dispatch({ type: 'CLEAR_HINT' });
  }, []);

  const undoStep = useCallback(() => {
    if (state.history.length <= 1) return;
    dispatch({ type: 'UNDO_STEP' });
  }, [state.history.length]);

  return {
    state,
    pressLetter,
    deleteLetter,
    submitWord,
    applyHint,
    applyReveal,
    clearHint,
    undoStep
  };
}
