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

/**
 * Devuelve la cadena formateada del subtítulo para la vista Semanal.
 *
 * @param {Date} date - Fecha base.
 * @param {string} [language='es'] - 'es' | 'en'
 * @param {string} [firstDayOfWeek='monday'] - 'monday' | 'sunday'
 * @returns {string} Ej: "14 sep - 20 sep 2026" / "Sep 14 - Sep 20, 2026"
 */
export const getFormattedWeekSubtitle = (date, language = 'es', firstDayOfWeek = 'monday') => {
  const { startDate, endDate } = getWeekRange(date, 'system', firstDayOfWeek);
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  
  const startDay = startDate.getDate();
  const startMonth = startDate.toLocaleDateString(locale, { month: 'short' });
  const endDay = endDate.getDate();
  const endMonth = endDate.toLocaleDateString(locale, { month: 'short' });
  const year = endDate.getFullYear();

  if (language === 'es') {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
};

/**
 * Devuelve la cadena formateada del subtítulo para la vista Mensual.
 *
 * @param {Date} date - Fecha base.
 * @param {string} [language='es'] - 'es' | 'en'
 * @returns {string} Ej: "septiembre 2026" / "September 2026"
 */
export const getFormattedMonthSubtitle = (date, language = 'es') => {
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const monthName = date.toLocaleDateString(locale, { month: 'long' });
  const year = date.getFullYear();
  
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalizedMonth} ${year}`;
};
