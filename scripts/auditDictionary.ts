import { WORD_SET } from '../src/dictionary';
import { getNeighbors } from '../src/wordGraph';

interface ConnectedComponent {
  size: number;
  words: string[];
}

function findConnectedComponents(words: string[]): ConnectedComponent[] {
  const visited = new Set<string>();
  const components: ConnectedComponent[] = [];

  for (const word of words) {
    if (visited.has(word)) continue;

    const component: string[] = [];
    const queue: string[] = [word];
    visited.add(word);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      for (const neighbor of getNeighbors(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push({ size: component.length, words: component });
  }

  return components;
}

function auditDictionary() {
  console.log('\n📊 WORD LADDER DICTIONARY AUDIT\n');
  console.log(`Total words: ${WORD_SET.size}\n`);

  for (const wordLength of [3, 4, 5, 6, 7]) {
    const wordsOfLength = Array.from(WORD_SET).filter(w => w.length === wordLength);

    if (wordsOfLength.length === 0) {
      console.log(`${wordLength}-letter words: none\n`);
      continue;
    }

    console.log(`\n${wordLength}-letter words: ${wordsOfLength.length}`);

    // Find orphans
    const orphans = wordsOfLength.filter(w => getNeighbors(w).length === 0);
    if (orphans.length > 0) {
      console.log(`  ⚠️  ORPHANS (no neighbors): ${orphans.length}`);
      console.log(`      ${orphans.slice(0, 10).join(', ')}${orphans.length > 10 ? '...' : ''}`);
    }

    // Find connected components
    const components = findConnectedComponents(wordsOfLength);
    const sorted = components.sort((a, b) => b.size - a.size);

    console.log(`  Components: ${sorted.length} total`);
    console.log(`    Largest: ${sorted[0].size} words (${(sorted[0].size / wordsOfLength.length * 100).toFixed(1)}%)`);

    // Small islands
    const smallIslands = sorted.filter(c => c.size < 5 && c.size > 1);
    if (smallIslands.length > 0) {
      console.log(`  🏝️  SMALL ISLANDS (<5 words): ${smallIslands.length}`);
      for (const island of smallIslands.slice(0, 5)) {
        console.log(`      [${island.words.join(', ')}]`);
      }
      if (smallIslands.length > 5) {
        console.log(`      ...and ${smallIslands.length - 5} more`);
      }
    }

    console.log('');
  }
}

auditDictionary();
