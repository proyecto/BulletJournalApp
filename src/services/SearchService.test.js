import { searchEntries } from './SearchService';

describe('SearchService', () => {
  const mockEntries = [
    { id: '1', text: 'Comprar leche', date: '2026-09-16', type: 'task', status: 'open' },
    { id: '2', text: 'Comprar pan', date: '2026-09-15', type: 'task', status: 'completed', completedAt: '2026-09-15' },
    { id: '3', text: 'Reunión equipo', date: '2026-09-17', type: 'event', status: 'open' },
    { id: '4', text: 'Idea de proyecto', listId: 'list-1', type: 'note' },
  ];

  const mockLists = [
    { id: 'list-1', name: 'Ideas' },
  ];

  it('returns empty array when entries is invalid or query is empty', () => {
    expect(searchEntries(null, mockLists, 'comprar')).toEqual([]);
    expect(searchEntries(mockEntries, mockLists, '')).toEqual([]);
    expect(searchEntries(mockEntries, mockLists, '   ')).toEqual([]);
  });

  it('filters entries matching case-insensitive query', () => {
    const results = searchEntries(mockEntries, mockLists, 'comprar');
    expect(results).toHaveLength(2);
    expect(results.map(r => r.id)).toContain('1');
    expect(results.map(r => r.id)).toContain('2');
  });

  it('enriches custom list items with listName', () => {
    const results = searchEntries(mockEntries, mockLists, 'proyecto');
    expect(results).toHaveLength(1);
    expect(results[0].listName).toBe('Ideas');
  });

  it('prioritizes matches that start with query term', () => {
    const results = searchEntries(mockEntries, mockLists, 'reunión');
    expect(results[0].id).toBe('3');
  });
});
