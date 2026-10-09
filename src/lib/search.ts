export const INDEX_REFRESH_INTERVAL_SECONDS = 300;
export const MAX_RESULTS = 50;
export const RANKING_WEIGHTS = {
  relevance: 0.5,
  popularity: 0.3,
  recency: 0.2,
};
export const SYNONYM_EXPANSION_ENABLED = true;

export interface Product {
  id: string;
  name: string;
  category: string;
  relevance: number;
  popularity: number;
  recency: number;
  synonyms: string[];
}

const SYNONYM_MAP: Record<string, string[]> = {
  sneakers: ["running shoes", "trainers"],
  laptop: ["notebook", "computer"],
  headphones: ["earbuds", "earphones"],
};

/** Mirrors backend/search.py's search_products(): filters, ranks, caps at MAX_RESULTS. */
export function searchProducts(query: string, catalog: Product[]): Product[] {
  const terms = expandQuery(query.trim().toLowerCase());
  const candidates = queryIndex(terms, catalog);
  const ranked = rank(candidates);
  return ranked.slice(0, MAX_RESULTS);
}

function expandQuery(query: string): string[] {
  if (!query) return [];
  if (!SYNONYM_EXPANSION_ENABLED) return [query];

  const expanded = new Set([query]);
  for (const [term, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (query.includes(term) || synonyms.some((s) => query.includes(s))) {
      expanded.add(term);
      synonyms.forEach((s) => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

function queryIndex(terms: string[], catalog: Product[]): Product[] {
  if (terms.length === 0) return catalog;
  return catalog.filter((product) =>
    terms.some(
      (term) =>
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.synonyms.some((s) => s.toLowerCase().includes(term))
    )
  );
}

function rank(candidates: Product[]): Product[] {
  const score = (item: Product) =>
    item.relevance * RANKING_WEIGHTS.relevance +
    item.popularity * RANKING_WEIGHTS.popularity +
    item.recency * RANKING_WEIGHTS.recency;

  return [...candidates].sort((a, b) => score(b) - score(a));
}
