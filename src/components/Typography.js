import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export function AppText({ style, children, ...props }) {
  const { fontFamily } = useSettings();
  
  let weight = '400';
  if (style) {
    const flatStyle = StyleSheet.flatten(style);
    if (flatStyle.fontWeight) {
      weight = flatStyle.fontWeight.toString();
    }
  }

  let finalFontFamily = undefined; 

  if (fontFamily === 'lora') {
    if (weight === '500' || weight === '600' || weight === 'bold' || weight === '700' || weight === '800') {
      finalFontFamily = 'Lora_700Bold';
    } else {
      finalFontFamily = 'Lora_400Regular';
    }
  } else if (fontFamily === 'jetbrains') {
    if (weight === '500' || weight === '600' || weight === 'bold' || weight === '700' || weight === '800') {
      finalFontFamily = 'JetBrainsMono_700Bold';
    } else {
      finalFontFamily = 'JetBrainsMono_400Regular';
    }
  } else if (fontFamily === 'inter') {
    if (weight === '800') finalFontFamily = 'Inter_800ExtraBold';
    else if (weight === '700' || weight === 'bold') finalFontFamily = 'Inter_700Bold';
    else if (weight === '600') finalFontFamily = 'Inter_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Inter_500Medium';
    else finalFontFamily = 'Inter_400Regular';
  }
  // If fontFamily === 'system', finalFontFamily remains undefined, forcing native system font.

  let cleanedStyle = { ...StyleSheet.flatten(style) };
  if (finalFontFamily) {
    cleanedStyle.fontFamily = finalFontFamily;
    if (Platform.OS === 'android') {
       delete cleanedStyle.fontWeight;
    }
  }

  return (
    <Text style={cleanedStyle} {...props}>
      {children}
    </Text>
  );
}
