import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setErro('Preencha o e-mail e a senha para continuar.');
      return;
    }
    setErro(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErro('E-mail ou senha incorretos. Verifique e tente novamente.');
      setLoading(false);
    } else {
      router.replace('/');
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Login com Google', 'Funcionalidade sendo configurada no Supabase.');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Image
              source={{ uri: 'https://eucwoxjmjfqylyrqunwk.supabase.co/storage/v1/object/public/logo/logo.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>O sabor que você já conhece, agora no seu celular.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="exemplo@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Card de erro inline */}
            {erro && (
              <View style={styles.errCard}>
                <Ionicons name="alert-circle" size={20} color="#B45309" style={{ marginTop: 1 }} />
                <Text style={styles.errText}>{erro}</Text>
                <TouchableOpacity onPress={() => setErro(null)} style={styles.errClose}>
                  <Ionicons name="close" size={16} color="#B45309" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#333" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
              <Ionicons name="logo-google" size={20} color="#333" style={{ marginRight: 10 }} />
              <Text style={styles.googleButtonText}>Entrar com Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.registerButtonText}>Criar nova conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 30,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  header: {
  alignItems: 'center',
  marginBottom: 16,
  },
  logo: {
    width: 260,
    height: 310,
    marginBottom: -70,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#EA1D2C',
    fontSize: 14,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: '#FFB500',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  loginButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 12,
    fontWeight: '700',
  },
  googleButton: {
    flexDirection: 'row',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 15,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '700',
  },
  registerButton: {
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB500',
  },
  registerButtonText: {
    color: '#FFB500',
    fontSize: 16,
    fontWeight: '800',
  },

  // ── Erro inline ───────────────────────────────────────────────────────────
  errCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  errText: {
    flex: 1,
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  errClose: {
    padding: 2,
    marginTop: 1,
  },
});
