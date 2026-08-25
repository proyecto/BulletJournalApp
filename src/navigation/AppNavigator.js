import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';

// Screens
import DailyLogScreen from '../screens/DailyLogScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ListsScreen from '../screens/ListsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import AdvancedTypographyScreen from '../screens/AdvancedTypographyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  const { theme, language } = useSettings();
  const insets = useSafeAreaInsets();

  // Aseguramos un padding mínimo de 12, pero sumamos el inset nativo (si lo hay)
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Hoy') {
            iconName = focused ? 'journal' : 'journal-outline';
          } else if (route.name === 'Calendario') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Listas') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Ajustes') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.iconInactive,
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS === 'android', // Ocultar pestañas al escribir en Android
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: theme.border,
          backgroundColor: theme.tabBar,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 10,
          paddingBottom: bottomPadding,
          height: 55 + bottomPadding,
        }
      })}
    >
      <Tab.Screen 
        name="Hoy" 
        component={DailyLogScreen} 
        options={{ title: language === 'es' ? 'Daily Log' : 'Daily Log' }}
      />
      <Tab.Screen 
        name="Calendario" 
        component={CalendarScreen} 
        options={{ title: language === 'es' ? 'Future Log' : 'Future Log' }}
      />
      <Tab.Screen 
        name="Listas" 
        component={ListsScreen} 
        options={{ title: language === 'es' ? 'Listas' : 'Lists' }}
      />
      <Tab.Screen 
        name="Ajustes" 
        component={SettingsScreen} 
        options={{ title: language === 'es' ? 'Ajustes' : 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="ListDetail" component={ListDetailScreen} />
      <Stack.Screen name="AdvancedTypography" component={AdvancedTypographyScreen} />
    </Stack.Navigator>
  );
}
