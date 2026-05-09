// English word list (3-5 letters) for word ladder
// Contains 1000+ common words from standard English dictionaries
const wordList = [
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
  'game', 'gang', 'gate', 'gave', 'gear', 'gene', 'gift', 'glow', 'goal', 'goat', 'goes', 'gold', 'golf', 'gone', 'good', 'grab', 'grab',
  'gray', 'grew', 'grey', 'grid', 'grim', 'grin', 'grip', 'grow', 'gulf', 'hair', 'half', 'hall', 'halt', 'hand', 'hang', 'hard', 'hare',
  'harm', 'hate', 'have', 'hawk', 'head', 'heal', 'heap', 'hear', 'heat', 'held', 'help', 'herb', 'herd', 'here', 'hero', 'high', 'hike',
  'hill', 'hint', 'hire', 'hole', 'holy', 'home', 'hood', 'hook', 'hope', 'horn', 'hose', 'host', 'hour', 'huge', 'hung', 'hunt', 'hurt',
  'idle', 'inch', 'into', 'iris', 'iron', 'item', 'jade', 'jail', 'joke', 'jump', 'june', 'jury', 'just', 'keen', 'keep', 'kick', 'kill',
  'kilo', 'king', 'kiss', 'knee', 'knew', 'know', 'lack', 'lady', 'lake', 'land', 'lane', 'late', 'lead', 'leaf', 'leak', 'lean', 'leap',
  'left', 'lend', 'lens', 'lent', 'less', 'life', 'lift', 'like', 'line', 'link', 'lion', 'list', 'live', 'load', 'loan', 'lock', 'long',
  'look', 'loom', 'loop', 'lord', 'lore', 'lose', 'loss', 'lost', 'loud', 'love', 'luck', 'lung', 'made', 'maid', 'mail', 'main', 'make',
  'male', 'mall', 'malt', 'mass', 'mate', 'math', 'meal', 'mean', 'meat', 'meek', 'meet', 'melt', 'memo', 'menu', 'mesh', 'mice', 'mild',
  'mile', 'milk', 'mill', 'mind', 'mine', 'mint', 'miss', 'mist', 'mode', 'mold', 'mole', 'mood', 'moon', 'more', 'moss', 'moth', 'move',
  'much', 'must', 'myth', 'nail', 'name', 'near', 'neck', 'need', 'nest', 'next', 'nice', 'nine', 'node', 'none', 'noon', 'norm', 'nose',
  'note', 'noun', 'oath', 'obey', 'odor', 'once', 'onto', 'ooze', 'open', 'oral', 'oven', 'over', 'pace', 'pack', 'page', 'paid', 'pain',
  'pair', 'pale', 'palm', 'pane', 'park', 'part', 'pass', 'past', 'path', 'peak', 'pear', 'peas', 'peck', 'peer', 'pelt', 'pest', 'pick',
  'pile', 'pine', 'pink', 'pipe', 'plan', 'play', 'plea', 'plug', 'plus', 'poem', 'poet', 'pole', 'poll', 'pond', 'pool', 'poor', 'pope',
  'pork', 'port', 'pose', 'post', 'pour', 'pray', 'prey', 'push', 'quit', 'race', 'rack', 'rage', 'raid', 'rail', 'rain', 'rank', 'rare',
  'rate', 'rave', 'read', 'real', 'ream', 'reap', 'rear', 'rely', 'rent', 'rest', 'rice', 'rich', 'ride', 'ring', 'rise', 'risk', 'road',
  'roam', 'roar', 'robe', 'rock', 'rode', 'role', 'roll', 'rome', 'roof', 'room', 'root', 'rope', 'rose', 'rule', 'rush', 'rust', 'safe',
  'sage', 'said', 'sail', 'sake', 'sale', 'salt', 'same', 'sand', 'sane', 'save', 'seal', 'seam', 'seat', 'seed', 'seek', 'seem', 'seen',
  'self', 'sell', 'semi', 'send', 'sent', 'ship', 'shoe', 'shop', 'shot', 'show', 'shut', 'sick', 'side', 'sift', 'sign', 'silk', 'sing',
  'sink', 'size', 'skin', 'slip', 'slow', 'snap', 'snow', 'soap', 'sock', 'soft', 'soil', 'sold', 'sole', 'some', 'song', 'soon', 'sore',
  'sort', 'soul', 'spot', 'star', 'stay', 'stem', 'step', 'stew', 'stop', 'such', 'suit', 'sure', 'surf', 'swap', 'swim', 'tail', 'take',
  'tale', 'talk', 'tall', 'tame', 'tank', 'task', 'team', 'tear', 'teas', 'teen', 'tell', 'tend', 'tent', 'term', 'test', 'text', 'than',
  'that', 'them', 'then', 'they', 'thin', 'this', 'thou', 'thus', 'tide', 'tied', 'ties', 'tile', 'till', 'tilt', 'time', 'tiny', 'tire',
  'toad', 'toes', 'told', 'tone', 'took', 'tool', 'torn', 'tour', 'town', 'trap', 'tray', 'tree', 'trek', 'trim', 'trip', 'trot', 'true',
  'tune', 'turn', 'twin', 'type', 'unit', 'upon', 'used', 'user', 'vain', 'vale', 'vast', 'veal', 'verb', 'very', 'vice', 'view', 'vine',
  'wage', 'wait', 'wake', 'walk', 'wall', 'want', 'ward', 'warm', 'warn', 'wash', 'wave', 'weak', 'wear', 'week', 'well', 'went', 'were',
  'west', 'what', 'when', 'whom', 'will', 'wind', 'wine', 'wing', 'wire', 'wise', 'wish', 'with', 'wolf', 'wood', 'wool', 'word', 'wore',
  'work', 'worm', 'worn', 'wrap', 'yard', 'yarn', 'year', 'yell', 'your', 'zero', 'zone'
];

const words = new Set(
  wordList
    .map(w => w.toLowerCase())
    .filter(w => w.length >= 3 && w.length <= 5 && /^[a-z]+$/.test(w))
);

// Build adjacency list cache at import time
const adjacencyCache = new Map<string, string[]>();

function buildCache(): void {
  for (const word of words) {
    const neighbors: string[] = [];

    // Generate all one-letter edits
    for (let i = 0; i < word.length; i++) {
      // Replace each letter
      for (let charCode = 97; charCode <= 122; charCode++) {
        const char = String.fromCharCode(charCode);
        if (char === word[i]) continue;

        const edited = word.slice(0, i) + char + word.slice(i + 1);
        if (words.has(edited)) {
          neighbors.push(edited);
        }
      }
    }

    adjacencyCache.set(word, neighbors);
  }
}

buildCache();

export function getNeighbors(word: string): string[] {
  const normalized = word.toLowerCase();
  if (!words.has(normalized)) return [];
  return adjacencyCache.get(normalized) || [];
}

export function shortestPath(start: string, end: string): string[] | null {
  const startNorm = start.toLowerCase();
  const endNorm = end.toLowerCase();

  // Validate inputs
  if (!words.has(startNorm) || !words.has(endNorm)) return null;
  if (startNorm === endNorm) return [startNorm];

  // BFS to find shortest path
  const queue: [string, string[]][] = [[startNorm, [startNorm]]];
  const visited = new Set<string>([startNorm]);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;

    for (const neighbor of adjacencyCache.get(current) || []) {
      if (neighbor === endNorm) {
        return [...path, endNorm];
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return null;
}
