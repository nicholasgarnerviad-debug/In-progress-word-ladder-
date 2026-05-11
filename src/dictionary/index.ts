import { words3 } from './words3';
import { words4 } from './words4';
import { words5 } from './words5';
import { words6 } from './words6';
import { words7 } from './words7';

function normalize(raw: string[]): string[] {
  return raw
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length >= 3 && w.length <= 7 && /^[a-z]+$/.test(w))
    .filter((w, i, arr) => arr.indexOf(w) === i); // remove duplicates
}

export const ALL_WORDS: string[] = [
  ...normalize(words3),
  ...normalize(words4),
  ...normalize(words5),
  ...normalize(words6),
  ...normalize(words7),
];

export const WORD_SET: Set<string> = new Set(ALL_WORDS);

const _byLength = new Map<number, string[]>();
for (const w of ALL_WORDS) {
  const len = w.length;
  if (!_byLength.has(len)) {
    _byLength.set(len, []);
  }
  _byLength.get(len)!.push(w);
}

export function getWordsByLength(length: number): string[] {
  return _byLength.get(length) ?? [];
}
