/**
 * @module SmartInput
 * @description Componente de entrada de texto premium reutilizable, diseñado para Android.
 *
 * SOLUCIÓN ARQUITECTÓNICA DE COMPATIBILIDAD CON TECLADO:
 * Para evitar los problemas de clipping y saltos de teclado causados por las alturas
 * fijas y posiciones absolutas de React Navigation en Android, este componente
 * utiliza el patrón de MODAL NATIVO.
 *
 * ¿Cómo funciona?
 * 1. Muestra una barra de entrada "dummy" (falsa) en el layout normal de la pantalla.
 * 2. Al pulsarla, se abre un `<Modal>` nativo y transparente que se superpone a todo.
 * 3. El Modal contiene el `TextInput` real con `autoFocus={true}` para abrir el teclado.
 * 4. Como el Modal se ejecuta en una ventana nativa de Android (`android.app.Dialog`),
 *    el sistema operativo aplica `adjustResize` de forma limpia y aísla el input
 *    del flujo de React Navigation. Esto garantiza que el input suba y se pose
 *    exactamente encima del teclado sin bugs.
 *
 * @prop {string}          value        - El texto del input (controlado por el padre).
 * @prop {Function}        onChangeText - Callback para actualizar el estado del texto.
 * @prop {Function}        onSubmit     - Callback que se ejecuta al enviar.
 * @prop {string}          [placeholder]- Texto de ayuda.
 * @prop {React.ReactNode} [topContent] - Contenido opcional encima del input (ej: selector de tipo).
 * @prop {React.ReactNode} [leftContent]- Contenido opcional a la izquierda del input (ej: calendario).
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef(null);

  /**
   * Abre el Modal.
   */
  const handleOpenInput = () => {
    setIsModalOpen(true);
  };

  /**
   * Cierra el Modal limpiamente.
   */
  const handleCloseInput = () => {
    setIsModalOpen(false);
  };

  /**
   * Se ejecuta cuando el Modal nativo ya está totalmente visible y montado.
   * Usar un pequeño delay de 50ms garantiza que el foco nativo de Android
   * se registre perfectamente tras el montaje de la nueva ventana de diálogo.
   */
  const handleModalShow = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  /**
   * Ejecuta el envío de datos.
   * 1. Llama al submit original del padre.
   * 2. Cierra el modal de inmediato.
   */
  const handleSubmit = () => {
    onSubmit();
    handleCloseInput();
  };

  return (
    <>
      {/* ─── 1. BARRA DUMMY (Visible en la pantalla principal) ─── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleOpenInput}
        style={[
          styles.dummyWrapper,
          {
            backgroundColor: theme.cardBackground,
            borderTopColor: theme.border,
          }
        ]}
      >
        <View style={styles.inputContainer}>
          {/* Si tiene calendario u otro control izquierdo, lo mostramos como decoración */}
          {leftContent && (
            <View style={styles.leftContentContainer}>
              {leftContent}
            </View>
          )}

          {/* Caja que simula ser el TextInput */}
          <View style={[styles.textInput, { backgroundColor: theme.inputBackground, justifyContent: 'center' }]}>
            <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
              {placeholder || (language === 'es' ? 'Escribe aquí...' : 'Type here...')}
            </Text>
          </View>

          {/* Botón de enviar dummy (desactivado) */}
          <View style={[styles.sendButton, { backgroundColor: theme.buttonBackground }]}>
            <Ionicons name="arrow-up" size={20} color={theme.cardBackground} />
          </View>
        </View>
      </TouchableOpacity>

      {/* ─── 2. MODAL NATIVO (Superpuesto cuando el usuario pulsa para escribir) ─── */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseInput}
        onShow={handleModalShow} // ← Invoca el foco cuando el modal termina de mostrarse
      >
        {/* Backdrop (fondo oscuro semi-transparente). Pulsar fuera cierra el input */}
        <TouchableWithoutFeedback onPress={handleCloseInput}>
          <View style={styles.modalBackdrop}>
            
            {/* Contenedor que evita el teclado (KeyboardAvoidingView nativo) */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              {/* Contenedor del Input Real */}
              <TouchableWithoutFeedback>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.cardBackground,
                    borderTopColor: theme.border,
                  }
                ]}>
                  {/* Selector de Tipo (si existe, ej: tareas/eventos/notas en DailyLog) */}
                  {topContent && (
                    <View style={styles.topContentContainer}>
                      {topContent}
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    {/* Control Izquierdo Activo (ej: Calendario) */}
                    {leftContent && (
                      <View style={styles.leftContentContainer}>
                        {leftContent}
                      </View>
                    )}

                    {/* TextInput Real con Referencia */}
                    <TextInput
                      ref={inputRef} // ← Asignamos la referencia
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.inputBackground,
                          color: theme.text,
                        }
                      ]}
                      placeholder={placeholder || (language === 'es' ? 'Escribe aquí...' : 'Type here...')}
                      placeholderTextColor={theme.textSecondary}
                      value={value}
                      onChangeText={onChangeText}
                      onSubmitEditing={handleSubmit}
                      returnKeyType="send"
                    />

                    {/* Botón de Enviar Real */}
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        { backgroundColor: value.trim() ? theme.text : theme.buttonBackground },
                        value.trim() ? { elevation: 3 } : null,
                      ]}
                      onPress={handleSubmit}
                      disabled={!value.trim()}
                    >
                      <Ionicons name="arrow-up" size={20} color={theme.cardBackground} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>

            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /** Barra visible fija en el layout */
  dummyWrapper: {
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  /** Fondo oscuro que cubre la pantalla */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Atenuación de fondo premium
    justifyContent: 'flex-end', // Empuja el input hacia abajo
  },
  /** Ajusta el contenedor cuando el teclado aparece */
  keyboardAvoidingView: {
    width: '100%',
  },
  /** Contenedor del input real dentro del modal */
  inputWrapper: {
    borderTopWidth: 1,
    paddingVertical: 12,
    borderTopLeftRadius: 16, // Esquinas superiores redondeadas para estilo Bottom Sheet
    borderTopRightRadius: 16,
    elevation: 10, // Sombra para separarlo del contenido de fondo
  },
  /** Fila horizontal */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topContentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  leftContentContainer: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
