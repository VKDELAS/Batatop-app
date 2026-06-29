import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseConfig';

function formatPhone(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatBirthDate(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

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

export default function ProfileData() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user;
      if (u) {
        setName(u.user_metadata?.full_name || '');
        setPhone(u.user_metadata?.phone || u.phone || '');
        setEmail(u.email || '');
        setBirthDate(u.user_metadata?.birth_date || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Por favor, informe seu nome.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name.trim(),
          phone: phone,
          birth_date: birthDate,
        },
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível salvar seus dados. Tente novamente.');
        console.error('Erro ao salvar dados:', error);
        return;
      }

      Alert.alert('Sucesso', 'Seus dados foram atualizados!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar seus dados.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB800" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>
        <View>
          <Text style={s.headerTitle}>Meus Dados</Text>
          <Text style={s.headerSub}>Gerencie suas informações pessoais</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <FieldRow icon="person" iconColor="#D97706" iconBg="#FFF3D6" label="Nome Completo">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor="#AAA"
              style={s.input}
            />
          </FieldRow>

          <FieldRow icon="mail" iconColor="#D97706" iconBg="#FFF3D6" label="Email">
            <View style={[s.input, s.inputDisabled]}>
              <Text style={s.disabledText}>{email}</Text>
            </View>
            <Text style={s.helperText}>O email não pode ser alterado</Text>
          </FieldRow>

          <FieldRow icon="call" iconColor="#D97706" iconBg="#FFF3D6" label="Telefone">
            <TextInput
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              placeholder="(00) 00000-0000"
              placeholderTextColor="#AAA"
              keyboardType="phone-pad"
              style={s.input}
            />
          </FieldRow>

          <FieldRow icon="calendar" iconColor="#D97706" iconBg="#FFF3D6" label="Data de Nascimento">
            <TextInput
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatBirthDate(text))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#AAA"
              keyboardType="numeric"
              style={s.input}
            />
          </FieldRow>

          <Pressable
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={s.saveBtnInner}>
                <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                <Text style={s.saveBtnText}>Salvar Alterações</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    borderColor: '#EEEEEE',
  },
  disabledText: {
    fontSize: 15,
    color: '#AAAAAA',
  },
  helperText: {
    fontSize: 11,
    color: '#E61E2A',
    marginTop: 6,
    fontWeight: '500',
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
