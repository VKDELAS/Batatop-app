import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseConfig';

function FieldRow({ icon, iconColor, iconBg, label, children }) {
  return (
    <View style={s.fieldGroup}>
      <View style={s.labelRow}>
        <View style={[s.labelIconBg, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
        <Text style={s.label}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ProfileSecurity() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem. Verifique e tente de novo.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível alterar sua senha. Tente novamente.');
        console.error('Erro ao alterar senha:', error);
        return;
      }

      Alert.alert('Sucesso', 'Sua senha foi alterada!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      Alert.alert('Erro', 'Não foi possível alterar sua senha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>
        <View>
          <Text style={s.headerTitle}>Segurança</Text>
          <Text style={s.headerSub}>Senha e privacidade da sua conta</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.cardHeaderIconBg}>
              <Ionicons name="shield-checkmark" size={18} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardHeaderTitle}>Alterar senha</Text>
              <Text style={s.cardHeaderSub}>Use pelo menos 6 caracteres</Text>
            </View>
          </View>

          <FieldRow icon="lock-closed" iconColor="#64748B" iconBg="#E2E8F0" label="Nova senha">
            <View style={s.passwordRow}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Digite a nova senha"
                placeholderTextColor="#AAA"
                secureTextEntry={!showPassword}
                style={s.passwordInput}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
              </Pressable>
            </View>
          </FieldRow>

          <FieldRow icon="checkmark-circle" iconColor="#64748B" iconBg="#E2E8F0" label="Confirmar nova senha">
            <View style={s.passwordRow}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repita a nova senha"
                placeholderTextColor="#AAA"
                secureTextEntry={!showPassword}
                style={s.passwordInput}
              />
            </View>
          </FieldRow>

          <Pressable
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={s.saveBtnInner}>
                <Ionicons name="key-outline" size={16} color="#FFFFFF" />
                <Text style={s.saveBtnText}>Alterar Senha</Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSub: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  cardHeaderIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  cardHeaderSub: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  labelIconBg: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    paddingRight: 6,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  eyeBtn: {
    padding: 8,
  },
  saveBtn: {
    backgroundColor: '#FFB800',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
