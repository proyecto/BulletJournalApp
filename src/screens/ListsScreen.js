import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export default function ListsScreen() {
  const { theme, language } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 30) }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {language === 'es' ? 'Listas' : 'Lists'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {language === 'es' ? 'Tus colecciones' : 'Your collections'}
        </Text>
      </View>

      <View style={styles.content}>
        <Ionicons name="list" size={64} color={theme.textCompleted} style={styles.icon} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {language === 'es' 
            ? 'Aquí podrás crear tus propias colecciones personalizadas (libros, películas, notas).' 
            : 'Here you will be able to create custom collections (books, movies, notes).'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    opacity: 0.5,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
