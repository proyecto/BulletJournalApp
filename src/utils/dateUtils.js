/**
 * @module dateUtils
 * @description Utilidades puras de formateo de fechas.
 *
 * Este módulo existe para romper la dependencia circular entre
 * JournalContext y EntryFactory. Las funciones de fecha son utilidades
 * sin estado, por lo que no deben vivir en un contexto de React.
 *
 * REGLA: Este módulo no importa nada de src/context, src/factories
 * ni src/repositories. Solo depende de APIs nativas de JavaScript.
 */

/**
 * Formatea una fecha JavaScript al string 'YYYY-MM-DD' requerido por la BD SQLite.
 * Soporta timezones específicos usando la API nativa `Intl.DateTimeFormat`.
 *
 * @param {Date|number} date - La fecha a formatear (objeto Date o timestamp en ms).
 * @param {string} [timezone='system'] - Identificador IANA de timezone (ej: 'Europe/Madrid').
 * @returns {string} La fecha en formato 'YYYY-MM-DD'.
 *
 * @example
 * getFormattedDate(new Date(), 'Europe/Madrid') // → '2026-08-27'
 * getFormattedDate(Date.now(), 'system')         // → '2026-08-27'
 */
export const getFormattedDate = (date, timezone = 'system') => {
  if (!timezone || timezone === 'system') {
    const d = new Date(date);
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  try {
    // Intl.DateTimeFormat es la forma nativa y correcta de manejar timezones en JS
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone });
    return formatter.format(new Date(date));
  } catch (e) {
    // Fallback si el timezone no es reconocido por el entorno de JS
    const d = new Date(date);
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};
