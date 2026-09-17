import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';

const FONT_FAMILY_MAP = {
  inter: {
    '800': 'Inter_800ExtraBold',
    '700': 'Inter_700Bold',
    bold: 'Inter_700Bold',
    '600': 'Inter_600SemiBold',
    '500': 'Inter_500Medium',
    default: 'Inter_400Regular',
  },
  lora: {
    '700': 'Lora_700Bold',
    bold: 'Lora_700Bold',
    default: 'Lora_400Regular',
  },
  jetbrains: {
    '700': 'JetBrainsMono_700Bold',
    bold: 'JetBrainsMono_700Bold',
    default: 'JetBrainsMono_400Regular',
  },
  roboto: {
    '700': 'Roboto_700Bold',
    bold: 'Roboto_700Bold',
    '500': 'Roboto_500Medium',
    default: 'Roboto_400Regular',
  },
  lato: {
    '700': 'Lato_700Bold',
    bold: 'Lato_700Bold',
    default: 'Lato_400Regular',
  },
  montserrat: {
    '700': 'Montserrat_700Bold',
    bold: 'Montserrat_700Bold',
    '600': 'Montserrat_600SemiBold',
    '500': 'Montserrat_500Medium',
    default: 'Montserrat_400Regular',
  },
  nunito: {
    '700': 'Nunito_700Bold',
    bold: 'Nunito_700Bold',
    '600': 'Nunito_600SemiBold',
    default: 'Nunito_400Regular',
  },
  poppins: {
    '700': 'Poppins_700Bold',
    bold: 'Poppins_700Bold',
    '600': 'Poppins_600SemiBold',
    '500': 'Poppins_500Medium',
    default: 'Poppins_400Regular',
  },
  quicksand: {
    '700': 'Quicksand_700Bold',
    bold: 'Quicksand_700Bold',
    '600': 'Quicksand_600SemiBold',
    '500': 'Quicksand_500Medium',
    default: 'Quicksand_400Regular',
  },
  oswald: {
    '700': 'Oswald_700Bold',
    bold: 'Oswald_700Bold',
    '500': 'Oswald_500Medium',
    default: 'Oswald_400Regular',
  },
  raleway: {
    '700': 'Raleway_700Bold',
    bold: 'Raleway_700Bold',
    '600': 'Raleway_600SemiBold',
    '500': 'Raleway_500Medium',
    default: 'Raleway_400Regular',
  },
  ubuntu: {
    '700': 'Ubuntu_700Bold',
    bold: 'Ubuntu_700Bold',
    '500': 'Ubuntu_500Medium',
    default: 'Ubuntu_400Regular',
  },
  rubik: {
    '700': 'Rubik_700Bold',
    bold: 'Rubik_700Bold',
    '600': 'Rubik_600SemiBold',
    '500': 'Rubik_500Medium',
    default: 'Rubik_400Regular',
  },
  'work-sans': {
    '700': 'WorkSans_700Bold',
    bold: 'WorkSans_700Bold',
    '600': 'WorkSans_600SemiBold',
    '500': 'WorkSans_500Medium',
    default: 'WorkSans_400Regular',
  },
  'fira-sans': {
    '700': 'FiraSans_700Bold',
    bold: 'FiraSans_700Bold',
    '600': 'FiraSans_600SemiBold',
    '500': 'FiraSans_500Medium',
    default: 'FiraSans_400Regular',
  },
  'playfair-display': {
    '700': 'PlayfairDisplay_700Bold',
    bold: 'PlayfairDisplay_700Bold',
    '600': 'PlayfairDisplay_600SemiBold',
    '500': 'PlayfairDisplay_500Medium',
    default: 'PlayfairDisplay_400Regular',
  },
  merriweather: {
    '700': 'Merriweather_700Bold',
    bold: 'Merriweather_700Bold',
    default: 'Merriweather_400Regular',
  },
  'eb-garamond': {
    '700': 'EBGaramond_700Bold',
    bold: 'EBGaramond_700Bold',
    '600': 'EBGaramond_600SemiBold',
    '500': 'EBGaramond_500Medium',
    default: 'EBGaramond_400Regular',
  },
  'pt-serif': {
    '700': 'PTSerif_700Bold',
    bold: 'PTSerif_700Bold',
    default: 'PTSerif_400Regular',
  },
  'noto-serif': {
    '700': 'NotoSerif_700Bold',
    bold: 'NotoSerif_700Bold',
    default: 'NotoSerif_400Regular',
  },
  'libre-baskerville': {
    '700': 'LibreBaskerville_700Bold',
    bold: 'LibreBaskerville_700Bold',
    default: 'LibreBaskerville_400Regular',
  },
  'cormorant-garamond': {
    '700': 'CormorantGaramond_700Bold',
    bold: 'CormorantGaramond_700Bold',
    '600': 'CormorantGaramond_600SemiBold',
    '500': 'CormorantGaramond_500Medium',
    default: 'CormorantGaramond_400Regular',
  },
  'crimson-text': {
    '700': 'CrimsonText_700Bold',
    bold: 'CrimsonText_700Bold',
    '600': 'CrimsonText_600SemiBold',
    default: 'CrimsonText_400Regular',
  },
  'fira-code': {
    '700': 'FiraCode_700Bold',
    bold: 'FiraCode_700Bold',
    '600': 'FiraCode_600SemiBold',
    '500': 'FiraCode_500Medium',
    default: 'FiraCode_400Regular',
  },
  'space-mono': {
    '700': 'SpaceMono_700Bold',
    bold: 'SpaceMono_700Bold',
    default: 'SpaceMono_400Regular',
  },
  inconsolata: {
    '700': 'Inconsolata_700Bold',
    bold: 'Inconsolata_700Bold',
    '600': 'Inconsolata_600SemiBold',
    '500': 'Inconsolata_500Medium',
    default: 'Inconsolata_400Regular',
  },
  'source-code-pro': {
    '700': 'SourceCodePro_700Bold',
    bold: 'SourceCodePro_700Bold',
    '600': 'SourceCodePro_600SemiBold',
    '500': 'SourceCodePro_500Medium',
    default: 'SourceCodePro_400Regular',
  },
  caveat: {
    '700': 'Caveat_700Bold',
    bold: 'Caveat_700Bold',
    '600': 'Caveat_600SemiBold',
    '500': 'Caveat_500Medium',
    default: 'Caveat_400Regular',
  },
  pacifico: {
    default: 'Pacifico_400Regular',
  },
  'dancing-script': {
    '700': 'DancingScript_700Bold',
    bold: 'DancingScript_700Bold',
    '600': 'DancingScript_600SemiBold',
    '500': 'DancingScript_500Medium',
    default: 'DancingScript_400Regular',
  },
};

const resolveFontFamily = (family, weight) => {
  if (!family || family === 'system') return undefined;
  const familyMap = FONT_FAMILY_MAP[family];
  if (!familyMap) return undefined;
  return familyMap[weight] || familyMap.default;
};

export function AppText({ style, children, variant, ...props }) {
  const { fontFamily: globalFontFamily, typographyConfig } = useSettings();
  
  let targetFontFamily = globalFontFamily;
  let variantStyle = null;

  if (variant && typographyConfig && typographyConfig[variant]) {
    const config = typographyConfig[variant];
    if (config.fontFamily) {
      targetFontFamily = config.fontFamily;
    }
    variantStyle = {
      fontSize: config.fontSize,
      fontWeight: config.fontWeight,
    };
    if (config.color) {
      variantStyle.color = config.color;
    }
  }

  const flattenedStyle = StyleSheet.flatten(style);
  const cleanedStyle = variantStyle
    ? { ...flattenedStyle, ...variantStyle }
    : (flattenedStyle ? { ...flattenedStyle } : {});

  const weight = cleanedStyle.fontWeight ? cleanedStyle.fontWeight.toString() : '400';
  const finalFontFamily = resolveFontFamily(targetFontFamily, weight);

  if (finalFontFamily) {
    cleanedStyle.fontFamily = finalFontFamily;
    delete cleanedStyle.fontWeight;
  }

  return (
    <Text style={cleanedStyle} {...props}>
      {children}
    </Text>
  );
}
