/**
 * Search and filter utility functions
 * Provides fuzzy search, filtering, and sorting for Reciters and Surahs
 */

import {Reciter, Surah, Download} from './types';

/**
 * Normalizes text for search by removing diacritics and converting to lowercase
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
};

/**
 * Simple fuzzy matching algorithm
 * Returns true if all characters of query appear in target in order (case insensitive)
 */
export const fuzzyMatch = (query: string, target: string): boolean => {
  if (!query) return true;
  if (!target) return false;

  const normalizedQuery = normalizeText(query);
  const normalizedTarget = normalizeText(target);

  let queryIndex = 0;
  let targetIndex = 0;

  while (queryIndex < normalizedQuery.length && targetIndex < normalizedTarget.length) {
    if (normalizedQuery[queryIndex] === normalizedTarget[targetIndex]) {
      queryIndex++;
    }
    targetIndex++;
  }

  return queryIndex === normalizedQuery.length;
};

/**
 * Checks if text contains query (case insensitive, diacritic insensitive)
 */
export const containsText = (text: string, query: string): boolean => {
  if (!query) return true;
  if (!text) return false;

  return normalizeText(text).includes(normalizeText(query));
};

/**
 * Get search relevance score (higher is better)
 */
export const getSearchScore = (query: string, text: string): number => {
  if (!query) return 0;
  if (!text) return 0;

  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);

  // Exact match gets highest score
  if (normalizedText === normalizedQuery) return 100;

  // Starts with query gets high score
  if (normalizedText.startsWith(normalizedQuery)) return 80;

  // Contains query gets medium score
  if (normalizedText.includes(normalizedQuery)) return 50;

  // Fuzzy match gets lower score
  if (fuzzyMatch(query, text)) return 20;

  return 0;
};

// ==================== RECITER SEARCH & FILTER ====================

export interface ReciterFilters {
  style?: string;
  country?: string;
}

export type ReciterSortOption = 'name-asc' | 'name-desc' | 'popular' | 'recent';

/**
 * Search reciters by name (Arabic or English)
 */
export const searchReciters = (
  reciters: Reciter[],
  query: string
): Reciter[] => {
  if (!query.trim()) return reciters;

  return reciters
    .filter(reciter =>
      containsText(reciter.nameEnglish, query) ||
      containsText(reciter.nameArabic, query)
    )
    .sort((a, b) => {
      // Sort by relevance
      const scoreA = Math.max(
        getSearchScore(query, a.nameEnglish),
        getSearchScore(query, a.nameArabic)
      );
      const scoreB = Math.max(
        getSearchScore(query, b.nameEnglish),
        getSearchScore(query, b.nameArabic)
      );
      return scoreB - scoreA;
    });
};

/**
 * Filter reciters by style and/or country
 */
export const filterReciters = (
  reciters: Reciter[],
  filters: ReciterFilters
): Reciter[] => {
  let filtered = [...reciters];

  if (filters.style) {
    filtered = filtered.filter(r =>
      normalizeText(r.style) === normalizeText(filters.style!)
    );
  }

  if (filters.country) {
    filtered = filtered.filter(r =>
      normalizeText(r.country) === normalizeText(filters.country!)
    );
  }

  return filtered;
};

/**
 * Sort reciters by various criteria
 */
export const sortReciters = (
  reciters: Reciter[],
  sortBy: ReciterSortOption
): Reciter[] => {
  const sorted = [...reciters];

  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) =>
        a.nameEnglish.localeCompare(b.nameEnglish)
      );

    case 'name-desc':
      return sorted.sort((a, b) =>
        b.nameEnglish.localeCompare(a.nameEnglish)
      );

    case 'popular':
      // TODO: Implement popularity metric (could be based on downloads, plays, etc.)
      // For now, just return as is
      return sorted;

    case 'recent':
      // TODO: Implement recently added tracking
      // For now, return reversed (assuming later entries are more recent)
      return sorted.reverse();

    default:
      return sorted;
  }
};

/**
 * Get unique styles from reciters list
 */
export const getUniqueStyles = (reciters: Reciter[]): string[] => {
  const styles = new Set(reciters.map(r => r.style));
  return Array.from(styles).sort();
};

/**
 * Get unique countries from reciters list
 */
export const getUniqueCountries = (reciters: Reciter[]): string[] => {
  const countries = new Set(reciters.map(r => r.country));
  return Array.from(countries).sort();
};

// ==================== SURAH SEARCH & FILTER ====================

export interface SurahFilters {
  length?: 'short' | 'medium' | 'long'; // <2min, 2-10min, >10min
  revelationPlace?: 'Makkah' | 'Madinah';
  downloaded?: boolean;
  favorite?: boolean;
}

export type SurahSortOption = 'number-asc' | 'number-desc' | 'name-asc' | 'name-desc' | 'length-asc' | 'length-desc';

/**
 * Search surahs by name, transliteration, or number
 */
export const searchSurahs = (
  surahs: Surah[],
  query: string
): Surah[] => {
  if (!query.trim()) return surahs;

  const numericQuery = parseInt(query, 10);
  const isNumeric = !isNaN(numericQuery);

  return surahs
    .filter(surah => {
      // Search by number
      if (isNumeric && surah.id === numericQuery) return true;

      // Search by name or transliteration
      return (
        containsText(surah.nameEnglish, query) ||
        containsText(surah.nameArabic, query) ||
        containsText(surah.transliteration, query)
      );
    })
    .sort((a, b) => {
      // If searching by number, exact match comes first
      if (isNumeric) {
        if (a.id === numericQuery) return -1;
        if (b.id === numericQuery) return 1;
      }

      // Sort by relevance
      const scoreA = Math.max(
        getSearchScore(query, a.nameEnglish),
        getSearchScore(query, a.nameArabic),
        getSearchScore(query, a.transliteration)
      );
      const scoreB = Math.max(
        getSearchScore(query, b.nameEnglish),
        getSearchScore(query, b.nameArabic),
        getSearchScore(query, b.transliteration)
      );
      return scoreB - scoreA;
    });
};

/**
 * Filter surahs by various criteria
 */
export const filterSurahs = (
  surahs: Surah[],
  filters: SurahFilters,
  downloads?: Download[],
  favorites?: number[]
): Surah[] => {
  let filtered = [...surahs];

  // Filter by length (based on duration or number of ayahs as fallback)
  if (filters.length) {
    filtered = filtered.filter(surah => {
      const duration = surah.duration || (surah.numberOfAyahs * 10); // Estimate 10 sec per ayah
      const durationMinutes = duration / 60;

      switch (filters.length) {
        case 'short':
          return durationMinutes < 2;
        case 'medium':
          return durationMinutes >= 2 && durationMinutes <= 10;
        case 'long':
          return durationMinutes > 10;
        default:
          return true;
      }
    });
  }

  // Filter by revelation place
  if (filters.revelationPlace) {
    filtered = filtered.filter(s =>
      s.revelationPlace === filters.revelationPlace
    );
  }

  // Filter by downloaded status
  if (filters.downloaded !== undefined && downloads) {
    const downloadedSurahIds = new Set(
      downloads
        .filter(d => d.status === 'completed')
        .map(d => d.surahId)
    );

    filtered = filtered.filter(s =>
      filters.downloaded
        ? downloadedSurahIds.has(s.id)
        : !downloadedSurahIds.has(s.id)
    );
  }

  // Filter by favorite status
  if (filters.favorite !== undefined && favorites) {
    const favSet = new Set(favorites);
    filtered = filtered.filter(s =>
      filters.favorite
        ? favSet.has(s.id)
        : !favSet.has(s.id)
    );
  }

  return filtered;
};

/**
 * Sort surahs by various criteria
 */
export const sortSurahs = (
  surahs: Surah[],
  sortBy: SurahSortOption
): Surah[] => {
  const sorted = [...surahs];

  switch (sortBy) {
    case 'number-asc':
      return sorted.sort((a, b) => a.id - b.id);

    case 'number-desc':
      return sorted.sort((a, b) => b.id - a.id);

    case 'name-asc':
      return sorted.sort((a, b) =>
        a.nameEnglish.localeCompare(b.nameEnglish)
      );

    case 'name-desc':
      return sorted.sort((a, b) =>
        b.nameEnglish.localeCompare(a.nameEnglish)
      );

    case 'length-asc':
      return sorted.sort((a, b) => {
        const durationA = a.duration || (a.numberOfAyahs * 10);
        const durationB = b.duration || (b.numberOfAyahs * 10);
        return durationA - durationB;
      });

    case 'length-desc':
      return sorted.sort((a, b) => {
        const durationA = a.duration || (a.numberOfAyahs * 10);
        const durationB = b.duration || (b.numberOfAyahs * 10);
        return durationB - durationA;
      });

    default:
      return sorted;
  }
};

// ==================== LIBRARY SEARCH ====================

export interface LibrarySearchResult {
  reciter: Reciter;
  matchedSurahs: Surah[];
  downloadCount: number;
}

/**
 * Search library (downloaded content) across reciters and surahs
 */
export const searchLibrary = (
  reciters: Reciter[],
  surahs: Surah[],
  downloads: Download[],
  query: string
): LibrarySearchResult[] => {
  if (!query.trim()) {
    // Return all reciters with their downloaded surahs
    return reciters
      .map(reciter => {
        const reciterDownloads = downloads.filter(
          d => d.reciterId === reciter.id && d.status === 'completed'
        );
        const downloadedSurahIds = new Set(reciterDownloads.map(d => d.surahId));
        const matchedSurahs = surahs.filter(s => downloadedSurahIds.has(s.id));

        return {
          reciter,
          matchedSurahs,
          downloadCount: reciterDownloads.length,
        };
      })
      .filter(result => result.downloadCount > 0);
  }

  const results: LibrarySearchResult[] = [];

  for (const reciter of reciters) {
    const reciterDownloads = downloads.filter(
      d => d.reciterId === reciter.id && d.status === 'completed'
    );

    if (reciterDownloads.length === 0) continue;

    // Check if reciter name matches
    const reciterMatches =
      containsText(reciter.nameEnglish, query) ||
      containsText(reciter.nameArabic, query);

    // Get downloaded surahs
    const downloadedSurahIds = new Set(reciterDownloads.map(d => d.surahId));
    const downloadedSurahs = surahs.filter(s => downloadedSurahIds.has(s.id));

    // Filter surahs by query
    const matchedSurahs = reciterMatches
      ? downloadedSurahs // If reciter matches, include all downloaded surahs
      : searchSurahs(downloadedSurahs, query); // Otherwise filter surahs

    if (matchedSurahs.length > 0) {
      results.push({
        reciter,
        matchedSurahs,
        downloadCount: reciterDownloads.length,
      });
    }
  }

  return results;
};

/**
 * Debounce function for search input
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
