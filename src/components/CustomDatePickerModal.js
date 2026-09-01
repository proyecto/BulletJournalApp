/**
 * @component CustomDatePickerModal
 * @description Selector de fecha moderno y minimalista estilo Bottom Sheet,
 * 100% integrado con el sistema de diseño, temas (claro/oscuro) y tipografía de la app.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { AppText as Text } from './Typography';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { getFormattedDate } from '../utils/dateUtils';

const DAY_NAMES_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CustomDatePickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}) {
  const { theme, language, timezone } = useSettings();
  const insets = useSafeAreaInsets();

  // Función segura para parsear cadenas 'YYYY-MM-DD' o Date objects sin desfase de huso horario
  const parseSafeDate = (val) => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === 'string' && val.includes('-')) {
      const parts = val.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
      }
    }
    return new Date(val);
  };

  // Fecha temporal seleccionada dentro del modal
  const initialDate = useMemo(() => parseSafeDate(selectedDate), [selectedDate]);

  const [tempDate, setTempDate] = useState(initialDate);
  // Mes y año visualizados en el calendario (1er día de ese mes)
  const [viewingMonth, setViewingMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  useEffect(() => {
    if (visible) {
      const d = parseSafeDate(selectedDate);
      setTempDate(d);
      setViewingMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [visible, selectedDate]);

  const todayStr = getFormattedDate(new Date(), timezone);
  const tempDateStr = getFormattedDate(tempDate, timezone);

  // Navegar meses en el calendario
  const changeMonth = (delta) => {
    const nextMonth = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + delta, 1);
    setViewingMonth(nextMonth);
  };

  // Cálculo de los atajos rápidos
  const shortcuts = useMemo(() => {
    const now = new Date();
    
    // Mañana
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // En 3 días
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);

    // Próximo lunes
    const nextMonday = new Date(now);
    const dayOfWeek = nextMonday.getDay(); // 0 = Dom, 1 = Lun ...
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);

    // Fin de mes
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return [
      {
        id: 'today',
        label: language === 'es' ? 'Hoy' : 'Today',
        date: now,
      },
      {
        id: 'tomorrow',
        label: language === 'es' ? 'Mañana' : 'Tomorrow',
        date: tomorrow,
      },
      {
        id: 'in3days',
        label: language === 'es' ? '+3 días' : '+3 days',
        date: in3Days,
      },
      {
        id: 'nextMonday',
        label: language === 'es' ? 'Próx. lunes' : 'Next Mon',
        date: nextMonday,
      },
      {
        id: 'endOfMonth',
        label: language === 'es' ? 'Fin de mes' : 'Month end',
        date: endOfMonth,
      },
    ];
  }, [language, viewingMonth]);

  // Generación de la cuadrícula de días del mes visualizado
  const calendarGrid = useMemo(() => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Día de la semana en formato ISO (0 = Lunes, 6 = Domingo)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Total de días en el mes actual
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Total de días en el mes anterior
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Días del mes anterior (de relleno al inicio)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push({
        date: prevDate,
        dateStr: getFormattedDate(prevDate, timezone),
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const curDate = new Date(year, month, day);
      cells.push({
        date: curDate,
        dateStr: getFormattedDate(curDate, timezone),
        dayNumber: day,
        isCurrentMonth: true,
      });
    }

    // Días del mes siguiente (para completar la cuadrícula de 35 o 42 celdas)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      const nextDate = new Date(year, month + 1, nextDay);
      cells.push({
        date: nextDate,
        dateStr: getFormattedDate(nextDate, timezone),
        dayNumber: nextDay,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [viewingMonth, timezone]);

  const handleSelectShortcut = (date) => {
    setTempDate(date);
    setViewingMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const handleSelectDay = (cell) => {
    setTempDate(cell.date);
    if (!cell.isCurrentMonth) {
      setViewingMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
    }
  };

  const handleConfirm = () => {
    onSelectDate(tempDate);
    onClose();
  };

  const monthNames = language === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN;
  const dayHeaders = language === 'es' ? DAY_NAMES_ES : DAY_NAMES_EN;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: theme.cardBackground,
                  paddingBottom: Math.max(insets.bottom, 20),
                },
              ]}
            >
              {/* Barra tirador superior */}
              <View style={styles.handleBarContainer}>
                <View style={[styles.handleBar, { backgroundColor: theme.textSecondary }]} />
              </View>

              {/* Cabecera del Modal */}
              <View style={styles.header}>
                <View>
                  <Text variant="h2" style={[styles.headerTitle, { color: theme.text }]}>
                    {language === 'es' ? 'Seleccionar fecha' : 'Select date'}
                  </Text>
                  <Text variant="caption" style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    {tempDate.toLocaleDateString(
                      language === 'es' ? 'es-ES' : 'en-US',
                      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                    )}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: theme.inputBackground }]}
                  accessibilityLabel="Cerrar"
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Fila de Atajos Rápidos */}
              <View style={styles.shortcutsWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.shortcutsContent}
                >
                  {shortcuts.map((sc) => {
                    const scStr = getFormattedDate(sc.date, timezone);
                    const isSelected = scStr === tempDateStr;

                    return (
                      <TouchableOpacity
                        key={sc.id}
                        onPress={() => handleSelectShortcut(sc.date)}
                        style={[
                          styles.shortcutChip,
                          {
                            backgroundColor: isSelected ? theme.text : theme.inputBackground,
                          },
                        ]}
                      >
                        <Text
                          variant="micro"
                          style={[
                            styles.shortcutText,
                            { color: isSelected ? theme.cardBackground : theme.text },
                          ]}
                        >
                          {sc.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Navegación de Mes */}
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
                  <Ionicons name="chevron-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text variant="h3" style={[styles.monthNavTitle, { color: theme.text }]}>
                  {monthNames[viewingMonth.getMonth()]} {viewingMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
                  <Ionicons name="chevron-forward" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Encabezados de Días de la Semana */}
              <View style={styles.weekHeadersRow}>
                {dayHeaders.map((dh, idx) => (
                  <View key={idx} style={styles.weekHeaderCell}>
                    <Text variant="micro" style={[styles.weekHeaderText, { color: theme.textSecondary }]}>
                      {dh}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Cuadrícula de Días */}
              <View style={styles.gridContainer}>
                {calendarGrid.map((cell, idx) => {
                  const isSelected = cell.dateStr === tempDateStr;
                  const isToday = cell.dateStr === todayStr;

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSelectDay(cell)}
                      style={[
                        styles.dayCell,
                        isSelected && [styles.selectedDayCell, { backgroundColor: theme.text }],
                        isToday && !isSelected && [styles.todayCell, { borderColor: theme.textSecondary }],
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        variant="body"
                        style={[
                          styles.dayText,
                          {
                            color: isSelected
                              ? theme.cardBackground
                              : cell.isCurrentMonth
                              ? theme.text
                              : theme.textSecondary + '60',
                            fontWeight: isSelected || isToday ? '700' : '400',
                          },
                        ]}
                      >
                        {cell.dayNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botón de Confirmación */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: theme.text }]}
                  onPress={handleConfirm}
                >
                  <Text variant="h3" style={[styles.confirmButtonText, { color: theme.cardBackground }]}>
                    {language === 'es' ? 'Listo' : 'Apply'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 2,
    textTransform: 'capitalize',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutsWrapper: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  shortcutsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  shortcutChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  shortcutText: {
    fontWeight: '600',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 6,
  },
  monthNavButton: {
    padding: 6,
  },
  monthNavTitle: {
    letterSpacing: -0.3,
  },
  weekHeadersRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekHeaderText: {
    fontWeight: '600',
    opacity: 0.8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  selectedDayCell: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  todayCell: {
    borderWidth: 1,
  },
  dayText: {
    fontSize: 15,
  },
  footer: {
    paddingTop: 8,
  },
  confirmButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
