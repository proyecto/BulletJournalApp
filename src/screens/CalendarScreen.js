import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useJournal, getFormattedDate } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';

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
  const [selectedDate, setSelectedDate] = useState(getFormattedDate(new Date(), timezone));

  useEffect(() => {
    LocaleConfig.defaultLocale = language;
  }, [language]);

  const markedDates = useMemo(() => {
    const marks = {};
    const today = getFormattedDate(new Date(), timezone);
    
    // 1. Poner el texto en azul para los días que tienen tareas
    entries.forEach(entry => {
      const targetDate = (entry.status === 'completed' && entry.completedAt) ? entry.completedAt : entry.date;
      if (targetDate) {
        marks[targetDate] = { textColor: theme.primary };
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
  }, [entries, selectedDate, theme]);

  // Filtrar las tareas para el día seleccionado
  const selectedEntries = useMemo(() => {
    return entries.filter(entry => {
      const targetDate = (entry.status === 'completed' && entry.completedAt) ? entry.completedAt : entry.date;
      return targetDate === selectedDate;
    });
  }, [entries, selectedDate]);

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'completed';
    // Comprobar si se programó explícitamente para otro día distinto al de su creación
    const creationDate = getFormattedDate(new Date(parseInt(item.id)), timezone);
    const isScheduled = item.date !== creationDate;

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, { backgroundColor: theme.cardBackground }]}
        onPress={() => toggleStatus(item.id, selectedDate)}
        activeOpacity={item.type === 'task' ? 0.7 : 1}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={item.type === 'task' ? (isCompleted ? 'close' : 'ellipse') : item.type === 'event' ? 'ellipse-outline' : 'remove'} 
            size={14} 
            color={isCompleted ? theme.textCompleted : theme.text} 
          />
        </View>
        <Text style={[styles.itemText, { color: theme.text }, isCompleted && { color: theme.textCompleted, textDecorationLine: 'line-through' }]}>
          {item.text}
        </Text>
        {isScheduled && (
          <Text style={[styles.dateBadge, { color: theme.primary, backgroundColor: theme.primaryBackground }, isCompleted && { opacity: 0.5 }]}>
            📅 {language === 'es' ? 'Prog.' : 'Sch.'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
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
        <Text style={[styles.listTitle, { color: theme.text }]}>
          {selectedDate === getFormattedDate(new Date()) ? (language === 'es' ? 'Hoy' : 'Today') : selectedDate}
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
            <Text style={[styles.emptyDateText, { color: theme.textSecondary }]}>
              {language === 'es' ? 'Nada programado para este día.' : 'Nothing scheduled for this day.'}
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
    fontSize: 22,
    fontWeight: '700',
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
    fontSize: 16,
    flex: 1,
  },
  dateBadge: { 
    fontSize: 12, 
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
    fontSize: 16,
  }
});
