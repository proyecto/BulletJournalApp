/**
 * @module SmartInput
 * @description Componente de entrada de texto reutilizable.
 *
 * Diseñado exclusivamente para Android, confía en el comportamiento nativo
 * del sistema operativo para gestionar el teclado (`adjustResize`): cuando el
 * teclado aparece, Android redimensiona la ventana de la app automáticamente,
 * empujando este componente hacia arriba sin necesidad de código adicional.
 *
 * IMPORTANTE: No usar `KeyboardAvoidingView` con este componente en Android,
 * ya que causa un efecto de "doble salto" al chocar con el `adjustResize` nativo.
 *
 * @prop {string}          value        - El valor actual del TextInput (controlado).
 * @prop {Function}        onChangeText - Callback que recibe el nuevo texto al escribir.
 * @prop {Function}        onSubmit     - Callback que se ejecuta al pulsar Enviar.
 * @prop {string}          [placeholder]- Texto de ayuda cuando el input está vacío.
 * @prop {React.ReactNode} [topContent] - Contenido opcional encima del input (ej: selector de tipo).
 * @prop {React.ReactNode} [leftContent]- Contenido opcional a la izquierda del input (ej: botón calendario).
 *
 * @example
 * // Uso simple (en ListsScreen):
 * <SmartInput value={inputText} onChangeText={setInputText} onSubmit={handleAdd} />
 *
 * @example
 * // Uso con extras (en DailyLogScreen):
 * <SmartInput
 *   value={inputText}
 *   onChangeText={setInputText}
 *   onSubmit={handleAdd}
 *   topContent={<TypeSelector />}
 *   leftContent={<CalendarButton />}
 * />
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
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

  /**
   * Maneja el envío de la entrada.
   * 1. Cierra el teclado (esto NO lo hace `onSubmitEditing` cuando se pulsa el botón circular).
   * 2. Llama al callback `onSubmit` del padre para que procese la entrada.
   */
  const handleSubmit = () => {
    Keyboard.dismiss(); // Cierra el teclado nativo de Android/iOS
    onSubmit();
  };

  return (
    <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>

      {/* Zona superior opcional: selector de tipo (tarea/evento/nota), tags, etc. */}
      {topContent && (
        <View style={styles.topContentContainer}>
          {topContent}
        </View>
      )}

      <View style={styles.inputContainer}>

        {/* Zona izquierda opcional: botón de calendario, icono de lista, etc. */}
        {leftContent && (
          <View style={styles.leftContentContainer}>
            {leftContent}
          </View>
        )}

        {/* Campo de texto principal */}
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
          placeholder={placeholder || (language === 'es' ? 'Escribe aquí...' : 'Type here...')}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          // onSubmitEditing se dispara al pulsar la tecla "Enter" del teclado nativo
          onSubmitEditing={handleSubmit}
          returnKeyType="send" // Muestra "Enviar" en el teclado de Android
        />

        {/* Botón de envío circular. Se activa/desactiva según haya texto. */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: value.trim() ? theme.text : theme.buttonBackground },
            // Sombra de elevación solo cuando está activo para dar feedback visual
            value.trim() ? { elevation: 3 } : null,
          ]}
          onPress={handleSubmit}
          disabled={!value.trim()} // Deshabilitar si no hay texto evita envíos vacíos
          accessibilityLabel={language === 'es' ? 'Enviar' : 'Send'}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-up" size={20} color={theme.cardBackground} />
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /** Contenedor principal. El borde superior separa visualmente el input del contenido. */
  inputWrapper: {
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  /** Fila horizontal: [leftContent] [TextInput] [SendButton] */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  /** Contenedor para el contenido opcional superior (selector de tipo, etc.) */
  topContentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  /** Margen entre el leftContent y el TextInput */
  leftContentContainer: {
    marginRight: 12,
  },
  /** El campo de texto con bordes redondeados tipo "pill" */
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  /** Botón circular de envío */
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
