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

const INTL_FORMATTER_CACHE = new Map();
const DATE_FORMAT_CACHE = new Map();
const MAX_CACHE_SIZE = 300;

/**
 * Obtiene o crea una instancia memoizada de Intl.DateTimeFormat para el timezone dado.
 * Reutilizar formateadores evita el alto coste de inicialización de la API Intl en React Native.
 */
const getIntlFormatter = (timezone) => {
  let formatter = INTL_FORMATTER_CACHE.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone });
    INTL_FORMATTER_CACHE.set(timezone, formatter);
  }
  return formatter;
};

/**
 * Formatea una fecha JavaScript al string 'YYYY-MM-DD' requerido por la BD SQLite.
 * Soporta timezones específicos usando una caché interna de alto rendimiento.
 *
 * @param {Date|number} date - La fecha a formatear (objeto Date o timestamp en ms).
 * @param {string} [timezone='system'] - Identificador IANA de timezone (ej: 'Europe/Madrid').
 * @returns {string} La fecha en formato 'YYYY-MM-DD'.
 */
const formatFallback = (date) => {
  const d = new Date(date);
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFormattedDate = (date, timezone = 'system') => {
  const d = date instanceof Date ? date : new Date(date);
  const timeMs = d.getTime();
  const tz = timezone || 'system';

  const cacheKey = `${timeMs}_${tz}`;
  const cached = DATE_FORMAT_CACHE.get(cacheKey);
  if (cached) return cached;

  let formatted = '';

  if (tz === 'system') {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    formatted = `${year}-${month}-${day}`;
  } else {
    try {
      const formatter = getIntlFormatter(tz);
      formatted = formatter.format(d);
    } catch (e) {
      const year  = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day   = String(d.getDate()).padStart(2, '0');
      formatted = `${year}-${month}-${day}`;
    }
  }

  if (DATE_FORMAT_CACHE.size >= MAX_CACHE_SIZE) {
    DATE_FORMAT_CACHE.clear();
  }
  DATE_FORMAT_CACHE.set(cacheKey, formatted);

  return formatted;
};

/**
 * Devuelve el rango de fechas para la semana dada.
 *
 * @param {Date|string} dateInput - Fecha base.
 * @param {string} [timezone='system'] - Timezone IANA.
 * @param {string} [firstDayOfWeek='monday'] - 'monday' | 'sunday'
 * @returns {{ startStr: string, endStr: string, startDate: Date, endDate: Date }}
 */
export const getWeekRange = (dateInput, timezone = 'system', firstDayOfWeek = 'monday') => {
  const d = new Date(dateInput);
  const day = d.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  let startDiff = 0;
  if (firstDayOfWeek === 'sunday') {
    startDiff = -day;
  } else {
    startDiff = (day === 0 ? -6 : 1 - day);
  }

  const startDate = new Date(d);
  startDate.setDate(d.getDate() + startDiff);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return {
    startStr: getFormattedDate(startDate, timezone),
    endStr: getFormattedDate(endDate, timezone),
    startDate,
    endDate,
  };
};

const SUBTITLE_CACHE = new Map();

/**
 * Devuelve la cadena formateada del subtítulo para la vista Semanal.
 *
 * @param {Date} date - Fecha base.
 * @param {string} [language='es'] - 'es' | 'en'
 * @param {string} [firstDayOfWeek='monday'] - 'monday' | 'sunday'
 * @returns {string} Ej: "14 sep - 20 sep 2026" / "Sep 14 - Sep 20, 2026"
 */
export const getFormattedWeekSubtitle = (date, language = 'es', firstDayOfWeek = 'monday') => {
  const d = date instanceof Date ? date : new Date(date);
  const cacheKey = `week_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}_${language}_${firstDayOfWeek}`;
  const cached = SUBTITLE_CACHE.get(cacheKey);
  if (cached) return cached;

  const { startDate, endDate } = getWeekRange(d, 'system', firstDayOfWeek);
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  
  const startDay = startDate.getDate();
  const startMonth = startDate.toLocaleDateString(locale, { month: 'short' });
  const endDay = endDate.getDate();
  const endMonth = endDate.toLocaleDateString(locale, { month: 'short' });
  const year = endDate.getFullYear();

  const formatted = language === 'es'
    ? `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
    : `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;

  if (SUBTITLE_CACHE.size >= 100) SUBTITLE_CACHE.clear();
  SUBTITLE_CACHE.set(cacheKey, formatted);

  return formatted;
};

/**
 * Devuelve la cadena formateada del subtítulo para la vista Mensual.
 *
 * @param {Date} date - Fecha base.
 * @param {string} [language='es'] - 'es' | 'en'
 * @returns {string} Ej: "septiembre 2026" / "September 2026"
 */
export const getFormattedMonthSubtitle = (date, language = 'es') => {
  const d = date instanceof Date ? date : new Date(date);
  const cacheKey = `month_${d.getFullYear()}_${d.getMonth()}_${language}`;
  const cached = SUBTITLE_CACHE.get(cacheKey);
  if (cached) return cached;

  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const monthName = d.toLocaleDateString(locale, { month: 'long' });
  const year = d.getFullYear();
  
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const formatted = `${capitalizedMonth} ${year}`;

  if (SUBTITLE_CACHE.size >= 100) SUBTITLE_CACHE.clear();
  SUBTITLE_CACHE.set(cacheKey, formatted);

  return formatted;
};
