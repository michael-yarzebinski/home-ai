export type FuzzyFindOptions = {
  /** Max matches to return (default 10). */
  limit?: number;
  /** Drop matches at or below this score (default 0.6). */
  minScore?: number;
};

export type FuzzyMatch<T> = T & { score: number };

/**
 * Rank items by fuzzy similarity of `query` against one or more string fields.
 * Handles typos (e.g. "perch" ≈ "porch") via bigram Dice + substring boost.
 */
export function fuzzyFind<T>(
  items: T[],
  query: string,
  getFields: (item: T) => Array<string | null | undefined>,
  options: FuzzyFindOptions = {},
): FuzzyMatch<T>[] {
  const limit = options.limit ?? 10;
  const minScore = options.minScore ?? 0.6;
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return [];
  }

  const scored: FuzzyMatch<T>[] = [];
  for (const item of items) {
    let best = 0;
    for (const field of getFields(item)) {
      if (field == null || field === "") continue;
      best = Math.max(best, fieldScore(normalizedQuery, normalize(field)));
    }
    if (best > minScore) {
      scored.push({ ...item, score: roundScore(best) });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function fieldScore(query: string, field: string): number {
  if (!field) return 0;
  if (field === query) return 1;
  if (field.includes(query) || query.includes(field)) {
    const shorter = Math.min(query.length, field.length);
    const longer = Math.max(query.length, field.length);
    return Math.min(0.99, 0.7 + (shorter / longer) * 0.29);
  }

  const full = diceCoefficient(query, field);

  // Token-wise: only trust the average when every query token finds a decent match.
  // Avoids "perch lights" ranking "kitchen lights" highly just because of "lights".
  const queryTokens = query.split(" ").filter(Boolean);
  if (queryTokens.length > 1) {
    const fieldTokens = field.split(" ").filter(Boolean);
    const tokenScores = queryTokens.map((token) => {
      let best = diceCoefficient(token, field);
      for (const ft of fieldTokens) {
        best = Math.max(best, diceCoefficient(token, ft));
      }
      return best;
    });
    if (tokenScores.every((s) => s >= 0.4)) {
      const avg =
        tokenScores.reduce((sum, s) => sum + s, 0) / tokenScores.length;
      return Math.max(full, avg);
    }
  }

  return full;
}

/** Sørensen–Dice coefficient over character bigrams. */
function diceCoefficient(a: string, b: string): number {
  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  if (a.length === 1 || b.length === 1) {
    return a.includes(b) || b.includes(a) ? 0.5 : 0;
  }

  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  let overlap = 0;
  const counts = new Map<string, number>();
  for (const g of bigramsA) {
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  for (const g of bigramsB) {
    const n = counts.get(g) ?? 0;
    if (n > 0) {
      overlap += 1;
      counts.set(g, n - 1);
    }
  }
  return (2 * overlap) / (bigramsA.length + bigramsB.length);
}

function bigrams(value: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < value.length - 1; i++) {
    out.push(value.slice(i, i + 2));
  }
  return out;
}

function roundScore(score: number): number {
  return Math.round(score * 1000) / 1000;
}
