/**
 * @module FontLoader
 * Cargador de fuentes tipográficas bajo demanda (Lazy Font Loader).
 *
 * En lugar de cargar 80 variaciones de fuentes de Google Fonts simultáneamente
 * al arrancar la aplicación (lo que ralentizaba el arranque entre 10 y 20 segundos),
 * este servicio carga las fuentes de forma perezosa en segundo plano únicamente
 * cuando el usuario las necesita o las selecciona en los Ajustes.
 */

import * as Font from 'expo-font';

/** Conjunto para rastrear fuentes ya cargadas en memoria */
const loadedFonts = new Set([
  'system',
  'inter',
  'lora',
  'jetbrains',
  'eb-garamond',
  'roboto',
]);

/** Registro de cargadores asíncronos bajo demanda */
const fontRegistry = {
  'lato': () => {
    const m = require('@expo-google-fonts/lato');
    return Font.loadAsync({ Lato_400Regular: m.Lato_400Regular, Lato_700Bold: m.Lato_700Bold });
  },
  'montserrat': () => {
    const m = require('@expo-google-fonts/montserrat');
    return Font.loadAsync({
      Montserrat_400Regular: m.Montserrat_400Regular,
      Montserrat_500Medium: m.Montserrat_500Medium,
      Montserrat_600SemiBold: m.Montserrat_600SemiBold,
      Montserrat_700Bold: m.Montserrat_700Bold,
    });
  },
  'nunito': () => {
    const m = require('@expo-google-fonts/nunito');
    return Font.loadAsync({
      Nunito_400Regular: m.Nunito_400Regular,
      Nunito_600SemiBold: m.Nunito_600SemiBold,
      Nunito_700Bold: m.Nunito_700Bold,
    });
  },
  'poppins': () => {
    const m = require('@expo-google-fonts/poppins');
    return Font.loadAsync({
      Poppins_400Regular: m.Poppins_400Regular,
      Poppins_500Medium: m.Poppins_500Medium,
      Poppins_600SemiBold: m.Poppins_600SemiBold,
      Poppins_700Bold: m.Poppins_700Bold,
    });
  },
  'quicksand': () => {
    const m = require('@expo-google-fonts/quicksand');
    return Font.loadAsync({
      Quicksand_400Regular: m.Quicksand_400Regular,
      Quicksand_500Medium: m.Quicksand_500Medium,
      Quicksand_600SemiBold: m.Quicksand_600SemiBold,
      Quicksand_700Bold: m.Quicksand_700Bold,
    });
  },
  'oswald': () => {
    const m = require('@expo-google-fonts/oswald');
    return Font.loadAsync({
      Oswald_400Regular: m.Oswald_400Regular,
      Oswald_500Medium: m.Oswald_500Medium,
      Oswald_700Bold: m.Oswald_700Bold,
    });
  },
  'raleway': () => {
    const m = require('@expo-google-fonts/raleway');
    return Font.loadAsync({
      Raleway_400Regular: m.Raleway_400Regular,
      Raleway_500Medium: m.Raleway_500Medium,
      Raleway_600SemiBold: m.Raleway_600SemiBold,
      Raleway_700Bold: m.Raleway_700Bold,
    });
  },
  'ubuntu': () => {
    const m = require('@expo-google-fonts/ubuntu');
    return Font.loadAsync({
      Ubuntu_400Regular: m.Ubuntu_400Regular,
      Ubuntu_500Medium: m.Ubuntu_500Medium,
      Ubuntu_700Bold: m.Ubuntu_700Bold,
    });
  },
  'rubik': () => {
    const m = require('@expo-google-fonts/rubik');
    return Font.loadAsync({
      Rubik_400Regular: m.Rubik_400Regular,
      Rubik_500Medium: m.Rubik_500Medium,
      Rubik_600SemiBold: m.Rubik_600SemiBold,
      Rubik_700Bold: m.Rubik_700Bold,
    });
  },
  'work-sans': () => {
    const m = require('@expo-google-fonts/work-sans');
    return Font.loadAsync({
      WorkSans_400Regular: m.WorkSans_400Regular,
      WorkSans_500Medium: m.WorkSans_500Medium,
      WorkSans_600SemiBold: m.WorkSans_600SemiBold,
      WorkSans_700Bold: m.WorkSans_700Bold,
    });
  },
  'fira-sans': () => {
    const m = require('@expo-google-fonts/fira-sans');
    return Font.loadAsync({
      FiraSans_400Regular: m.FiraSans_400Regular,
      FiraSans_500Medium: m.FiraSans_500Medium,
      FiraSans_600SemiBold: m.FiraSans_600SemiBold,
      FiraSans_700Bold: m.FiraSans_700Bold,
    });
  },
  'playfair-display': () => {
    const m = require('@expo-google-fonts/playfair-display');
    return Font.loadAsync({
      PlayfairDisplay_400Regular: m.PlayfairDisplay_400Regular,
      PlayfairDisplay_500Medium: m.PlayfairDisplay_500Medium,
      PlayfairDisplay_600SemiBold: m.PlayfairDisplay_600SemiBold,
      PlayfairDisplay_700Bold: m.PlayfairDisplay_700Bold,
    });
  },
  'merriweather': () => {
    const m = require('@expo-google-fonts/merriweather');
    return Font.loadAsync({ Merriweather_400Regular: m.Merriweather_400Regular, Merriweather_700Bold: m.Merriweather_700Bold });
  },
  'pt-serif': () => {
    const m = require('@expo-google-fonts/pt-serif');
    return Font.loadAsync({ PTSerif_400Regular: m.PTSerif_400Regular, PTSerif_700Bold: m.PTSerif_700Bold });
  },
  'noto-serif': () => {
    const m = require('@expo-google-fonts/noto-serif');
    return Font.loadAsync({ NotoSerif_400Regular: m.NotoSerif_400Regular, NotoSerif_700Bold: m.NotoSerif_700Bold });
  },
  'libre-baskerville': () => {
    const m = require('@expo-google-fonts/libre-baskerville');
    return Font.loadAsync({ LibreBaskerville_400Regular: m.LibreBaskerville_400Regular, LibreBaskerville_700Bold: m.LibreBaskerville_700Bold });
  },
  'cormorant-garamond': () => {
    const m = require('@expo-google-fonts/cormorant-garamond');
    return Font.loadAsync({
      CormorantGaramond_400Regular: m.CormorantGaramond_400Regular,
      CormorantGaramond_500Medium: m.CormorantGaramond_500Medium,
      CormorantGaramond_600SemiBold: m.CormorantGaramond_600SemiBold,
      CormorantGaramond_700Bold: m.CormorantGaramond_700Bold,
    });
  },
  'crimson-text': () => {
    const m = require('@expo-google-fonts/crimson-text');
    return Font.loadAsync({
      CrimsonText_400Regular: m.CrimsonText_400Regular,
      CrimsonText_600SemiBold: m.CrimsonText_600SemiBold,
      CrimsonText_700Bold: m.CrimsonText_700Bold,
    });
  },
  'fira-code': () => {
    const m = require('@expo-google-fonts/fira-code');
    return Font.loadAsync({
      FiraCode_400Regular: m.FiraCode_400Regular,
      FiraCode_500Medium: m.FiraCode_500Medium,
      FiraCode_600SemiBold: m.FiraCode_600SemiBold,
      FiraCode_700Bold: m.FiraCode_700Bold,
    });
  },
  'space-mono': () => {
    const m = require('@expo-google-fonts/space-mono');
    return Font.loadAsync({ SpaceMono_400Regular: m.SpaceMono_400Regular, SpaceMono_700Bold: m.SpaceMono_700Bold });
  },
  'inconsolata': () => {
    const m = require('@expo-google-fonts/inconsolata');
    return Font.loadAsync({
      Inconsolata_400Regular: m.Inconsolata_400Regular,
      Inconsolata_500Medium: m.Inconsolata_500Medium,
      Inconsolata_600SemiBold: m.Inconsolata_600SemiBold,
      Inconsolata_700Bold: m.Inconsolata_700Bold,
    });
  },
  'source-code-pro': () => {
    const m = require('@expo-google-fonts/source-code-pro');
    return Font.loadAsync({
      SourceCodePro_400Regular: m.SourceCodePro_400Regular,
      SourceCodePro_500Medium: m.SourceCodePro_500Medium,
      SourceCodePro_600SemiBold: m.SourceCodePro_600SemiBold,
      SourceCodePro_700Bold: m.SourceCodePro_700Bold,
    });
  },
  'caveat': () => {
    const m = require('@expo-google-fonts/caveat');
    return Font.loadAsync({
      Caveat_400Regular: m.Caveat_400Regular,
      Caveat_500Medium: m.Caveat_500Medium,
      Caveat_600SemiBold: m.Caveat_600SemiBold,
      Caveat_700Bold: m.Caveat_700Bold,
    });
  },
  'pacifico': () => {
    const m = require('@expo-google-fonts/pacifico');
    return Font.loadAsync({ Pacifico_400Regular: m.Pacifico_400Regular });
  },
  'dancing-script': () => {
    const m = require('@expo-google-fonts/dancing-script');
    return Font.loadAsync({
      DancingScript_400Regular: m.DancingScript_400Regular,
      DancingScript_500Medium: m.DancingScript_500Medium,
      DancingScript_600SemiBold: m.DancingScript_600SemiBold,
      DancingScript_700Bold: m.DancingScript_700Bold,
    });
  },
};

/**
 * Carga una familia tipográfica bajo demanda si aún no está en memoria.
 * @param {string} fontId - Identificador de la fuente (ej: 'poppins', 'caveat').
 * @returns {Promise<void>}
 */
export async function loadFontFamily(fontId) {
  if (!fontId || fontId === 'system' || loadedFonts.has(fontId)) return;
  const loader = fontRegistry[fontId];
  if (loader) {
    try {
      await loader();
      loadedFonts.add(fontId);
    } catch (e) {
      console.warn(`[FontLoader] Error al cargar fuente ${fontId}:`, e);
    }
  }
}

/**
 * Precarga todas las fuentes registradas para que el usuario las previsualice con su tipografía real en los Ajustes.
 * @returns {Promise<void>}
 */
export async function loadAllFonts() {
  const fontIds = Object.keys(fontRegistry);
  await Promise.allSettled(fontIds.map(id => loadFontFamily(id)));
}

export function isFontLoaded(fontId) {
  if (!fontId || fontId === 'system') return true;
  return loadedFonts.has(fontId);
}

