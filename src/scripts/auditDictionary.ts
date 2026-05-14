import { getWordsByLength } from '../dictionary';
import { getNeighbors } from '../wordGraph';

function findConnectedComponents(words: string[]): number[][] {
  const visited = new Set<string>();
  const components: number[][] = [];

  for (let i = 0; i < words.length; i++) {
    if (visited.has(words[i])) continue;

    const component: number[] = [];
    const queue = [words[i]];
    visited.add(words[i]);

    while (queue.length > 0) {
      const word = queue.shift()!;
      const idx = words.indexOf(word);
      component.push(idx);

      for (const neighbor of getNeighbors(word)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  return components;
}

export function auditDictionary(): void {
  console.log('\n=== DICTIONARY CONNECTIVITY AUDIT ===\n');

  for (const length of [3, 4, 5, 6, 7] as const) {
    const words = getWordsByLength(length);
    const orphans = words.filter(w => getNeighbors(w).length === 0);
    const components = findConnectedComponents(words);
    const largestComponent = components.reduce((max, comp) =>
      comp.length > max.length ? comp : max, []
    );

    const smallIslands = components.filter(c => c.length > 0 && c.length < 5);

    console.log(`\n${length}-letter words:`);
    console.log(`  Total: ${words.length}`);
    console.log(`  Connected components: ${components.length}`);
    console.log(`  Largest component: ${largestComponent.length} (${(largestComponent.length / words.length * 100).toFixed(1)}%)`);
    console.log(`  Orphans (0 neighbors): ${orphans.length}`);
    if (orphans.length > 0 && orphans.length <= 20) {
      console.log(`    ${orphans.join(', ')}`);
    }
    console.log(`  Small islands (1-4 words): ${smallIslands.length}`);
    if (smallIslands.length > 0 && smallIslands.length <= 5) {
      smallIslands.forEach(island => {
        console.log(`    [${island.map(idx => words[idx]).join(', ')}]`);
      });
    }
  }
}

if (require.main === module) {
  auditDictionary();
}
