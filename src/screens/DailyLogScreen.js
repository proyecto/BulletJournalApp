import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Alert 
} from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useJournal, getFormattedDate } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';

export default function DailyLogScreen() {
  const { entries, addEntry, toggleStatus } = useJournal();
  const { theme, language, timezone } = useSettings();
  const insets = useSafeAreaInsets();
  
  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState('task'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [currentLogDate, setCurrentLogDate] = useState(new Date());
  const currentLogDateStr = getFormattedDate(currentLogDate, timezone);

  const navigateDay = (direction) => {
    const newDate = new Date(currentLogDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentLogDate(newDate);
  };

  const dailyLogEntries = entries.filter(entry => {
    if (entry.date > currentLogDateStr) return false;
    if (entry.date === currentLogDateStr) return true;
    if (entry.date < currentLogDateStr) {
      if (entry.type === 'task') {
        if (!entry.completedAt) return true;
        if (entry.completedAt < currentLogDateStr) return false;
        return true;
      }
      return false;
    }
  });

  const handleAddEntry = () => {
    if (inputText.trim().length > 0) {
      addEntry({
        id: Date.now().toString(),
        text: inputText.trim(),
        type: selectedType,
        status: 'open',
        date: getFormattedDate(selectedDate, timezone),
        completedAt: null
      });
      setInputText('');
      setSelectedDate(new Date());
    }
  };

  const onChangeDate = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'completed';
    const creationDate = getFormattedDate(new Date(parseInt(item.id)));
    const isScheduled = item.date !== creationDate;
    const isMigrated = item.date < currentLogDateStr;

    let iconName = 'ellipse'; 
    if (item.type === 'task') {
      if (isCompleted) {
        iconName = 'close';
      } else if (isMigrated) {
        iconName = 'chevron-forward';
      } else if (isScheduled) {
        iconName = 'chevron-back';
      }
    } else if (item.type === 'event') {
      iconName = 'ellipse-outline';
    } else if (item.type === 'note') {
      iconName = 'remove';
    }

    const iconColor = isCompleted ? theme.textCompleted : (isScheduled || isMigrated ? theme.primary : theme.text);

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.text }, isCompleted && { backgroundColor: theme.cardCompleted }]} 
        onPress={() => toggleStatus(item.id, currentLogDateStr)}
        activeOpacity={item.type === 'task' ? 0.7 : 1}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={iconName} 
            size={item.type === 'note' ? 24 : 16} 
            color={iconColor} 
            style={item.type === 'task' && !isCompleted && !isScheduled && !isMigrated ? styles.taskIcon : null}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardText, { color: theme.text }, isCompleted && { color: theme.textCompleted, textDecorationLine: 'line-through' }]}>
            {item.text}
          </Text>
          {isScheduled && (
             <Text style={[styles.dateBadge, { color: theme.primary, backgroundColor: theme.primaryBackground }, isCompleted && { opacity: 0.5 }]}>📅 {item.date}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const isViewingToday = currentLogDateStr === getFormattedDate(new Date(), timezone);

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => navigateDay(-1)} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={[styles.title, { color: theme.text }]}>{isViewingToday ? 'Daily Log' : currentLogDateStr}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {currentLogDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigateDay(1)} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={dailyLogEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {language === 'es' ? 'Ningún registro en este día.' : 'No entries on this day.'}
              </Text>
            </View>
          }
        />

        <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
          <View style={styles.typeSelector}>
            <TouchableOpacity style={[styles.typeButton, selectedType === 'task' ? { backgroundColor: theme.text } : { backgroundColor: theme.inputBackground }]} onPress={() => setSelectedType('task')}>
              <Ionicons name="ellipse" size={10} color={selectedType === 'task' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeButton, selectedType === 'event' ? { backgroundColor: theme.text } : { backgroundColor: theme.inputBackground }]} onPress={() => setSelectedType('event')}>
              <Ionicons name="ellipse-outline" size={12} color={selectedType === 'event' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeButton, selectedType === 'note' ? { backgroundColor: theme.text } : { backgroundColor: theme.inputBackground }]} onPress={() => setSelectedType('note')}>
              <Ionicons name="remove" size={16} color={selectedType === 'note' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.calendarButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons 
                name="calendar" 
                size={22} 
                color={getFormattedDate(selectedDate, timezone) !== getFormattedDate(new Date(), timezone) ? theme.primary : theme.textSecondary} 
              />
            </TouchableOpacity>

            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
              placeholder={language === 'es' ? 'Añadir...' : 'Add entry...'}
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAddEntry}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: inputText.trim() ? theme.text : theme.buttonBackground },
                inputText.trim() ? { shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 } : null
              ]} 
              onPress={handleAddEntry}
              disabled={!inputText.trim()}
            >
              <Ionicons name="arrow-up" size={20} color={theme.cardBackground} />
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitles: { alignItems: 'center' },
  navButton: { padding: 8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 4, textTransform: 'capitalize' },
  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10, borderRadius: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  iconContainer: { width: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  taskIcon: { transform: [{ scale: 0.8 }] },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardText: { fontSize: 16, flex: 1 },
  dateBadge: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden', marginLeft: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 16 },
  inputWrapper: { borderTopWidth: 1, paddingTop: 8, paddingBottom: 12 },
  typeSelector: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  typeButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  calendarButton: { marginRight: 12 },
  textInput: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 20, fontSize: 16 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
});
