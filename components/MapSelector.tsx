/**
 * MapSelector.tsx
 *
 * Modal/tela de mapa interativo (Estado C). O PIN fica fixo no centro da
 * tela — quem se move é o mapa por baixo (mesmo comportamento do Uber/iFood).
 * Reverse geocoding acontece em tempo real (com debounce) via
 * useGeolocationWithMaps a cada vez que o usuário solta o dedo do mapa.
 *
 * Usa react-native-maps (MapView nativo — Apple Maps no iOS, Google Maps no
 * Android). Não precisa de API key pro uso básico em Expo Go / dev build,
 * mas builds standalone Android em produção normalmente precisam de uma
 * Google Maps API key configurada no app.json (ver nota no final do arquivo).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import useGeolocationWithMaps from 'app/hooks/useGeolocationWithMaps';

const CIDADE_PERMITIDA = 'Iacanga';
const UF_PERMITIDA = 'SP';

// Centro aproximado de Iacanga/SP — usado quando não há coords iniciais
// (ex: usuário clicou direto em "Buscar pelo mapa" sem selecionar nada antes).
const DEFAULT_REGION: Region = {
  latitude: -21.8402,
  longitude: -49.0058,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export type MapSelectorResult = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  formatted: string;
};

type MapSelectorProps = {
  /** Coordenadas iniciais (vindas do GPS ou de uma sugestão de busca). Se omitido, centra em Iacanga/SP. */
  initialCoords?: { latitude: number; longitude: number } | null;
  onConfirm: (result: MapSelectorResult) => void;
  onBack: () => void;
};

export default function MapSelector({ initialCoords, onBack, onConfirm }: MapSelectorProps) {
  const { geoLoading, error, reverseGeocodeDebounced } = useGeolocationWithMaps();

  const initialRegion: Region = initialCoords
    ? { ...DEFAULT_REGION, latitude: initialCoords.latitude, longitude: initialCoords.longitude }
    : DEFAULT_REGION;

  const [region, setRegion] = useState<Region>(initialRegion);
  const [centerAddress, setCenterAddress] = useState<any>(null);
  const mapRef = useRef<MapView>(null);

  // Reverse geo assim que a tela abre, pro endereço já aparecer sem precisar mexer no mapa.
  useEffect(() => {
    reverseGeocodeDebounced(initialRegion.latitude, initialRegion.longitude).then((r) => {
      if (r) setCenterAddress(r);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dispara só quando o usuário PARA de arrastar (não a cada frame) — o
  // debounce interno do hook já protege contra excesso de requests também.
  const handleRegionChangeComplete = useCallback(
    (r: Region) => {
      setRegion(r);
      reverseGeocodeDebounced(r.latitude, r.longitude).then((res) => {
        if (res) setCenterAddress(res);
      });
    },
    [reverseGeocodeDebounced]
  );

  const isValid = !!centerAddress && centerAddress.isValidCity && !geoLoading;

  const handleConfirm = () => {
    if (!centerAddress || !centerAddress.isValidCity) return;
    onConfirm({
      street: centerAddress.street,
      neighborhood: centerAddress.neighborhood,
      city: centerAddress.city || CIDADE_PERMITIDA,
      state: centerAddress.state || UF_PERMITIDA,
      latitude: region.latitude,
      longitude: region.longitude,
      formatted: centerAddress.formatted,
    });
  };

  return (
    <View style={st.wrap}>
      <View style={st.header}>
        <Pressable style={st.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </Pressable>
        <Text style={st.headerTitle}>Ajuste o pino no mapa</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={st.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        />

        {/* Pin fixo no centro da tela — o mapa que se move por baixo dele. */}
        <View style={st.pinWrap} pointerEvents="none">
          <Ionicons name="location" size={40} color={COLORS.secondary} />
          <View style={st.pinShadow} />
        </View>
      </View>

      <View style={st.footer}>
        {geoLoading ? (
          <View style={st.addressRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={st.addressLoading}>Identificando endereço...</Text>
          </View>
        ) : centerAddress ? (
          <>
            <Text style={st.addressLine1} numberOfLines={1}>
              {centerAddress.street || 'Rua não identificada'}
            </Text>
            <Text style={st.addressLine2} numberOfLines={1}>
              {centerAddress.city || '—'}, {centerAddress.state || '—'}
            </Text>
            {!centerAddress.isValidCity && (
              <Text style={st.cityWarning}>
                🚫 Só entregamos em {CIDADE_PERMITIDA}/{UF_PERMITIDA}. Mova o mapa pra essa região.
              </Text>
            )}
          </>
        ) : (
          <Text style={st.addressLine2}>Mova o mapa pra selecionar um ponto.</Text>
        )}

        {!!error && <Text style={st.errorText}>{error}</Text>}

        <Pressable
          style={[st.confirmBtn, !isValid && st.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!isValid}
        >
          <Text style={[st.confirmText, !isValid && st.confirmTextDisabled]}>Continuar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: SPACING[3],
    backgroundColor: COLORS.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontWeight: '800', fontSize: TYPOGRAPHY.sizes.base },
  mapWrap: { flex: 1, position: 'relative' },
  pinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
  },
  pinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: -2,
  },
  footer: {
    padding: SPACING[5],
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING[2],
    ...SHADOWS.md,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2] },
  addressLoading: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizes.sm },
  addressLine1: { color: COLORS.text, fontWeight: '700', fontSize: TYPOGRAPHY.sizes.sm },
  addressLine2: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizes.xs },
  cityWarning: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginTop: 4 },
  errorText: { color: '#EF4444', fontSize: 12 },
  confirmBtn: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING[2],
  },
  confirmBtnDisabled: { backgroundColor: '#CCCCCC' },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: TYPOGRAPHY.sizes.sm },
  confirmTextDisabled: { color: '#888888' },
});

/**
 * app.json — plugin necessário:
 *
 * "plugins": [
 *   ["react-native-maps"]
 * ]
 *
 * Nota sobre API key: react-native-maps usa Apple Maps no iOS (sem key) e
 * Google Maps no Android. Em Expo Go / dev client geralmente funciona sem
 * key configurada. Pra build standalone (EAS Build) em produção no Android,
 * o Google exige uma API key do Google Maps SDK configurada assim:
 *
 * "android": {
 *   "config": { "googleMaps": { "apiKey": "SUA_CHAVE_AQUI" } }
 * }
 *
 * A camada de rua/reverse geo em si (Nominatim) continua 100% gratuita e
 * sem key — é só o tile do mapa nativo do Android que pode exigir isso.
 */
