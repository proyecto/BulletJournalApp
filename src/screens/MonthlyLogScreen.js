import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { AppText as Text } from '../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJournal, getFormattedDate } from '../context/JournalContext';
import { useSettings } from '../context/SettingsContext';
import SmartInput from '../components/SmartInput';
import { createDailyEntry, createMonthlyTask } from '../factories/EntryFactory';

const { width } = Dimensions.get('window');

export default function MonthlyLogScreen() {
  const { entries, addEntry, toggleStatus, deleteEntry, updateEntryDate } = useJournal();
  const { theme, language, timezone } = useSettings();
  const insets = useSafeAreaInsets();

  // ─── 1. Estado Local ────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'tasks'
  const [inputText, setInputText] = useState('');
  
  // Control de inserción para días específicos del calendario
  const [selectedDayForEntry, setSelectedDayForEntry] = useState(null); // Objeto Date seleccionado
  const [isDailyInputOpen, setIsDailyInputOpen] = useState(false);
  const [dailyInputType, setDailyInputType] = useState('task');

  // Control del modal de migración
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [taskToMigrate, setTaskToMigrate] = useState(null);

  const monthStr = getFormattedDate(currentMonth, timezone).substring(0, 7); // "YYYY-MM"

  // ─── 2. Datos Calculados ───
  // Lista de días del mes seleccionado
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  // Nombre formateado del mes/año actual
  const monthHeaderLabel = useMemo(() => {
    const monthNames = language === 'es'
      ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  }, [currentMonth, language]);

  // Filtrar tareas exclusivas del mes (date === "YYYY-MM")
  const monthlyTasks = useMemo(() => {
    return entries.filter(e => e.date === monthStr && e.listId === null);
  }, [entries, monthStr]);

  // Agrupar entradas por día del mes en un mapa de claves "YYYY-MM-DD" para acceso rápido
  const dailyEntriesMap = useMemo(() => {
    const map = {};
    entries.forEach(entry => {
      if (entry.date.startsWith(monthStr + '-') && entry.listId === null) {
        if (!map[entry.date]) {
          map[entry.date] = [];
        }
        map[entry.date].push(entry);
      }
    });
    return map;
  }, [entries, monthStr]);

  // ─── 3. Handlers de Navegación ───
  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // ─── 4. Añadir Tarea Mensual ───
  const handleAddMonthlyTask = () => {
    if (!inputText.trim()) return;
    const newTask = createMonthlyTask(inputText, monthStr);
    addEntry(newTask);
    setInputText('');
  };

  // ─── 5. Añadir Entrada Diaria desde Calendario ───
  const openDailyInput = (dayDate) => {
    setSelectedDayForEntry(dayDate);
    setIsDailyInputOpen(true);
  };

  const handleAddDailyEntry = () => {
    if (!inputText.trim() || !selectedDayForEntry) return;
    const newEntry = createDailyEntry(inputText, dailyInputType, selectedDayForEntry, timezone);
    addEntry(newEntry);
    setInputText('');
    setIsDailyInputOpen(false);
  };

  // ─── 6. Migrar Tarea del Mes a un Día Específico ───
  const startMigration = (task) => {
    setTaskToMigrate(task);
    setShowMigrationModal(true);
  };

  const executeMigration = (dayNumber) => {
    if (!taskToMigrate) return;
    const dayStr = dayNumber.toString().padStart(2, '0');
    const targetDate = `${monthStr}-${dayStr}`; // "YYYY-MM-DD"
    
    updateEntryDate(taskToMigrate.id, targetDate);
    
    setShowMigrationModal(false);
    setTaskToMigrate(null);

    // Diálogo informativo al usuario
    Alert.alert(
      language === 'es' ? 'Tarea Programada' : 'Task Scheduled',
      language === 'es' 
        ? `La tarea se ha migrado al día ${dayNumber} del mes.`
        : `The task has been migrated to day ${dayNumber} of the month.`
    );
  };

  // ─── 7. Eliminar entrada con confirmación ───
  const confirmDelete = (id) => {
    Alert.alert(
      language === 'es' ? 'Eliminar registro' : 'Delete entry',
      language === 'es'
        ? '¿Estás seguro de que quieres eliminar este registro de forma permanente?'
        : 'Are you sure you want to delete this entry permanently?',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        { text: language === 'es' ? 'Eliminar' : 'Delete', style: 'destructive', onPress: () => deleteEntry(id) }
      ]
    );
  };

  // ─── 8. Renderizado ───

  // Fila de la vista cronológica (Calendario)
  const renderCalendarDayRow = ({ item: dayDate }) => {
    const dayStr = getFormattedDate(dayDate, timezone);
    const dayEntries = dailyEntriesMap[dayStr] || [];
    const dayNum = dayDate.getDate().toString().padStart(2, '0');
    
    // Obtener día de la semana abreviado
    const weekdays = language === 'es'
      ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = weekdays[dayDate.getDay()];
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

    return (
      <View style={[styles.dayRow, { borderBottomColor: theme.border }]}>
        {/* Lado izquierdo: Indicador de día */}
        <TouchableOpacity 
          style={[
            styles.dayBadge, 
            { backgroundColor: isWeekend ? theme.primaryBackground : theme.inputBackground }
          ]}
          onPress={() => openDailyInput(dayDate)}
        >
          <Text variant="body" style={[styles.dayNumText, { color: isWeekend ? theme.primary : theme.text }]}>
            {dayNum}
          </Text>
          <Text variant="micro" style={{ color: theme.textSecondary, fontWeight: '600' }}>
            {dayName}
          </Text>
        </TouchableOpacity>

        {/* Lado derecho: Lista de eventos/tareas agendados */}
        <View style={styles.dayEntriesContainer}>
          {dayEntries.length > 0 ? (
            dayEntries.map(entry => {
              const isCompleted = entry.status === 'completed';
              let iconName = 'ellipse';
              if (entry.type === 'event') iconName = 'ellipse-outline';
              else if (entry.type === 'note') iconName = 'remove';
              else if (isCompleted) iconName = 'close';

              return (
                <View key={entry.id} style={styles.dayEntryItem}>
                  <TouchableOpacity 
                    style={styles.dayEntryLeft}
                    onPress={() => toggleStatus(entry.id, dayStr)}
                    activeOpacity={entry.type === 'task' ? 0.7 : 1}
                  >
                    <Ionicons 
                      name={iconName} 
                      size={12} 
                      color={isCompleted ? theme.textCompleted : theme.text} 
                      style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <Text 
                      variant="body" 
                      style={[
                        styles.dayEntryText,
                        { color: theme.text },
                        isCompleted && { color: theme.textCompleted, textDecorationLine: 'line-through' }
                      ]}
                      numberOfLines={2}
                    >
                      {entry.text}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.dayEntryDelete} 
                    onPress={() => confirmDelete(entry.id)}
                  >
                    <Ionicons name="trash-outline" size={14} color={theme.error || '#ff3b30'} />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            // Fila vacía táctil para añadir eventos rápidamente
            <TouchableOpacity 
              style={styles.emptyDayClickable} 
              onPress={() => openDailyInput(dayDate)}
              activeOpacity={0.5}
            >
              <Text variant="micro" style={{ color: theme.iconInactive, fontStyle: 'italic' }}>
                {language === 'es' ? '+ Añadir evento o tarea' : '+ Add event or task'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Ítem de la lista de tareas del mes
  const renderMonthlyTaskItem = ({ item }) => {
    const isCompleted = item.status === 'completed';
    return (
      <View 
        style={[
          styles.taskCard,
          { backgroundColor: theme.cardBackground, shadowColor: theme.text },
          isCompleted && { backgroundColor: theme.cardCompleted }
        ]}
      >
        <TouchableOpacity
          style={styles.taskCardMain}
          onPress={() => toggleStatus(item.id, monthStr)}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxContainer}>
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={isCompleted ? theme.textCompleted : theme.textSecondary}
            />
          </View>
          <Text
            variant="body"
            style={[
              styles.taskText,
              { color: theme.text },
              isCompleted && { color: theme.textCompleted, textDecorationLine: 'line-through' }
            ]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>

        {/* Acciones de la tarea */}
        <View style={styles.taskActions}>
          {/* Botón de Migrar (Programar en día específico) */}
          {!isCompleted && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => startMigration(item)}
              accessibilityLabel={language === 'es' ? 'Programar tarea' : 'Schedule task'}
              accessibilityRole="button"
            >
              <Ionicons name="calendar-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          {/* Botón de eliminar */}
          <TouchableOpacity
            style={[styles.actionButton, { marginLeft: 6 }]}
            onPress={() => confirmDelete(item.id)}
            accessibilityLabel={language === 'es' ? 'Eliminar' : 'Delete'}
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={18} color={theme.error || '#ff3b30'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      {/* ─── Cabecera de Selección de Mes ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text variant="h1" style={[styles.monthTitle, { color: theme.text }]}>
          {monthHeaderLabel}
        </Text>

        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* ─── Segmented Tabs (Estilo Pill Premium) ─── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'calendar' && { backgroundColor: theme.text }
          ]}
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons 
            name="calendar" 
            size={16} 
            color={activeTab === 'calendar' ? theme.cardBackground : theme.textSecondary} 
            style={{ marginRight: 6 }}
          />
          <Text 
            variant="body" 
            style={[
              styles.tabText, 
              { color: activeTab === 'calendar' ? theme.cardBackground : theme.textSecondary }
            ]}
          >
            {language === 'es' ? 'Calendario' : 'Calendar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'tasks' && { backgroundColor: theme.text }
          ]}
          onPress={() => setActiveTab('tasks')}
        >
          <Ionicons 
            name="list" 
            size={16} 
            color={activeTab === 'tasks' ? theme.cardBackground : theme.textSecondary} 
            style={{ marginRight: 6 }}
          />
          <Text 
            variant="body" 
            style={[
              styles.tabText, 
              { color: activeTab === 'tasks' ? theme.cardBackground : theme.textSecondary }
            ]}
          >
            {language === 'es' ? 'Tareas del Mes' : 'Monthly Tasks'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Vistas Principales ─── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'calendar' ? (
          <FlatList
            data={daysInMonth}
            renderItem={renderCalendarDayRow}
            keyExtractor={item => item.getTime().toString()}
            contentContainerStyle={styles.calendarContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={monthlyTasks}
            renderItem={renderMonthlyTaskItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.tasksContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyTasksContainer}>
                <Ionicons name="list" size={64} color={theme.textCompleted} style={{ opacity: 0.5, marginBottom: 16 }} />
                <Text variant="body" style={{ color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 24 }}>
                  {language === 'es' 
                    ? 'No hay tareas planificadas para este mes. Agrégalas usando el input de abajo.' 
                    : 'No tasks planned for this month. Add them using the input below.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Input de tareas del mes (Solo se muestra en el tab de tareas) */}
      {activeTab === 'tasks' && (
        <SmartInput
          value={inputText}
          onChangeText={setInputText}
          onSubmit={handleAddMonthlyTask}
          placeholder={language === 'es' ? 'Nueva tarea mensual...' : 'New monthly task...'}
        />
      )}

      {/* ─── SmartInput especial controlado para añadir entradas diarias desde el calendario ─── */}
      <SmartInput
        isModalOpenExternal={isDailyInputOpen}
        onRequestCloseExternal={() => setIsDailyInputOpen(false)}
        value={inputText}
        onChangeText={setInputText}
        onSubmit={handleAddDailyEntry}
        placeholder={
          selectedDayForEntry 
            ? `${language === 'es' ? 'Añadir al día' : 'Add to day'} ${selectedDayForEntry.getDate()}` 
            : ''
        }
        topContent={
          <>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: dailyInputType === 'task' ? theme.text : theme.inputBackground }]}
              onPress={() => setDailyInputType('task')}
            >
              <Ionicons name="ellipse" size={10} color={dailyInputType === 'task' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: dailyInputType === 'event' ? theme.text : theme.inputBackground }]}
              onPress={() => setDailyInputType('event')}
            >
              <Ionicons name="ellipse-outline" size={12} color={dailyInputType === 'event' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: dailyInputType === 'note' ? theme.text : theme.inputBackground }]}
              onPress={() => setDailyInputType('note')}
            >
              <Ionicons name="remove" size={16} color={dailyInputType === 'note' ? theme.cardBackground : theme.iconInactive} />
            </TouchableOpacity>
          </>
        }
      />

      {/* ─── Modal de Migración (Reorganizador Grid del Mes) ─── */}
      <Modal
        visible={showMigrationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowMigrationModal(false);
          setTaskToMigrate(null);
        }}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            setShowMigrationModal(false);
            setTaskToMigrate(null);
          }}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.migrationCard, { backgroundColor: theme.cardBackground }]} onPress={e => e.stopPropagation()}>
            <Text variant="h2" style={[styles.migrationTitle, { color: theme.text }]}>
              {language === 'es' ? 'Programar Tarea' : 'Schedule Task'}
            </Text>
            <Text variant="body" style={[styles.migrationSubtitle, { color: theme.textSecondary }]}>
              {language === 'es'
                ? 'Selecciona el día del mes para migrar la tarea:'
                : 'Select the day of the month to migrate the task:'}
            </Text>

            <ScrollView contentContainerStyle={styles.migrationGrid} showsVerticalScrollIndicator={false}>
              {daysInMonth.map((dayDate, idx) => {
                const dayNum = dayDate.getDate();
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.gridItem, { backgroundColor: theme.inputBackground }]}
                    onPress={() => executeMigration(dayNum)}
                  >
                    <Text variant="body" style={{ color: theme.text, fontWeight: '600' }}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.cancelMigrationButton, { backgroundColor: theme.inputBackground }]}
              onPress={() => {
                setShowMigrationModal(false);
                setTaskToMigrate(null);
              }}
            >
              <Text variant="body" style={{ color: theme.textSecondary, fontWeight: '600' }}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8
  },
  monthNavButton: { padding: 8 },
  monthTitle: { letterSpacing: -0.5, textTransform: 'capitalize' },
  
  // Segmented control styling
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 12,
    gap: 12
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  tabText: { fontWeight: '600' },

  // Calendar View Agenda styling
  calendarContent: { paddingHorizontal: 20, paddingBottom: 24 },
  dayRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    alignItems: 'flex-start'
  },
  dayBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  dayNumText: { fontSize: 18, fontWeight: '700', lineHeight: 20 },
  dayEntriesContainer: { flex: 1, justifyContent: 'center' },
  dayEntryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  dayEntryLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  dayEntryText: { flex: 1, lineHeight: 18 },
  dayEntryDelete: { paddingHorizontal: 8, paddingVertical: 2 },
  emptyDayClickable: { paddingVertical: 8 },

  // Tasks Checklist View styling
  tasksContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 30 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  taskCardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkboxContainer: { marginRight: 12 },
  taskText: { flex: 1, lineHeight: 20 },
  taskActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8 },
  emptyTasksContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },

  typeButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },

  // Migration Modal Grid styling
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  migrationCard: {
    width: width * 0.85,
    maxHeight: '65%',
    borderRadius: 18,
    padding: 24,
    elevation: 8
  },
  migrationTitle: { letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  migrationSubtitle: { marginBottom: 20, textAlign: 'center' },
  migrationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 16
  },
  gridItem: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelMigrationButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  }
});
