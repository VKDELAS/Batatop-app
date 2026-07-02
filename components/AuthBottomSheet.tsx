import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HelpModal from './HelpModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

// Chave usada para reconhecer o usuário localmente.
// TODO: ajustar formato/local de escrita conforme a lógica real de auth
// (ex: gravar isso depois de um login bem-sucedido em login.js).
const SAVED_USER_KEY = '@batatatop:savedUser';

type SavedUser = { name: string };

type AuthBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AuthBottomSheet({ visible, onClose }: AuthBottomSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  // loginfoto.jpeg é 900x1600 (9:16) — altura calculada na mão a partir da
  // largura real da tela, em vez de aspectRatio (que quebra em position:absolute
  // + left/right sem width explícito, principalmente em Android edge-to-edge).
  const IMAGE_HEIGHT = SCREEN_WIDTH * (16 / 9);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const [savedUser, setSavedUser] = useState<SavedUser | null>(null);
  const [estado, setEstado] = useState<'A' | 'B'>('A');
  const [helpVisible, setHelpVisible] = useState(false);

  // Conteúdo do Estado A (botões + social) — usado na transição B -> A
  const switchOpacity = useSharedValue(1);
  const switchTranslateY = useSharedValue(0);

  const checkSavedUser = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_USER_KEY);
      if (raw) {
        const user: SavedUser = JSON.parse(raw);
        setSavedUser(user);
        setEstado('B');
      } else {
        setSavedUser(null);
        setEstado('A');
        switchOpacity.value = 1;
        switchTranslateY.value = 0;
      }
    } catch {
      setSavedUser(null);
      setEstado('A');
    }
  }, []);

  useEffect(() => {
    if (visible) {
      checkSavedUser();
      translateY.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 400 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 350, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, checkSavedUser]);

  function handleAcessarOutraConta() {
    setEstado('A');
    // conteúdo do estado A entra de baixo pra cima, fluido (sem bounce)
    switchOpacity.value = 0;
    switchTranslateY.value = 24;
    switchOpacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    switchTranslateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
  }

  function handleContinuarComo() {
    // TODO: aqui entra a lógica real de retomar a sessão salva
    onClose();
  }

  function handleJaTenhoConta() {
    onClose();
    router.push('/auth/login');
  }

  function handleCriarConta() {
    onClose();
    router.push('/auth/register');
  }

  function handleGoogle() {
    // TODO: integrar login social real (mesmo placeholder do login.js/register.js)
  }

  function handleFacebook() {
    // TODO: integrar login social real
  }

  function handleContactSupport() {
    // TODO: confirmar número real do WhatsApp de suporte
    Linking.openURL('https://wa.me/5500000000000');
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const switchStyle = useAnimatedStyle(() => ({
    opacity: switchOpacity.value,
    transform: [{ translateY: switchTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />

      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Imagem grande no topo, altura exata calculada da largura real da tela (9:16) */}
        <Image
          source={require('../assets/loginfoto.jpeg')}
          style={[styles.image, { width: SCREEN_WIDTH, height: IMAGE_HEIGHT }]}
          resizeMode="cover"
        />

        <Pressable style={[styles.backBtn, { top: insets.top + 8 }]} onPress={onClose} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>

        <Pressable
          style={[styles.helpBtn, { top: insets.top + 8 }]}
          onPress={() => setHelpVisible(true)}
          hitSlop={8}
        >
          <Ionicons name="help" size={20} color="#FFFFFF" />
        </Pressable>

        {/* Painel flutua por cima da imagem, altura só do conteúdo */}
        <View style={styles.content}>
          {estado === 'B' && savedUser ? (
            <>
              <Pressable style={styles.btnFilled} onPress={handleContinuarComo}>
                <Text style={styles.btnFilledText}>Continuar como {savedUser.name}</Text>
              </Pressable>
              <Pressable style={styles.btnOutline} onPress={handleAcessarOutraConta}>
                <Text style={styles.btnOutlineText}>Acessar outra conta</Text>
              </Pressable>
            </>
          ) : (
            <Animated.View style={switchStyle}>
              <Pressable style={styles.btnFilled} onPress={handleJaTenhoConta}>
                <Text style={styles.btnFilledText}>Já tenho uma conta</Text>
              </Pressable>
              <Pressable style={styles.btnOutline} onPress={handleCriarConta}>
                <Text style={styles.btnOutlineText}>Criar nova conta</Text>
              </Pressable>

              <Text style={styles.acessarComText}>Acessar com</Text>
              <View style={styles.socialRow}>
                <Pressable style={styles.socialBtn} onPress={handleGoogle}>
                  <Ionicons name="logo-google" size={22} color="#1A1A1A" />
                </Pressable>
                <Pressable style={styles.socialBtn} onPress={handleFacebook}>
                  <Ionicons name="logo-facebook" size={22} color="#1A1A1A" />
                </Pressable>
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      <HelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        onContactSupport={handleContactSupport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtn: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20,20,20,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[6],
    paddingBottom: SPACING[8],
  },
  btnFilled: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[3],
  },
  btnFilledText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  acessarComText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    marginTop: SPACING[5],
    marginBottom: SPACING[3],
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING[4],
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
