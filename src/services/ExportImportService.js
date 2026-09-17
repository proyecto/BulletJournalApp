/**
 * @module ExportImportService
 * @description Servicio de exportación e importación para el Bullet Journal.
 * Soporta exportación en formato Markdown (.md) y Copia de seguridad en JSON (.json)
 * con capacidad de importación/restauración de backups.
 */

import { File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getSignifierSymbol } from './DailyLogService';
import * as EntryRepository from '../repositories/EntryRepository';
import * as ListRepository from '../repositories/ListRepository';

/**
 * Genera el contenido formateado en Markdown purista para todas las entradas y listas.
 *
 * @param {Array<Object>} entries - Array con todas las entradas de la app.
 * @param {Array<Object>} lists - Array con todas las listas personalizadas.
 * @param {string} language - Idioma del usuario ('es' | 'en').
 * @returns {string} El documento Markdown generado.
 */
export const generateMarkdownString = (entries = [], lists = [], language = 'es') => {
  const isEs = language === 'es';
  const nowStr = new Date().toISOString().split('T')[0];

  let md = `# Bullet Journal\n`;
  md += `_${isEs ? 'Exportado el' : 'Exported on'} ${nowStr}_\n\n`;
  md += `---\n\n`;

  // 1. REGISTROS DIARIOS (Agrupados por fecha)
  md += `## ${isEs ? 'Registros Diarios' : 'Daily Logs'}\n\n`;

  const dailyEntries = entries.filter(e => !e.listId);
  const groupedByDate = {};

  dailyEntries.forEach(entry => {
    const dateKey = entry.date || (isEs ? 'Sin fecha' : 'No date');
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(entry);
  });

  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  if (sortedDates.length === 0) {
    md += `_${isEs ? 'No hay registros diarios.' : 'No daily logs.'}_\n\n`;
  } else {
    sortedDates.forEach(dateStr => {
      md += `### ${dateStr}\n`;
      const dateEntries = groupedByDate[dateStr];
      dateEntries.forEach(entry => {
        const signifier = getSignifierSymbol(entry.signifier);
        const prefix = signifier ? `${signifier} ` : '';

        if (entry.type === 'note') {
          md += `- ${prefix}${entry.text}\n`;
        } else if (entry.type === 'event') {
          const isDone = entry.status === 'completed' || entry.completedAt;
          md += `- ${isDone ? '[x]' : '[ ]'} ${prefix}o ${entry.text}\n`;
        } else {
          // Tarea (task)
          const isDone = entry.status === 'completed' || entry.completedAt;
          md += `- ${isDone ? '[x]' : '[ ]'} ${prefix}${entry.text}\n`;
        }
      });
      md += `\n`;
    });
  }

  md += `---\n\n`;

  // 2. LISTAS Y COLECCIONES
  md += `## ${isEs ? 'Listas y Colecciones' : 'Collections'}\n\n`;

  if (lists.length === 0) {
    md += `_${isEs ? 'No hay listas personalizadas.' : 'No custom collections.'}_\n\n`;
  } else {
    lists.forEach(list => {
      md += `### ${list.title}\n`;
      const listItems = entries.filter(e => e.listId === list.id);

      if (listItems.length === 0) {
        md += `_${isEs ? 'Lista vacía.' : 'Empty list.'}_\n`;
      } else {
        listItems.forEach(item => {
          const signifier = getSignifierSymbol(item.signifier);
          const prefix = signifier ? `${signifier} ` : '';
          const isDone = item.status === 'completed';
          md += `- ${isDone ? '[x]' : '[ ]'} ${prefix}${item.text}\n`;
        });
      }
      md += `\n`;
    });
  }

  return md;
};

const getCacheDirectory = () => {
  if (Paths && Paths.cache && Paths.cache.uri) {
    const uri = Paths.cache.uri;
    return uri.endsWith('/') ? uri : `${uri}/`;
  }
  return FileSystem.cacheDirectory || '';
};

const writeFile = async (fileUri, content) => {
  if (File) {
    try {
      const file = new File(fileUri);
      if (typeof file.write === 'function') {
        await file.write(content);
        return file.uri || fileUri;
      }
    } catch (_) {
      // Continuar al fallback legacy
    }
  }
  if (FileSystem.writeAsStringAsync) {
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
    });
  }
  return fileUri;
};

const readFile = async (fileUri) => {
  if (File) {
    try {
      const file = new File(fileUri);
      if (typeof file.text === 'function') {
        return await file.text();
      }
    } catch (_) {
      // Continuar al fallback legacy
    }
  }
  if (FileSystem.readAsStringAsync) {
    return await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
    });
  }
  throw new Error('No readAsString function available.');
};

/**
 * Exporta todas las entradas y listas a un archivo Markdown (.md) y abre el diálogo nativo para compartir/guardar.
 *
 * @param {Array<Object>} entries
 * @param {Array<Object>} lists
 * @param {string} language
 */
export const exportToMarkdown = async (entries, lists, language = 'es') => {
  const mdContent = generateMarkdownString(entries, lists, language);
  const fileName = `BulletJournal_Export_${new Date().toISOString().split('T')[0]}.md`;
  const fileUri = `${getCacheDirectory()}${fileName}`;

  const targetUri = await writeFile(fileUri, mdContent);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(targetUri, {
      mimeType: 'text/markdown',
      dialogTitle: language === 'es' ? 'Exportar Bullet Journal (Markdown)' : 'Export Bullet Journal (Markdown)',
      UTI: 'net.daringfireball.markdown',
    });
  }
};

/**
 * Exporta todas las entradas y listas a un archivo JSON de copia de seguridad y abre el diálogo nativo para compartir/guardar.
 *
 * @param {Array<Object>} entries
 * @param {Array<Object>} lists
 * @param {Object} [settings]
 * @param {string} [language='es']
 */
export const exportToJSON = async (entries, lists, settings = {}, language = 'es') => {
  const backupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    entries,
    lists,
    settings,
  };

  const jsonContent = JSON.stringify(backupData, null, 2);
  const fileName = `BulletJournal_Backup_${new Date().toISOString().split('T')[0]}.json`;
  const fileUri = `${getCacheDirectory()}${fileName}`;

  const targetUri = await writeFile(fileUri, jsonContent);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(targetUri, {
      mimeType: 'application/json',
      dialogTitle: language === 'es' ? 'Exportar Backup (JSON)' : 'Export Backup (JSON)',
      UTI: 'public.json',
    });
  }
};

/**
 * Abre el selector de documentos nativo para importar una copia de seguridad JSON,
 * valida el contenido y restaura los datos en SQLite y en memoria.
 *
 * @param {Function} reloadJournalData - Callback para recargar los datos en JournalContext.
 * @param {string} language - Idioma del usuario ('es' | 'en').
 * @returns {Promise<{ success: boolean, count: number, error?: string }>}
 */
export const importFromJSON = async (reloadJournalData, language = 'es') => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, count: 0 };
    }

    const fileAsset = result.assets[0];
    const fileContent = await readFile(fileAsset.uri);

    const parsedData = JSON.parse(fileContent);

    if (!parsedData || (!Array.isArray(parsedData.entries) && !Array.isArray(parsedData.lists))) {
      throw new Error(
        language === 'es'
          ? 'El archivo JSON no tiene un formato de copia de seguridad válido.'
          : 'JSON file does not have a valid backup format.'
      );
    }

    const importedEntries = Array.isArray(parsedData.entries) ? parsedData.entries : [];
    const importedLists = Array.isArray(parsedData.lists) ? parsedData.lists : [];

    // Persistir listas importadas en SQLite (omitiendo duplicados por id)
    const existingLists = await ListRepository.getAllLists();
    const existingListIds = new Set(existingLists.map(l => l.id));

    for (const list of importedLists) {
      if (!existingListIds.has(list.id)) {
        await ListRepository.insertList(list);
      }
    }

    // Persistir entradas importadas en SQLite (omitiendo duplicados por id)
    const existingEntries = await EntryRepository.getAllEntries();
    const existingEntryIds = new Set(existingEntries.map(e => e.id));

    let insertedCount = 0;
    for (const entry of importedEntries) {
      if (!existingEntryIds.has(entry.id)) {
        await EntryRepository.insertEntry(entry);
        insertedCount++;
      }
    }

    if (reloadJournalData) {
      await reloadJournalData();
    }

    return { success: true, count: insertedCount };
  } catch (error) {
    console.error('[ExportImportService] Error al importar JSON:', error);
    return {
      success: false,
      count: 0,
      error: error.message || (language === 'es' ? 'Error al leer el archivo JSON.' : 'Error reading JSON file.'),
    };
  }
};
