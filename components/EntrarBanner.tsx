import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { supabase } from '../supabaseConfig';
import { getEffectiveSession, subscribeAuthUiChange } from '../utils/authSession';

type EntrarBannerProps = {
  /** Nome exibido em "Explore mais com sua conta {appName}" */
  appName?: string;
  /** Disparado ao tocar em "Entrar ou cadastrar-se" */
  onPress: () => void;
};

// Telas onde o pill deve aparecer — Home, Cardápio, Detalhe do Item.
// Ajuste aqui se as rotas do seu projeto tiverem outros nomes.
function isQualifyingRoute(pathname: string) {
  if (pathname === '/' || pathname === '/index') return true;
  if (pathname.includes('cardapio')) return true;
  if (pathname.includes('produto')) return true;
  return false;
}

export default function EntrarBanner({ appName = 'Batata Top', onPress }: EntrarBannerProps) {
  const pathname = usePathname();
  const translateY = useSharedValue(140); // começa fora da tela (embaixo)
  const wasShowing = useRef(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // O banner é só pra quem não tá logado PRA UI — usa getEffectiveSession()
  // (considera o soft-logout, ver utils/authSession.js) em vez de checar a
  // sessão real do Supabase direto. Sem isso, o banner some quando "Sim,
  // lembrar" está ativo (sessão real ainda viva) mesmo a UI devendo tratar
  // como deslogado. Assina tanto onAuthStateChange (mudança real) quanto
  // subscribeAuthUiChange (mudança só de flag, que não passa pelo evento
  // do Supabase — ex: "Sim, lembrar" / "Continuar como").
  useEffect(() => {
    let mounted = true;

    async function refresh() {
      const session = await getEffectiveSession();
      if (mounted) setIsLoggedIn(!!session?.user);
    }

    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    const unsubscribeUi = subscribeAuthUiChange(refresh);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeUi();
    };
  }, []);

  const qualifying = isQualifyingRoute(pathname);
  const shouldShow = qualifying && !isLoggedIn;

  useEffect(() => {
    const cameFromShowing = wasShowing.current;

    if (shouldShow && !cameFromShowing) {
      // Entrada normal: sobe de fora da tela com overshoot + settle (bounce)
      translateY.value = 140;
      translateY.value = withSpring(0, {
        damping: 9,
        stiffness: 140,
        mass: 0.9,
      });
    } else if (!shouldShow && cameFromShowing) {
      // Saída definitiva (indo pra tela não-qualificada, ex: checkout,
      // OU o usuário acabou de logar)
      translateY.value = withSequence(
        withTiming(18, { duration: 90, easing: Easing.out(Easing.quad) }),   // agacha
        withTiming(-16, { duration: 110, easing: Easing.out(Easing.quad) }), // impulso pra cima
        withTiming(180, { duration: 220, easing: Easing.in(Easing.cubic) }) // cai saindo da tela
      );
    } else if (shouldShow && cameFromShowing) {
      // Navegou entre duas telas qualificadas (ex: Cardápio -> Item):
      // roda o "pegar embalo" completo e já reentra com o bounce.
      translateY.value = withSequence(
        withTiming(18, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(-16, { duration: 110, easing: Easing.out(Easing.quad) }),
        withTiming(180, { duration: 200, easing: Easing.in(Easing.cubic) }),
        withSpring(0, { damping: 9, stiffness: 140, mass: 0.9 })
      );
    }

    wasShowing.current = shouldShow;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isLoggedIn]);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[styles.wrap, rStyle]}
      pointerEvents={shouldShow ? 'auto' : 'none'}
    >
      <Pressable style={styles.card} onPress={onPress}>
        <Text style={styles.line1}>Explore mais com sua conta {appName}</Text>
        <Text style={styles.line2}>Entrar ou cadastrar-se</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 85, // mesma faixa do CartBar — ver aviso sobre sobreposição
    zIndex: 890,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
    ...SHADOWS.md,
  },
  line1: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  line2: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '800',
    textAlign: 'center',
  },
});
