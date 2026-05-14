import seedrandom from 'seedrandom';
import { shortestPath, findAllShortestPaths } from './wordGraph';
import { getWordsByLength } from './dictionary';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type WordLength = 3 | 4 | 5 | 6 | 7;

export interface WordPuzzle {
  start: string;
  end: string;
  optimal: number;
  chain: string[];
  lockedIndices: number[];
  extraRungs: number;
  alternativePaths?: string[][];
}

// Deprecated: word list now loaded from dictionary
const allWords_DEPRECATED = [
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
  'worm', 'worn', 'wrap', 'yard', 'yarn', 'year', 'yell', 'your', 'zero', 'zone',
  // Additional 5-letter words for puzzle generation
  'about', 'above', 'abuse', 'acute', 'admit', 'adopt', 'adult', 'after', 'again', 'agent', 'agree', 'ahead', 'alarm', 'album', 'alert',
  'alien', 'align', 'alike', 'alive', 'allow', 'alone', 'along', 'alter', 'angel', 'anger', 'angle', 'angry', 'apart', 'apple', 'apply',
  'arena', 'argue', 'arise', 'armor', 'array', 'arrow', 'aside', 'asset', 'avoid', 'awake', 'award', 'aware', 'badly', 'beach', 'began',
  'begin', 'being', 'below', 'bench', 'billy', 'birth', 'black', 'blade', 'blame', 'blank', 'blast', 'bleed', 'blend', 'blind', 'block',
  'blood', 'board', 'boost', 'booth', 'bound', 'brain', 'brand', 'brass', 'brave', 'bread', 'break', 'breed', 'brick', 'bride', 'brief',
  'bring', 'broad', 'broke', 'brown', 'build', 'buyer', 'cable', 'calif', 'canal', 'candy', 'canon', 'cargo', 'carol', 'carry', 'catch',
  'cause', 'chain', 'chair', 'chaos', 'charm', 'chart', 'chase', 'cheap', 'cheat', 'check', 'chess', 'chest', 'chief', 'child', 'china',
  'chose', 'chord', 'civil', 'claim', 'class', 'clean', 'clear', 'click', 'climb', 'clock', 'close', 'cloud', 'coach', 'coast', 'could',
  'count', 'court', 'cover', 'craft', 'crash', 'crazy', 'cream', 'crime', 'cross', 'crowd', 'crown', 'crude', 'crush', 'curve', 'daily',
  'dance', 'dated', 'dealt', 'death', 'debug', 'debut', 'decay', 'delay', 'delta', 'dense', 'depot', 'depth', 'derby', 'digit', 'dirty',
  'doubt', 'draft', 'drama', 'drank', 'drawn', 'dream', 'dress', 'dried', 'drift', 'drill', 'drink', 'drive', 'drown', 'eager', 'early',
  'earth', 'eight', 'elbow', 'elect', 'elite', 'enjoy', 'enter', 'entry', 'equal', 'equip', 'error', 'event', 'every', 'exact', 'exist',
  'extra', 'faith', 'false', 'fault', 'favor', 'feast', 'fence', 'field', 'fiend', 'fight', 'final', 'first', 'fixed', 'flame', 'flash',
  'fleet', 'flood', 'flour', 'focus', 'force', 'forge', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'fried', 'front', 'fruit',
  'fully', 'funny', 'giant', 'given', 'glass', 'globe', 'going', 'grace', 'grade', 'grain', 'grand', 'grant', 'graph', 'grass', 'great',
  'green', 'grief', 'gross', 'group', 'grown', 'guard', 'guess', 'guest', 'guide', 'guilt', 'happy', 'harry', 'harsh', 'heart', 'heavy',
  'hence', 'henry', 'horse', 'hotel', 'house', 'human', 'humid', 'ideal', 'image', 'imply', 'incur', 'index', 'inner', 'input', 'issue',
  'japan', 'jimmy', 'joint', 'judge', 'juice', 'kitty', 'known', 'label', 'labor', 'large', 'laser', 'later', 'laugh', 'layer', 'learn',
  'lease', 'least', 'leave', 'legal', 'lemon', 'level', 'lewis', 'light', 'limit', 'links', 'lions', 'lives', 'local', 'logic', 'loose',
  'lover', 'lower', 'lucky', 'lunch', 'lying', 'magic', 'major', 'maker', 'march', 'maria', 'match', 'maybe', 'mayor', 'meant', 'media',
  'metal', 'might', 'minor', 'minus', 'mixed', 'mixer', 'model', 'money', 'month', 'moral', 'mount', 'mouse', 'mouth', 'moved', 'movie',
  'music', 'needs', 'never', 'newly', 'night', 'ninth', 'noble', 'noise', 'north', 'noted', 'novel', 'nurse', 'occur', 'ocean', 'offer',
  'often', 'order', 'organ', 'other', 'ought', 'ounce', 'outer', 'owned', 'owner', 'paint', 'panel', 'paper', 'party', 'pasta', 'patch',
  'pause', 'peace', 'pearl', 'pedal', 'penny', 'perry', 'phone', 'photo', 'piano', 'piece', 'pilot', 'pitch', 'pizza', 'place', 'plain',
  'plane', 'plant', 'plate', 'plays', 'plaza', 'point', 'pound', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize',
  'proof', 'props', 'proud', 'prove', 'proxy', 'queen', 'query', 'quest', 'quick', 'quiet', 'quite', 'radio', 'rainy', 'range', 'rapid',
  'ratio', 'razor', 'reach', 'ready', 'realm', 'rebel', 'refer', 'relax', 'reply', 'rider', 'ridge', 'rifle', 'right', 'rigid', 'rival',
  'river', 'roads', 'robin', 'roger', 'roman', 'rough', 'round', 'route', 'royal', 'rugby', 'ruler', 'rural', 'scale', 'scare', 'scene',
  'scope', 'score', 'scout', 'screw', 'seize', 'sense', 'serve', 'seven', 'shall', 'shape', 'share', 'sharp', 'sheet', 'shelf', 'shell',
  'shift', 'shine', 'shirt', 'shock', 'shoot', 'shore', 'short', 'shown', 'sight', 'since', 'sixth', 'sized', 'skill', 'sleep', 'slice',
  'slide', 'smith', 'smoke', 'snake', 'sniff', 'solid', 'solve', 'sorry', 'sound', 'south', 'space', 'spare', 'spark', 'speak', 'speed',
  'spell', 'spend', 'spent', 'split', 'spoke', 'spoon', 'sport', 'spray', 'stake', 'stand', 'stare', 'start', 'state', 'steam', 'steel',
  'steep', 'steer', 'stick', 'still', 'sting', 'stock', 'stone', 'stood', 'stool', 'store', 'storm', 'story', 'strip', 'stuck', 'study',
  'stuff', 'sugar', 'super', 'sweet', 'table', 'taken', 'taste', 'taxes', 'teach', 'terry', 'thank', 'theft', 'their', 'theme', 'there',
  'these', 'thick', 'thing', 'think', 'third', 'those', 'three', 'threw', 'throw', 'thumb', 'tight', 'tired', 'title', 'today', 'token',
  'total', 'touch', 'tough', 'tower', 'track', 'trade', 'trail', 'train', 'trait', 'treat', 'trend', 'trial', 'tribe', 'trick', 'tried',
  'tries', 'troop', 'truck', 'truly', 'trust', 'truth', 'tumor', 'twice', 'uncle', 'under', 'undue', 'union', 'unity', 'until', 'upper',
  'upset', 'urban', 'urged', 'usage', 'usual', 'utter', 'valid', 'value', 'video', 'virus', 'visit', 'vital', 'vivid', 'vocal', 'voice',
  'vowel', 'wages', 'wagon', 'waste', 'watch', 'water', 'waved', 'waves', 'weary', 'weigh', 'weird', 'wheat', 'wheel', 'where', 'which',
  'while', 'white', 'whole', 'whose', 'widen', 'width', 'woman', 'women', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound',
  'wrist', 'write', 'wrong', 'young'
];

// Note: getWordsByLength is now imported from ./dictionary

function getTargetPathLength(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 4;
    case 'medium':
      return 5;
    case 'hard':
      return 6;
  }
}

function findPuzzleChain(
  words: string[],
  targetLength: number,
  rng: () => number,
  maxAttempts: number = 50000
): string[] | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const startIdx = Math.floor(rng() * words.length);
    const endIdx = Math.floor(rng() * words.length);

    if (startIdx === endIdx) continue;

    const start = words[startIdx];
    const end = words[endIdx];

    const path = shortestPath(start, end);
    if (path && path.length === targetLength) {
      return path;
    }
  }

  return null;
}

function pickLockedIndices(chainLength: number, rng: () => number): number[] {
  if (chainLength <= 2) return [];

  const maxLocked = Math.min(2, chainLength - 1);
  const numLocked = Math.floor(rng() * (maxLocked + 1));

  if (numLocked === 0) return [];

  // Pick random indices from positions 1 to chainLength-1 (excluding first letter)
  const availableIndices = Array.from({ length: chainLength - 1 }, (_, i) => i + 1);
  const lockedIndices: number[] = [];

  for (let i = 0; i < numLocked; i++) {
    const pickIdx = Math.floor(rng() * availableIndices.length);
    lockedIndices.push(availableIndices[pickIdx]);
    availableIndices.splice(pickIdx, 1);
  }

  return lockedIndices.sort((a, b) => a - b);
}

export function generatePuzzle(
  wordLength: WordLength,
  difficulty: Difficulty,
  seed?: string
): WordPuzzle {
  const seedString = seed || Math.random().toString() + Date.now();
  const rng = seedrandom(seedString);

  const words = getWordsByLength(wordLength);
  const targetLength = getTargetPathLength(difficulty);

  const chain = findPuzzleChain(words, targetLength, rng);

  if (!chain) {
    throw new Error(
      `Could not generate puzzle with length=${wordLength}, difficulty=${difficulty}`
    );
  }

  // Verify puzzle is solvable
  const verifyPath = shortestPath(chain[0], chain[chain.length - 1]);
  if (!verifyPath || verifyPath.length !== chain.length) {
    throw new Error(
      `Generated puzzle is not solvable or path length mismatch: expected ${chain.length}, got ${verifyPath?.length || 'null'}`
    );
  }

  // Ensure start !== end
  if (chain[0] === chain[chain.length - 1]) {
    throw new Error(`Puzzle start and end cannot be the same word: ${chain[0]}`);
  }

  const lockedIndices = pickLockedIndices(chain.length, rng);

  // Find alternative paths to the same destination
  const alternativePaths = findAllShortestPaths(
    chain[0],
    chain[chain.length - 1],
    5
  ).filter(path => path.join(',') !== chain.join(','));

  return {
    start: chain[0],
    end: chain[chain.length - 1],
    optimal: chain.length,
    chain,
    lockedIndices,
    extraRungs: 2,
    alternativePaths: alternativePaths.length > 0 ? alternativePaths : undefined
  };
}

export function getDailyPuzzle(
  wordLength: WordLength,
  difficulty: Difficulty
): WordPuzzle {
  return generatePuzzle(wordLength, difficulty, new Date().toDateString());
}
