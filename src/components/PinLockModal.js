/**
 * @component PinLockModal
 * @description Pantalla/Modal de bloqueo y configuración de PIN de 4 dígitos.
 * Soporta modos: 'unlock', 'setup', 'disable', 'change'.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { AppText as Text } from './Typography';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';

export default function PinLockModal({
  visible,
  mode = 'unlock', // 'unlock' | 'setup' | 'disable' | 'change'
  onSuccess,
  onCancel,
}) {
  const { theme, language, verifyPin, setupPin, removePin, pinCode } = useSettings();
  const insets = useSafeAreaInsets();

  const [enteredPin, setEnteredPin] = useState('');
  const [setupStep, setSetupStep] = useState(1); // 1 = nuevo PIN, 2 = confirmar
  const [tempFirstPin, setTempFirstPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));

  const pinTimerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setEnteredPin('');
      setSetupStep(1);
      setTempFirstPin('');
      setErrorMessage('');
    }
    return () => {
      if (pinTimerRef.current) {
        clearTimeout(pinTimerRef.current);
      }
    };
  }, [visible, mode]);

  const triggerErrorAnimation = (msg) => {
    setErrorMessage(msg);
    setEnteredPin('');
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (digit) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMessage('');

    if (nextPin.length === 4) {
      if (pinTimerRef.current) clearTimeout(pinTimerRef.current);
      pinTimerRef.current = setTimeout(() => processPinInput(nextPin), 80);
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(prev => prev.slice(0, -1));
      setErrorMessage('');
    }
  };

  const processPinInput = (pin) => {
    if (mode === 'unlock') {
      const isValid = verifyPin(pin);
      if (isValid) {
        if (onSuccess) onSuccess();
      } else {
        triggerErrorAnimation(
          language === 'es' ? 'PIN incorrecto. Inténtalo de nuevo.' : 'Incorrect PIN. Try again.'
        );
      }
    } else if (mode === 'disable') {
      if (pin === pinCode) {
        removePin();
        if (onSuccess) onSuccess();
      } else {
        triggerErrorAnimation(
          language === 'es' ? 'PIN incorrecto. Inténtalo de nuevo.' : 'Incorrect PIN. Try again.'
        );
      }
    } else if (mode === 'setup') {
      if (setupStep === 1) {
        setTempFirstPin(pin);
        setEnteredPin('');
        setSetupStep(2);
      } else if (setupStep === 2) {
        if (pin === tempFirstPin) {
          setupPin(pin);
          if (onSuccess) onSuccess();
        } else {
          setSetupStep(1);
          setTempFirstPin('');
          triggerErrorAnimation(
            language === 'es' ? 'Los PINs no coinciden. Elige un PIN.' : 'PINs do not match. Choose PIN.'
          );
        }
      }
    } else if (mode === 'change') {
      if (setupStep === 1) {
        // Verificar PIN actual
        if (pin === pinCode) {
          setEnteredPin('');
          setSetupStep(2);
        } else {
          triggerErrorAnimation(
            language === 'es' ? 'PIN actual incorrecto.' : 'Incorrect current PIN.'
          );
        }
      } else if (setupStep === 2) {
        setTempFirstPin(pin);
        setEnteredPin('');
        setSetupStep(3);
      } else if (setupStep === 3) {
        if (pin === tempFirstPin) {
          setupPin(pin);
          if (onSuccess) onSuccess();
        } else {
          setSetupStep(2);
          setTempFirstPin('');
          triggerErrorAnimation(
            language === 'es' ? 'Los PINs no coinciden. Reintenta.' : 'PINs do not match. Retry.'
          );
        }
      }
    }
  };

  const getTitleText = () => {
    if (mode === 'unlock') {
      return language === 'es' ? 'Introduce tu PIN' : 'Enter PIN';
    }
    if (mode === 'disable') {
      return language === 'es' ? 'Introduce el PIN actual' : 'Enter current PIN';
    }
    if (mode === 'setup') {
      return setupStep === 1
        ? (language === 'es' ? 'Crea un PIN de 4 dígitos' : 'Create 4-digit PIN')
        : (language === 'es' ? 'Confirma tu nuevo PIN' : 'Confirm your PIN');
    }
    if (mode === 'change') {
      if (setupStep === 1) return language === 'es' ? 'Introduce PIN actual' : 'Enter current PIN';
      if (setupStep === 2) return language === 'es' ? 'Nuevo PIN' : 'New PIN';
      return language === 'es' ? 'Confirma nuevo PIN' : 'Confirm new PIN';
    }
    return '';
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => {
        if (mode !== 'unlock' && onCancel) onCancel();
      }}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Botón de cerrar si no es modo desbloqueo obligatorio */}
        {mode !== 'unlock' && onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.closeButton, { backgroundColor: theme.inputBackground }]}
          >
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
        )}

        {/* Cabecera / Título */}
        <View style={styles.header}>
          <Ionicons name="lock-closed-outline" size={40} color={theme.primary} style={{ marginBottom: 12 }} />
          <Text variant="h2" style={[styles.title, { color: theme.text }]}>
            {getTitleText()}
          </Text>
          {errorMessage ? (
            <Text variant="caption" style={[styles.errorText, { color: theme.error || '#FF3B30' }]}>
              {errorMessage}
            </Text>
          ) : (
            <Text variant="caption" style={{ color: theme.textSecondary, marginTop: 4 }}>
              {language === 'es' ? 'Bullet Journal Protegido' : 'Protected Bullet Journal'}
            </Text>
          )}
        </View>

        {/* Indicadores de 4 Puntos PIN (○ ○ ○ ○) */}
        <Animated.View
          style={[
            styles.dotsRow,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isFilled ? theme.text : 'transparent',
                    borderColor: isFilled ? theme.text : theme.textSecondary,
                  },
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Teclado Numérico */}
        <View style={styles.keypad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rIdx) => (
            <View key={rIdx} style={styles.keyRow}>
              {row.map((digit) => (
                <TouchableOpacity
                  key={digit}
                  style={[styles.keyButton, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleKeyPress(digit)}
                  activeOpacity={0.6}
                >
                  <Text variant="h2" style={{ color: theme.text, fontWeight: '600' }}>
                    {digit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={styles.keyRow}>
            <View style={styles.emptyKey} />
            <TouchableOpacity
              style={[styles.keyButton, { backgroundColor: theme.cardBackground }]}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.6}
            >
              <Text variant="h2" style={{ color: theme.text, fontWeight: '600' }}>
                0
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyButton, { backgroundColor: 'transparent' }]}
              onPress={handleDelete}
              activeOpacity={0.6}
            >
              <Ionicons name="backspace-outline" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 45,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 6,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 30,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    marginBottom: 30,
    gap: 16,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyKey: {
    width: 70,
    height: 70,
  },
});
