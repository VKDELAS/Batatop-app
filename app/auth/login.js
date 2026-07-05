import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { supabase } from '../../supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';

const RESEND_SECONDS = 59;
const SAVED_USER_KEY = '@batatatop:savedUser';

// Salva o essencial pra tela "continuar como [nome]" reconhecer o
// usuário na próxima vez que o app abrir (mesmo depois de sair/reinstalar
// e logar de novo).
const persistSavedUser = async ({ name, email, refreshToken, userId }) => {
  try {
    // Query profiles pra pegar telefone
    let phone = '';
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('telefone')
        .eq('id', userId)
        .maybeSingle();
      phone = profile?.telefone || '';
    }

    const userData = {
      name,
      email,
      phone,
      refreshToken,
    };

    await AsyncStorage.setItem(SAVED_USER_KEY, JSON.stringify(userData));
  } catch (e) {
    // Falha em salvar não deve travar o login — só significa que o
    // "continuar como" não vai aparecer da próxima vez.
    console.log('Falha ao salvar savedUser:', e);
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 'email' → tela 1 | 'code' → tela 2 | 'name' → tela 3 (só usuário novo)
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const emailRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null); // { type: 'error' | 'success', text }

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [focusedBox, setFocusedBox] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [helpVisible, setHelpVisible] = useState(false);
  const codeRefs = useRef([]);

  const [name, setName] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const nameRef = useRef(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNameValid = name.trim().length >= 2;

  // Posição do footer acompanhando o teclado — via react-native-keyboard-
  // controller. Diferente do Keyboard API do RN, esse hook lê o inset do
  // teclado direto do nível nativo (WindowInsets no Android, keyboard
  // frame no iOS) a cada frame, então não depende do resize automático da
  // janela e não fica desincronizado depois de um ciclo de
  // background/foreground. `height` vem negativo (0 → -altura do teclado)
  // conforme o teclado abre.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const footerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardHeight.value }],
  }));

  // Foco automático do campo de e-mail/nome — com um pequeno atraso pra
  // deixar a transição de entrada da tela terminar antes do teclado subir.
  // Sem esse atraso, o teclado abre no meio da animação de navegação e o
  // layout (cabeçalho + footer) fica temporariamente errado até assentar.
  useEffect(() => {
    if (step === 'email') {
      const t = setTimeout(() => emailRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
    if (step === 'name') {
      const t = setTimeout(() => nameRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Contador regressivo pra reenvio do código
  useEffect(() => {
    if (step !== 'code' || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  const formatTime = (s) => `0:${String(s).padStart(2, '0')}`;

  // Banner de sucesso ("Código reenviado") some sozinho depois de 3s.
  // O de erro fica até o usuário digitar de novo (já tratado em handleDigitChange).
  useEffect(() => {
    if (banner?.type !== 'success') return;
    const t = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(t);
  }, [banner]);

  const sendCode = async () => {
    setLoading(true);
    setBanner(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setBanner({ type: 'error', text: 'Não foi possível enviar o código. Tente novamente.' });
      return false;
    }
    return true;
  };

  const handleEmailContinue = async () => {
    if (!isEmailValid || loading) return;
    const ok = await sendCode();
    if (ok) {
      setCode(['', '', '', '', '', '']);
      setSecondsLeft(RESEND_SECONDS);
      setStep('code');
      setBanner({ type: 'success', text: 'Código enviado' });
      setTimeout(() => codeRefs.current[0]?.focus(), 150);
    }
  };

  const handleResend = async () => {
    setHelpVisible(false);
    const ok = await sendCode();
    if (ok) {
      setCode(['', '', '', '', '', '']);
      setSecondsLeft(RESEND_SECONDS);
      setBanner({ type: 'success', text: 'Código reenviado' });
      setTimeout(() => codeRefs.current[0]?.focus(), 150);
    }
  };

  const goToHome = () => router.replace('/');

  const verifyCode = async (token) => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    setLoading(false);
    if (error) {
      // Código errado, expirado ou muitas tentativas — todos tratados como falha de verificação
      setBanner({ type: 'error', text: 'Algo deu errado. Tente novamente.' });
      setCode(['', '', '', '', '', '']);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
      return;
    }

    const fullName = data?.user?.user_metadata?.full_name;

    if (fullName) {
      // Usuário já tinha nome salvo (não é o primeiro login) — grava o
      // "continuar como" e segue direto pro sucesso. refresh_token vem
      // direto da resposta do verifyOtp, sem precisar de outra chamada.
      await persistSavedUser({ name: fullName, email, refreshToken: data?.session?.refresh_token, userId: data?.user?.id });
      goToHome();
      return;
    }

    // Usuário novo (primeiro login) — precisa pedir o nome antes de continuar.
    setBanner(null);
    setStep('name');
  };

  const handleNameContinue = async () => {
    if (!isNameValid || nameSaving) return;
    setNameSaving(true);
    const trimmedName = name.trim();

    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });
    setNameSaving(false);

    if (error) {
      setBanner({ type: 'error', text: 'Não foi possível salvar seu nome. Tente novamente.' });
      return;
    }

    // updateUser não devolve sessão na resposta — busca o refresh_token
    // atual pra já deixar o "continuar como" funcionando na próxima vez.
    const { data: sessionData } = await supabase.auth.getSession();
    await persistSavedUser({ name: trimmedName, email, refreshToken: sessionData?.session?.refresh_token, userId: sessionData?.session?.user?.id });
    goToHome();
  };

  const handleDigitChange = (value, index) => {
    const digits = value.replace(/[^0-9]/g, '');

    // Colou o código inteiro (ex: veio do e-mail) — distribui nas 6 caixas
    // e já confirma automaticamente se completou os 6 dígitos.
    if (digits.length > 1) {
      const next = digits.slice(0, 6).split('');
      while (next.length < 6) next.push('');
      setCode(next);
      if (banner) setBanner(null);

      const lastFilledIndex = Math.min(digits.length, 6) - 1;
      codeRefs.current[lastFilledIndex]?.focus();

      const token = next.join('');
      if (token.length === 6) verifyCode(token);
      return;
    }

    const digit = digits.slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (banner) setBanner(null);

    if (digit && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const token = next.join('');
      if (token.length === 6) verifyCode(token);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    if (step === 'name') {
      // Não deixa voltar pro código depois de verificado — volta pro início.
      router.replace('/');
    } else if (step === 'code') {
      setStep('email');
      setBanner(null);
    } else {
      router.replace('/');
    }
  };

  // O botão "Continuar" é fixo embaixo (acompanha o teclado) e serve tanto
  // pro step de e-mail quanto pro de nome — só troca a validação/ação.
  const isFooterValid = step === 'email' ? isEmailValid : isNameValid;
  const footerLoading = step === 'email' ? loading : nameSaving;

  // Link só aparece quando o timer realmente expirou.
  // Se der erro antes disso, o texto do timer continua contando normalmente
  // (o banner de erro fica em cima, e o link só se junta a ele quando 0:00 chegar).
  const showResendLink = secondsLeft <= 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={handleBack}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <View
          style={[
            styles.scrollContent,
            { paddingBottom: 140, paddingTop: insets.top + 68 },
          ]}
        >
          {banner && (
            <View style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
              <Ionicons
                name={banner.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.bannerText}>{banner.text}</Text>
            </View>
          )}

          {step === 'email' && (
            <>
              <Text style={styles.title}>Qual o seu e-mail?</Text>

              <View
                style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}
              >
                <Text style={styles.inputLabel}>E-mail</Text>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {step === 'code' && (
            <>
              <Text style={styles.title}>
                Digite o código de 6 dígitos{'\n'}que enviamos para{'\n'}
                <Text style={styles.titleBold}>{email}</Text>
              </Text>

              <View style={styles.codeRow}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (codeRefs.current[index] = ref)}
                    style={[
                      styles.codeBox,
                      focusedBox === index && styles.codeBoxFocused,
                    ]}
                    value={digit}
                    onChangeText={(v) => handleDigitChange(v, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedBox(index)}
                    onBlur={() => setFocusedBox(null)}
                    keyboardType="number-pad"
                    maxLength={6}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {showResendLink ? (
                <TouchableOpacity onPress={() => setHelpVisible(true)}>
                  <Text style={styles.resendLink}>Não recebi meu código</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendText}>
                  Para reenviar o código, espere {formatTime(secondsLeft)}
                </Text>
              )}
            </>
          )}

          {step === 'name' && (
            <>
              <Text style={styles.title}>Como podemos te chamar?</Text>

              <View
                style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}
              >
                <Text style={styles.inputLabel}>Nome</Text>
                <TextInput
                  ref={nameRef}
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </>
          )}
        </View>

        {(step === 'email' || step === 'name') && (
          <Animated.View style={[styles.footerAvoider, footerAnimatedStyle]}>
            <View style={styles.footer}>
              <Text style={styles.helperText}>
                {step === 'email'
                  ? "Enviaremos comunicações sobre sua conta neste e-mail. Pra cancelar a inscrição acesse 'Configurações'."
                  : 'Usamos seu nome só pra te chamar direitinho dentro do app.'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  isFooterValid ? styles.continueButtonActive : styles.continueButtonDisabled,
                ]}
                onPress={step === 'email' ? handleEmailContinue : handleNameContinue}
                disabled={!isFooterValid || footerLoading}
              >
                {footerLoading ? (
                  <ActivityIndicator color={isFooterValid ? COLORS.text : '#AAAAAA'} />
                ) : (
                  <Text
                    style={[
                      styles.continueButtonText,
                      isFooterValid ? styles.continueButtonTextActive : styles.continueButtonTextDisabled,
                    ]}
                  >
                    Continuar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setHelpVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Não recebeu o código?</Text>
            <Text style={styles.modalSubtitle}>
              Verifique se digitou o e-mail corretamente. Talvez o código esteja na sua caixa de spam.
            </Text>
            <Text style={styles.modalEmail}>{email}</Text>

            <TouchableOpacity style={styles.modalResendBtn} onPress={handleResend}>
              <Text style={styles.modalResendBtnText}>Reenviar código</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalChangeEmailBtn}
              onPress={() => {
                setHelpVisible(false);
                setStep('email');
                setBanner(null);
              }}
            >
              <Text style={styles.modalChangeEmailText}>Alterar e-mail</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Banners de status ──────────────────────────────────────────────
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  bannerError: {
    backgroundColor: COLORS.error,
  },
  bannerSuccess: {
    backgroundColor: COLORS.success,
  },
  bannerText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  // ── Título ─────────────────────────────────────────────────────────
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 30,
    marginBottom: 36,
  },
  titleBold: {
    fontWeight: '800',
  },

  // ── Input de e-mail / nome (label flutuante estilo outline) ────────
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  inputWrapperFocused: {
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  inputLabel: {
    position: 'absolute',
    top: -9,
    left: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
  },
  clearBtn: {
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: 16,
  },

  // ── Footer fixo do botão continuar (acompanha o teclado) ───────────
  footerAvoider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 26,
  },

  // ── Botão continuar ────────────────────────────────────────────────
  continueButton: {
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: COLORS.primary,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.backgroundElevated,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  continueButtonTextActive: {
    color: COLORS.text,
  },
  continueButtonTextDisabled: {
    color: COLORS.textMuted,
  },

  // ── Caixas de código (6 dígitos) ───────────────────────────────────
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  codeBox: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  codeBoxFocused: {
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  resendText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },

  // ── Bottom sheet "Não recebeu o código?" ───────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 6,
  },
  modalEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
  },
  modalResendBtn: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalResendBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalChangeEmailBtn: {
    paddingVertical: 4,
  },
  modalChangeEmailText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
