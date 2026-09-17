import { generateMarkdownString } from './ExportImportService';

describe('ExportImportService', () => {
  const sampleEntries = [
    {
      id: '1',
      text: 'Task Priority',
      type: 'task',
      status: 'open',
      date: '2026-09-17',
      signifier: 'priority',
      listId: null,
    },
    {
      id: '2',
      text: 'Note Inspiration',
      type: 'note',
      status: 'open',
      date: '2026-09-17',
      signifier: 'inspiration',
      listId: null,
    },
    {
      id: '3',
      text: 'Item in List',
      type: 'task',
      status: 'completed',
      date: '2026-09-17',
      signifier: null,
      listId: 'list-1',
    },
  ];

  const sampleLists = [
    {
      id: 'list-1',
      title: 'Work Project',
      order_index: 0,
    },
  ];

  describe('generateMarkdownString', () => {
    it('generates valid markdown document in Spanish', () => {
      const md = generateMarkdownString(sampleEntries, sampleLists, 'es');

      expect(md).toContain('# Bullet Journal');
      expect(md).toContain('## Registros Diarios');
      expect(md).toContain('### 2026-09-17');
      expect(md).toContain('- [ ] * Task Priority');
      expect(md).toContain('- ! Note Inspiration');
      expect(md).toContain('## Listas y Colecciones');
      expect(md).toContain('### Work Project');
      expect(md).toContain('- [x] Item in List');
    });

    it('generates valid markdown document in English', () => {
      const md = generateMarkdownString(sampleEntries, sampleLists, 'en');

      expect(md).toContain('## Daily Logs');
      expect(md).toContain('## Collections');
    });

    it('handles empty entries and lists gracefully', () => {
      const md = generateMarkdownString([], [], 'es');

      expect(md).toContain('No hay registros diarios.');
      expect(md).toContain('No hay listas personalizadas.');
    });
  });
});
