import { Item } from '../types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'for',
  'of', 'and', 'or', 'my', 'i', 'was', 'are', 'be', 'been',
  'this', 'that', 'with', 'have', 'had', 'not', 'but', 'from',
]);

export const extractKeywords = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
};

export interface MatchResult extends Item {
  score: number;
}

export const scoreMatches = (sourceItem: Item, candidates: Item[]): MatchResult[] => {
  return candidates
    .map((candidate) => {
      const overlap = sourceItem.keywords.filter((k) =>
        candidate.keywords.includes(k)
      ).length;
      return { ...candidate, score: overlap };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};
