/**
 * @module SmartInput
 * @description Componente de entrada de texto estilo Bottom Sheet Modal para Android e iOS.
 * 
 * Muestra una barra visible en la parte inferior de la pantalla. Al pulsarla, abre un Modal
 * nativo con fondo atenuado y el input flotando exactamente sobre el teclado virtual.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { AppText as Text } from './Typography';

export default function SmartInput({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  topContent,
  leftContent,
}) {
  const { theme, language } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleModalShow = () => {
    // Delay de 60ms para garantizar que el foco nativo se aplique tras el render del Dialog
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  const handleSubmit = () => {
    if (!value?.trim()) return;
    onSubmit();
    handleClose();
  };

  const KeyboardWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const keyboardWrapperProps = Platform.OS === 'ios'
    ? { behavior: 'padding', style: styles.keyboardAvoidingView }
    : { style: styles.keyboardAvoidingView };

  const defaultPlaceholder = language === 'es' ? 'Escribe aquí...' : 'Type here...';

  return (
    <>
      {/* ─── 1. BARRA VISIBLE EN EL LAYOUT (DUMMY) ─── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleOpen}
        style={[
          styles.dummyContainer,
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

          <View
            style={[
              styles.dummyTextInput,
              {
                backgroundColor: theme.inputBackground,
              },
            ]}
          >
            <Text
              style={{
                color: value ? theme.text : theme.textSecondary,
                fontSize: 16,
              }}
              numberOfLines={1}
            >
              {value || placeholder || defaultPlaceholder}
            </Text>
          </View>

          <View
            style={[
              styles.sendButton,
              { backgroundColor: theme.buttonBackground },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={theme.cardBackground} />
          </View>
        </View>
      </TouchableOpacity>

      {/* ─── 2. MODAL NATIVO FLOTANTE SOBRE EL TECLADO ─── */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
        onShow={handleModalShow}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.modalBackdrop}>
            <KeyboardWrapper {...keyboardWrapperProps}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.modalInputCard,
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
                      placeholder={placeholder || defaultPlaceholder}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChangeText}
                      onSubmitEditing={handleSubmit}
                      returnKeyType="send"
                    />

                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        {
                          backgroundColor: value?.trim()
                            ? theme.text
                            : theme.buttonBackground,
                        },
                        value?.trim() ? { elevation: 3 } : null,
                      ]}
                      onPress={handleSubmit}
                      disabled={!value?.trim()}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={20}
                        color={theme.cardBackground}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardWrapper>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dummyContainer: {
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalInputCard: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  topContentContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContentContainer: {
    marginRight: 10,
  },
  dummyTextInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    justifyContent: 'center',
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
