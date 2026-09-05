/**
 * @module SmartInput
 * @description Componente de entrada de texto premium reutilizable y directo.
 * 
 * Integrado nativamente en el layout de la pantalla con soporte para resize de teclado en Android,
 * selector de tipo de entrada (topContent) y selector de fecha (leftContent).
 */

import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export default function SmartInput({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  topContent,
  leftContent,
}) {
  const { theme, language } = useSettings();
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (!value?.trim()) return;
    onSubmit();
  };

  const Wrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const wrapperProps = Platform.OS === 'ios'
    ? { behavior: 'padding', keyboardVerticalOffset: 10 }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.cardBackground,
            borderTopColor: theme.border,
          },
        ]}
      >
        {topContent && (
          <View style={styles.topContentContainer}>
            {topContent}
          </View>
        )}

        <View style={styles.inputRow}>
          {leftContent && (
            <View style={styles.leftContentContainer}>
              {leftContent}
            </View>
          )}

          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
            placeholder={placeholder || (language === 'es' ? 'Escribe aquí...' : 'Type here...')}
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: value?.trim() ? theme.text : theme.buttonBackground },
              value?.trim() ? { elevation: 2 } : null,
            ]}
            onPress={handleSubmit}
            disabled={!value?.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up" size={20} color={theme.cardBackground} />
          </TouchableOpacity>
        </View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  topContentContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContentContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
