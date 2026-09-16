import * as EntryRepository from './EntryRepository';
import * as ListRepository from './ListRepository';
import * as SettingsRepository from './SettingsRepository';

describe('Repositories Integration with SQLite Store', () => {
  beforeEach(() => {
    // Clear the in-memory mock db
    global.__mockDb.execSync('DELETE FROM entries');
  });

  describe('EntryRepository', () => {
    it('inserts and retrieves entries correctly', async () => {
      const entry = {
        id: 'entry-1',
        text: 'Test task',
        type: 'task',
        status: 'open',
        date: '2026-09-16',
        completedAt: null,
        listId: null,
        order_index: 0,
      };

      await EntryRepository.insertEntry(entry);
      const all = await EntryRepository.getAllEntries();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('entry-1');
      expect(all[0].text).toBe('Test task');
    });

    it('inserts entry with defaults for order_index and completedAt', async () => {
      const entry = {
        id: 'entry-default',
        text: 'Default task',
        type: 'task',
        status: 'open',
        date: '2026-09-16',
      };
      await EntryRepository.insertEntry(entry);
      const all = await EntryRepository.getAllEntries();
      expect(all[0].order_index).toBe(0);
      expect(all[0].completedAt).toBeNull();
    });

    it('updates entry status and completedAt', async () => {
      const entry = {
        id: 'entry-2',
        text: 'Task to complete',
        type: 'task',
        status: 'open',
        date: '2026-09-16',
        completedAt: null,
        listId: null,
        order_index: 0,
      };
      await EntryRepository.insertEntry(entry);
      await EntryRepository.updateEntryStatus('entry-2', 'completed', '2026-09-16');

      const all = await EntryRepository.getAllEntries();
      expect(all[0].status).toBe('completed');
      expect(all[0].completedAt).toBe('2026-09-16');
    });

    it('updates entry date', async () => {
      const entry = {
        id: 'entry-3',
        text: 'Migrated task',
        type: 'task',
        status: 'open',
        date: '2026-09-16',
        completedAt: null,
        listId: null,
        order_index: 0,
      };
      await EntryRepository.insertEntry(entry);
      await EntryRepository.updateEntryDate('entry-3', '2026-09-17');

      const all = await EntryRepository.getAllEntries();
      expect(all[0].date).toBe('2026-09-17');
    });

    it('updates entry order_index', async () => {
      const entry = {
        id: 'entry-4',
        text: 'Reordered task',
        type: 'task',
        status: 'open',
        date: '2026-09-16',
        completedAt: null,
        listId: null,
        order_index: 0,
      };
      await EntryRepository.insertEntry(entry);
      await EntryRepository.updateEntryOrder('entry-4', 5);

      const all = await EntryRepository.getAllEntries();
      expect(all[0].order_index).toBe(5);
    });

    it('deletes entry by id', async () => {
      const entry = {
        id: 'entry-to-del',
        text: 'Task to delete',
        type: 'task',
        status: 'open',
        date: '2026-09-16',
        completedAt: null,
        listId: null,
        order_index: 0,
      };
      await EntryRepository.insertEntry(entry);
      await EntryRepository.deleteEntryById('entry-to-del');

      const all = await EntryRepository.getAllEntries();
      expect(all).toHaveLength(0);
    });

    it('deletes entries by listId', async () => {
      const entry1 = {
        id: 'entry-list-1',
        text: 'List item 1',
        type: 'task',
        status: 'open',
        date: '2026-09-16',
        completedAt: null,
        listId: 'list-123',
        order_index: 0,
      };
      const entry2 = {
        id: 'entry-list-2',
        text: 'Daily item',
        type: 'task',
        status: 'open',
        date: '2026-09-16',
        completedAt: null,
        listId: null,
        order_index: 1,
      };
      await EntryRepository.insertEntry(entry1);
      await EntryRepository.insertEntry(entry2);

      await EntryRepository.deleteEntriesByListId('list-123');

      const all = await EntryRepository.getAllEntries();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('entry-list-2');
    });
  });

  describe('ListRepository', () => {
    it('inserts, retrieves, updates order, and deletes lists', async () => {
      const list = {
        id: 'list-abc',
        title: 'Groceries',
        order_index: 0,
      };
      await ListRepository.insertList(list);

      let lists = await ListRepository.getAllLists();
      expect(lists).toHaveLength(1);
      expect(lists[0].title).toBe('Groceries');

      await ListRepository.updateListOrder('list-abc', 3);
      lists = await ListRepository.getAllLists();
      expect(lists[0].order_index).toBe(3);

      await ListRepository.deleteList('list-abc');
      lists = await ListRepository.getAllLists();
      expect(lists).toHaveLength(0);
    });
  });

  describe('SettingsRepository', () => {
    it('saves and retrieves user settings', async () => {
      await SettingsRepository.saveSetting('themePreference', 'dark');
      await SettingsRepository.saveSetting('customConfig', { fontSize: 16 });

      const settings = await SettingsRepository.getAllSettings();
      expect(settings.themePreference).toBe('dark');
      expect(settings.customConfig).toBe(JSON.stringify({ fontSize: 16 }));
    });
  });
});
