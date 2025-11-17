/**
 * Tests for search utility functions
 */

import {
  normalizeText,
  fuzzyMatch,
  containsText,
  getSearchScore,
  searchReciters,
  filterReciters,
  sortReciters,
  getUniqueStyles,
  getUniqueCountries,
  searchSurahs,
  filterSurahs,
  sortSurahs,
  searchLibrary,
  debounce,
} from '../searchUtils';
import {Reciter, Surah, Download} from '../types';

// Mock data
const mockReciters: Reciter[] = [
  {
    id: '1',
    nameEnglish: 'Abdul Basit',
    nameArabic: 'عبد الباسط عبد الصمد',
    photo: '',
    bio: 'Renowned Egyptian reciter',
    style: 'Murattal',
    country: 'Egypt',
    sources: [],
  },
  {
    id: '2',
    nameEnglish: 'Mishary Alafasy',
    nameArabic: 'مشاري بن راشد العفاسي',
    photo: '',
    bio: 'Popular Kuwaiti reciter',
    style: 'Mujawwad',
    country: 'Kuwait',
    sources: [],
  },
  {
    id: '3',
    nameEnglish: 'Saad Al-Ghamdi',
    nameArabic: 'سعد الغامدي',
    photo: '',
    bio: 'Saudi reciter',
    style: 'Murattal',
    country: 'Saudi Arabia',
    sources: [],
  },
];

const mockSurahs: Surah[] = [
  {
    id: 1,
    nameEnglish: 'Al-Fatihah',
    nameArabic: 'الفاتحة',
    transliteration: 'Al-Faatiha',
    revelationPlace: 'Makkah',
    numberOfAyahs: 7,
    duration: 60, // 1 minute
  },
  {
    id: 2,
    nameEnglish: 'Al-Baqarah',
    nameArabic: 'البقرة',
    transliteration: 'Al-Baqara',
    revelationPlace: 'Madinah',
    numberOfAyahs: 286,
    duration: 720, // 12 minutes
  },
  {
    id: 114,
    nameEnglish: 'An-Nas',
    nameArabic: 'الناس',
    transliteration: 'An-Naas',
    revelationPlace: 'Makkah',
    numberOfAyahs: 6,
    duration: 45, // < 1 minute
  },
];

const mockDownloads: Download[] = [
  {
    id: 'd1',
    reciterId: '1',
    surahId: 1,
    sourceId: 's1',
    quality: 'high' as any,
    fileSize: 1000000,
    localPath: '/path/to/file',
    downloadedAt: Date.now(),
    status: 'completed' as any,
  },
  {
    id: 'd2',
    reciterId: '1',
    surahId: 2,
    sourceId: 's1',
    quality: 'high' as any,
    fileSize: 2000000,
    localPath: '/path/to/file2',
    downloadedAt: Date.now(),
    status: 'completed' as any,
  },
];

describe('Text Normalization', () => {
  test('normalizeText removes diacritics and converts to lowercase', () => {
    expect(normalizeText('Café')).toBe('cafe');
    expect(normalizeText('HELLO')).toBe('hello');
    expect(normalizeText('naïve')).toBe('naive');
  });

  test('containsText works case-insensitively', () => {
    expect(containsText('Abdul Basit', 'basit')).toBe(true);
    expect(containsText('Abdul Basit', 'ABDUL')).toBe(true);
    expect(containsText('Abdul Basit', 'xyz')).toBe(false);
  });
});

describe('Fuzzy Matching', () => {
  test('fuzzyMatch returns true for matching patterns', () => {
    expect(fuzzyMatch('abs', 'Abdul Basit')).toBe(true);
    expect(fuzzyMatch('fatih', 'Al-Fatihah')).toBe(true);
    expect(fuzzyMatch('xyz', 'Abdul Basit')).toBe(false);
  });

  test('fuzzyMatch handles empty queries', () => {
    expect(fuzzyMatch('', 'any text')).toBe(true);
  });
});

describe('Search Score', () => {
  test('getSearchScore returns higher scores for better matches', () => {
    const exactScore = getSearchScore('basit', 'basit');
    const startsWithScore = getSearchScore('abdul', 'Abdul Basit');
    const containsScore = getSearchScore('basit', 'Abdul Basit');
    const fuzzyScore = getSearchScore('abs', 'Abdul Basit');

    expect(exactScore).toBeGreaterThan(startsWithScore);
    expect(startsWithScore).toBeGreaterThan(containsScore);
    expect(containsScore).toBeGreaterThan(fuzzyScore);
  });
});

describe('Reciter Search', () => {
  test('searchReciters finds reciters by English name', () => {
    const results = searchReciters(mockReciters, 'Abdul');
    expect(results).toHaveLength(1);
    expect(results[0].nameEnglish).toBe('Abdul Basit');
  });

  test('searchReciters finds reciters by Arabic name', () => {
    const results = searchReciters(mockReciters, 'عبد');
    expect(results.length).toBeGreaterThan(0);
  });

  test('searchReciters returns all reciters for empty query', () => {
    const results = searchReciters(mockReciters, '');
    expect(results).toHaveLength(mockReciters.length);
  });

  test('searchReciters sorts results by relevance', () => {
    const results = searchReciters(mockReciters, 'a');
    expect(results.length).toBeGreaterThan(0);
    // All reciters match 'a', but order should be by relevance
  });
});

describe('Reciter Filtering', () => {
  test('filterReciters filters by style', () => {
    const results = filterReciters(mockReciters, {style: 'Murattal'});
    expect(results).toHaveLength(2);
    expect(results.every(r => r.style === 'Murattal')).toBe(true);
  });

  test('filterReciters filters by country', () => {
    const results = filterReciters(mockReciters, {country: 'Egypt'});
    expect(results).toHaveLength(1);
    expect(results[0].country).toBe('Egypt');
  });

  test('filterReciters filters by both style and country', () => {
    const results = filterReciters(mockReciters, {
      style: 'Murattal',
      country: 'Egypt',
    });
    expect(results).toHaveLength(1);
    expect(results[0].nameEnglish).toBe('Abdul Basit');
  });
});

describe('Reciter Sorting', () => {
  test('sortReciters sorts by name ascending', () => {
    const results = sortReciters(mockReciters, 'name-asc');
    expect(results[0].nameEnglish).toBe('Abdul Basit');
    expect(results[results.length - 1].nameEnglish).toBe('Saad Al-Ghamdi');
  });

  test('sortReciters sorts by name descending', () => {
    const results = sortReciters(mockReciters, 'name-desc');
    expect(results[0].nameEnglish).toBe('Saad Al-Ghamdi');
    expect(results[results.length - 1].nameEnglish).toBe('Abdul Basit');
  });
});

describe('Unique Values', () => {
  test('getUniqueStyles returns unique styles', () => {
    const styles = getUniqueStyles(mockReciters);
    expect(styles).toContain('Murattal');
    expect(styles).toContain('Mujawwad');
    expect(styles.length).toBe(2);
  });

  test('getUniqueCountries returns unique countries', () => {
    const countries = getUniqueCountries(mockReciters);
    expect(countries).toContain('Egypt');
    expect(countries).toContain('Kuwait');
    expect(countries).toContain('Saudi Arabia');
    expect(countries.length).toBe(3);
  });
});

describe('Surah Search', () => {
  test('searchSurahs finds surahs by English name', () => {
    const results = searchSurahs(mockSurahs, 'Fatihah');
    expect(results).toHaveLength(1);
    expect(results[0].nameEnglish).toBe('Al-Fatihah');
  });

  test('searchSurahs finds surahs by Arabic name', () => {
    const results = searchSurahs(mockSurahs, 'الفاتحة');
    expect(results).toHaveLength(1);
    expect(results[0].nameEnglish).toBe('Al-Fatihah');
  });

  test('searchSurahs finds surahs by transliteration', () => {
    const results = searchSurahs(mockSurahs, 'Faatiha');
    expect(results).toHaveLength(1);
    expect(results[0].nameEnglish).toBe('Al-Fatihah');
  });

  test('searchSurahs finds surahs by number', () => {
    const results = searchSurahs(mockSurahs, '114');
    expect(results).toHaveLength(1);
    expect(results[0].nameEnglish).toBe('An-Nas');
  });

  test('searchSurahs returns all surahs for empty query', () => {
    const results = searchSurahs(mockSurahs, '');
    expect(results).toHaveLength(mockSurahs.length);
  });
});

describe('Surah Filtering', () => {
  test('filterSurahs filters by length (short)', () => {
    const results = filterSurahs(mockSurahs, {length: 'short'});
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(s => {
      const duration = s.duration || (s.numberOfAyahs * 10);
      return duration / 60 < 2;
    })).toBe(true);
  });

  test('filterSurahs filters by length (long)', () => {
    const results = filterSurahs(mockSurahs, {length: 'long'});
    expect(results).toHaveLength(1);
    expect(results[0].nameEnglish).toBe('Al-Baqarah');
  });

  test('filterSurahs filters by revelation place', () => {
    const results = filterSurahs(mockSurahs, {revelationPlace: 'Makkah'});
    expect(results).toHaveLength(2);
    expect(results.every(s => s.revelationPlace === 'Makkah')).toBe(true);
  });

  test('filterSurahs filters by downloaded status', () => {
    const results = filterSurahs(mockSurahs, {downloaded: true}, mockDownloads);
    expect(results).toHaveLength(2);
    expect(results.map(s => s.id)).toContain(1);
    expect(results.map(s => s.id)).toContain(2);
  });

  test('filterSurahs filters by not downloaded status', () => {
    const results = filterSurahs(mockSurahs, {downloaded: false}, mockDownloads);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(114);
  });

  test('filterSurahs filters by favorites', () => {
    const favorites = [1, 114];
    const results = filterSurahs(mockSurahs, {favorite: true}, undefined, favorites);
    expect(results).toHaveLength(2);
    expect(results.map(s => s.id)).toContain(1);
    expect(results.map(s => s.id)).toContain(114);
  });
});

describe('Surah Sorting', () => {
  test('sortSurahs sorts by number ascending', () => {
    const results = sortSurahs(mockSurahs, 'number-asc');
    expect(results[0].id).toBe(1);
    expect(results[results.length - 1].id).toBe(114);
  });

  test('sortSurahs sorts by number descending', () => {
    const results = sortSurahs(mockSurahs, 'number-desc');
    expect(results[0].id).toBe(114);
    expect(results[results.length - 1].id).toBe(1);
  });

  test('sortSurahs sorts by name ascending', () => {
    const results = sortSurahs(mockSurahs, 'name-asc');
    expect(results[0].nameEnglish).toBe('Al-Baqarah');
  });

  test('sortSurahs sorts by length ascending', () => {
    const results = sortSurahs(mockSurahs, 'length-asc');
    expect(results[0].id).toBe(114); // Shortest
    expect(results[results.length - 1].id).toBe(2); // Longest
  });

  test('sortSurahs sorts by length descending', () => {
    const results = sortSurahs(mockSurahs, 'length-desc');
    expect(results[0].id).toBe(2); // Longest
    expect(results[results.length - 1].id).toBe(114); // Shortest
  });
});

describe('Library Search', () => {
  test('searchLibrary finds reciters with downloads', () => {
    const results = searchLibrary(mockReciters, mockSurahs, mockDownloads, '');
    expect(results).toHaveLength(1);
    expect(results[0].reciter.id).toBe('1');
    expect(results[0].downloadCount).toBe(2);
  });

  test('searchLibrary filters by reciter name', () => {
    const results = searchLibrary(mockReciters, mockSurahs, mockDownloads, 'Abdul');
    expect(results).toHaveLength(1);
    expect(results[0].reciter.nameEnglish).toBe('Abdul Basit');
    expect(results[0].matchedSurahs).toHaveLength(2);
  });

  test('searchLibrary filters by surah name', () => {
    const results = searchLibrary(mockReciters, mockSurahs, mockDownloads, 'Fatihah');
    expect(results).toHaveLength(1);
    expect(results[0].matchedSurahs).toHaveLength(1);
    expect(results[0].matchedSurahs[0].nameEnglish).toBe('Al-Fatihah');
  });

  test('searchLibrary returns empty for no matches', () => {
    const results = searchLibrary(mockReciters, mockSurahs, mockDownloads, 'xyz123');
    expect(results).toHaveLength(0);
  });
});

describe('Debounce', () => {
  jest.useFakeTimers();

  test('debounce delays function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('debounce cancels previous calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('first');
    jest.advanceTimersByTime(200);
    debouncedFn('second');
    jest.advanceTimersByTime(200);
    debouncedFn('third');
    jest.advanceTimersByTime(500);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third');
  });

  jest.useRealTimers();
});
