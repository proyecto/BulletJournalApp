import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useJournal, getFormattedDate } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';
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
  const { entries, toggleStatus } = useJournal();
  const { theme, language, timezone } = useSettings();
  const insets = useSafeAreaInsets();
  const today = getFormattedDate(new Date(), timezone);
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    LocaleConfig.defaultLocale = language;
  }, [language]);

  const markedDates = useMemo(() => {
    const marks = {};
    
    // 1. Poner el texto en azul para los días que tienen tareas/eventos
    entries.forEach(entry => {
      if (entry.listId) return;

      if (entry.status === 'completed' && entry.completedAt) {
        marks[entry.completedAt] = { textColor: theme.primary };
      } else if (entry.status === 'open' && entry.type === 'task') {
        if (entry.date && entry.date > today) {
          marks[entry.date] = { textColor: theme.primary };
        } else {
          marks[today] = { textColor: theme.primary };
        }
      } else if (entry.date) {
        marks[entry.date] = { textColor: theme.primary };
      }
    });

    // 2. Poner un puntito al día actual (HOY) siempre
    if (marks[today]) {
        marks[today].marked = true;
        marks[today].dotColor = theme.text;
    } else {
        marks[today] = { marked: true, dotColor: theme.text };
    }

    // 3. Marcar el día seleccionado actualmente (fondo invertido)
    if (marks[selectedDate]) {
        marks[selectedDate].selected = true;
        marks[selectedDate].selectedColor = theme.text;
        marks[selectedDate].textColor = theme.cardBackground; 
        if (marks[selectedDate].marked) {
            marks[selectedDate].dotColor = theme.cardBackground;
        }
    } else {
        marks[selectedDate] = {
            selected: true,
            selectedColor: theme.text,
            textColor: theme.cardBackground
        };
    }

    return marks;
  }, [entries, selectedDate, theme, today]);

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
        activeOpacity={item.type === 'note' ? 1 : 0.7}
        disabled={item.type === 'note'}
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
