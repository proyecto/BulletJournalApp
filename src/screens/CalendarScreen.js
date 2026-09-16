import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useJournal, getFormattedDate } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';
import CustomDatePickerModal from '../components/CustomDatePickerModal';
import { filterEntriesForDay, getEntryIcon, isEntryCompleted } from '../services/DailyLogService';

// Configurar el idioma del calendario
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul.', 'Ago', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.locales['en'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};

export default function CalendarScreen() {
  const { entries, toggleStatus, updateEntryDate } = useJournal();
  const { theme, language, timezone, isDark } = useSettings();
  const insets = useSafeAreaInsets();
  const today = getFormattedDate(new Date(), timezone);
  const [selectedDate, setSelectedDate] = useState(today);
  const [reschedulingItem, setReschedulingItem] = useState(null);

  useEffect(() => {
    LocaleConfig.defaultLocale = language;
  }, [language]);

  const markedDates = useMemo(() => {
    const marks = {};
    
    // 1. Identificar todos los días que tienen alguna entrada (tarea, evento o nota)
    entries.forEach(entry => {
      if (entry.listId) return;

      let entryDate = null;
      if (entry.status === 'completed' && entry.completedAt) {
        entryDate = entry.completedAt;
      } else if (entry.status === 'open' && entry.type === 'task') {
        if (entry.date && entry.date > today) {
          entryDate = entry.date;
        } else {
          entryDate = today;
        }
      } else if (entry.date) {
        entryDate = entry.date;
      }

      if (entryDate) {
        marks[entryDate] = true;
      }
    });

    const result = {};
    const allDates = new Set([...Object.keys(marks), today, selectedDate]);

    allDates.forEach(dateStr => {
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;
      const hasEntries = !!marks[dateStr];

      const itemConfig = {};

      // Punto debajo del número si hay alguna tarea, evento o nota
      if (hasEntries) {
        itemConfig.marked = true;
        itemConfig.dotColor = isSelected
          ? (isDark ? '#000000' : '#FFFFFF')
          : (theme.primary || '#007AFF');
      }

      // Estilos customizados
      if (isSelected) {
        // Día visualizado: círculo negro con texto en blanco
        itemConfig.customStyles = {
          container: {
            backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A',
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          },
          text: {
            color: isDark ? '#1A1A1A' : '#FFFFFF',
            fontWeight: '700',
          },
        };
      } else if (isToday) {
        // Día actual (HOY): cuadrado gris claro
        itemConfig.customStyles = {
          container: {
            backgroundColor: isDark ? '#38383A' : '#E5E5EA',
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
          },
          text: {
            color: theme.text,
            fontWeight: '700',
          },
        };
      }

      result[dateStr] = itemConfig;
    });

    return result;
  }, [entries, selectedDate, theme, today, isDark]);

  // Filtrar las entradas para el día seleccionado usando el servicio central
  const selectedEntries = useMemo(() => {
    return filterEntriesForDay(entries, selectedDate, today);
  }, [entries, selectedDate, today]);

  const renderItem = ({ item }) => {
    const isCompleted = isEntryCompleted(item, today);
    const iconName = getEntryIcon(item, today);

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, { backgroundColor: theme.cardBackground }]}
        onPress={() => item.type !== 'note' && toggleStatus(item.id, selectedDate)}
        onLongPress={() => setReschedulingItem(item)}
        delayLongPress={350}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={iconName} 
            size={item.type === 'note' ? 20 : 14} 
            color={isCompleted ? theme.textCompleted : theme.text} 
          />
        </View>
        <Text variant="body" style={[styles.itemText, { color: theme.text }, isCompleted && { color: theme.textCompleted, textDecorationLine: 'line-through' }]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      <View style={styles.header}>
        <Text variant="h1" style={[styles.title, { color: theme.text }]}>
          {language === 'es' ? 'Registro Futuro' : 'Future Log'}
        </Text>
      </View>
      <Calendar
        markingType="custom"
        current={selectedDate}
        onDayPress={day => {
          setSelectedDate(day.dateString);
        }}
        markedDates={markedDates}
        theme={{
          backgroundColor: theme.background,
          calendarBackground: theme.cardBackground,
          textSectionTitleColor: theme.textSecondary,
          selectedDayBackgroundColor: theme.text,
          selectedDayTextColor: theme.cardBackground,
          todayTextColor: theme.text,
          dayTextColor: theme.text,
          textDisabledColor: theme.textCompleted,
          dotColor: theme.primary,
          selectedDotColor: theme.cardBackground,
          arrowColor: theme.text,
          monthTextColor: theme.text,
          indicatorColor: theme.primary,
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 14
        }}
        style={[styles.calendar, { borderColor: theme.border }]}
      />
      
      <View style={styles.listHeader}>
        <Text variant="h2" style={[styles.listTitle, { color: theme.text }]}>
          {selectedDate === today ? (language === 'es' ? 'Hoy' : 'Today') : selectedDate}
        </Text>
      </View>

      <FlatList
        data={selectedEntries}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyDate}>
            <Text variant="body" style={[styles.emptyDateText, { color: theme.textSecondary }]}>
              {language === 'es' ? 'Ningún registro en este día.' : 'No entries on this day.'}
            </Text>
          </View>
        }
      />

      {/* Modal selector de fecha para MOVER una entrada al hacer pulsación prolongada */}
      <CustomDatePickerModal
        visible={!!reschedulingItem}
        selectedDate={reschedulingItem?.date || selectedDate}
        onSelectDate={(newDate) => {
          if (reschedulingItem) {
            updateEntryDate(reschedulingItem.id, getFormattedDate(newDate, timezone));
            setReschedulingItem(null);
          }
        }}
        onClose={() => setReschedulingItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, alignItems: 'center' },
  title: { letterSpacing: -0.5, textAlign: 'center' },
  calendar: {
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  listTitle: {
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
  },
  dateBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    overflow: 'hidden',
    marginLeft: 8
  },
  emptyDate: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyDateText: {
  }
});
