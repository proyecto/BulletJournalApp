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

  if (fontFamily === 'system') {
    // do nothing
  } else if (fontFamily === 'inter') {
    if (weight === '800') finalFontFamily = 'Inter_800ExtraBold';
    else if (weight === '700' || weight === 'bold') finalFontFamily = 'Inter_700Bold';
    else if (weight === '600') finalFontFamily = 'Inter_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Inter_500Medium';
    else finalFontFamily = 'Inter_400Regular';
  } else if (fontFamily === 'lora') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Lora_700Bold';
    else finalFontFamily = 'Lora_400Regular';
  } else if (fontFamily === 'jetbrains') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'JetBrainsMono_700Bold';
    else finalFontFamily = 'JetBrainsMono_400Regular';
  } else if (fontFamily === 'roboto') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Roboto_700Bold';
    else if (weight === '500') finalFontFamily = 'Roboto_500Medium';
    else finalFontFamily = 'Roboto_400Regular';
  } else if (fontFamily === 'lato') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Lato_700Bold';
    else finalFontFamily = 'Lato_400Regular';
  } else if (fontFamily === 'montserrat') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Montserrat_700Bold';
    else if (weight === '600') finalFontFamily = 'Montserrat_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Montserrat_500Medium';
    else finalFontFamily = 'Montserrat_400Regular';
  } else if (fontFamily === 'nunito') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Nunito_700Bold';
    else if (weight === '600') finalFontFamily = 'Nunito_600SemiBold';
    else finalFontFamily = 'Nunito_400Regular';
  } else if (fontFamily === 'poppins') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Poppins_700Bold';
    else if (weight === '600') finalFontFamily = 'Poppins_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Poppins_500Medium';
    else finalFontFamily = 'Poppins_400Regular';
  } else if (fontFamily === 'quicksand') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Quicksand_700Bold';
    else if (weight === '600') finalFontFamily = 'Quicksand_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Quicksand_500Medium';
    else finalFontFamily = 'Quicksand_400Regular';
  } else if (fontFamily === 'oswald') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Oswald_700Bold';
    else if (weight === '500') finalFontFamily = 'Oswald_500Medium';
    else finalFontFamily = 'Oswald_400Regular';
  } else if (fontFamily === 'raleway') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Raleway_700Bold';
    else if (weight === '600') finalFontFamily = 'Raleway_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Raleway_500Medium';
    else finalFontFamily = 'Raleway_400Regular';
  } else if (fontFamily === 'ubuntu') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Ubuntu_700Bold';
    else if (weight === '500') finalFontFamily = 'Ubuntu_500Medium';
    else finalFontFamily = 'Ubuntu_400Regular';
  } else if (fontFamily === 'rubik') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Rubik_700Bold';
    else if (weight === '600') finalFontFamily = 'Rubik_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Rubik_500Medium';
    else finalFontFamily = 'Rubik_400Regular';
  } else if (fontFamily === 'work-sans') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'WorkSans_700Bold';
    else if (weight === '600') finalFontFamily = 'WorkSans_600SemiBold';
    else if (weight === '500') finalFontFamily = 'WorkSans_500Medium';
    else finalFontFamily = 'WorkSans_400Regular';
  } else if (fontFamily === 'fira-sans') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'FiraSans_700Bold';
    else if (weight === '600') finalFontFamily = 'FiraSans_600SemiBold';
    else if (weight === '500') finalFontFamily = 'FiraSans_500Medium';
    else finalFontFamily = 'FiraSans_400Regular';
  } else if (fontFamily === 'playfair-display') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'PlayfairDisplay_700Bold';
    else if (weight === '600') finalFontFamily = 'PlayfairDisplay_600SemiBold';
    else if (weight === '500') finalFontFamily = 'PlayfairDisplay_500Medium';
    else finalFontFamily = 'PlayfairDisplay_400Regular';
  } else if (fontFamily === 'merriweather') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Merriweather_700Bold';
    else finalFontFamily = 'Merriweather_400Regular';
  } else if (fontFamily === 'eb-garamond') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'EBGaramond_700Bold';
    else if (weight === '600') finalFontFamily = 'EBGaramond_600SemiBold';
    else if (weight === '500') finalFontFamily = 'EBGaramond_500Medium';
    else finalFontFamily = 'EBGaramond_400Regular';
  } else if (fontFamily === 'pt-serif') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'PTSerif_700Bold';
    else finalFontFamily = 'PTSerif_400Regular';
  } else if (fontFamily === 'noto-serif') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'NotoSerif_700Bold';
    else finalFontFamily = 'NotoSerif_400Regular';
  } else if (fontFamily === 'libre-baskerville') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'LibreBaskerville_700Bold';
    else finalFontFamily = 'LibreBaskerville_400Regular';
  } else if (fontFamily === 'cormorant-garamond') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'CormorantGaramond_700Bold';
    else if (weight === '600') finalFontFamily = 'CormorantGaramond_600SemiBold';
    else if (weight === '500') finalFontFamily = 'CormorantGaramond_500Medium';
    else finalFontFamily = 'CormorantGaramond_400Regular';
  } else if (fontFamily === 'crimson-text') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'CrimsonText_700Bold';
    else if (weight === '600') finalFontFamily = 'CrimsonText_600SemiBold';
    else finalFontFamily = 'CrimsonText_400Regular';
  } else if (fontFamily === 'fira-code') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'FiraCode_700Bold';
    else if (weight === '600') finalFontFamily = 'FiraCode_600SemiBold';
    else if (weight === '500') finalFontFamily = 'FiraCode_500Medium';
    else finalFontFamily = 'FiraCode_400Regular';
  } else if (fontFamily === 'space-mono') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'SpaceMono_700Bold';
    else finalFontFamily = 'SpaceMono_400Regular';
  } else if (fontFamily === 'inconsolata') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Inconsolata_700Bold';
    else if (weight === '600') finalFontFamily = 'Inconsolata_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Inconsolata_500Medium';
    else finalFontFamily = 'Inconsolata_400Regular';
  } else if (fontFamily === 'source-code-pro') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'SourceCodePro_700Bold';
    else if (weight === '600') finalFontFamily = 'SourceCodePro_600SemiBold';
    else if (weight === '500') finalFontFamily = 'SourceCodePro_500Medium';
    else finalFontFamily = 'SourceCodePro_400Regular';
  } else if (fontFamily === 'caveat') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'Caveat_700Bold';
    else if (weight === '600') finalFontFamily = 'Caveat_600SemiBold';
    else if (weight === '500') finalFontFamily = 'Caveat_500Medium';
    else finalFontFamily = 'Caveat_400Regular';
  } else if (fontFamily === 'pacifico') {
finalFontFamily = 'Pacifico_400Regular';
  } else if (fontFamily === 'dancing-script') {
if (weight === '700' || weight === 'bold') finalFontFamily = 'DancingScript_700Bold';
    else if (weight === '600') finalFontFamily = 'DancingScript_600SemiBold';
    else if (weight === '500') finalFontFamily = 'DancingScript_500Medium';
    else finalFontFamily = 'DancingScript_400Regular';
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
