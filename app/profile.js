import { View, Text, ScrollView, StyleSheet, Pressable, Image, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseConfig';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

function ProfileHeader({ user }) {
  return (
    <View style={s.headerContainer}>
      <View style={s.profileTop}>
        <View style={s.profileImageWrapper}>
          <Image
            source={{ uri: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.email || 'Guest'}` }}
            style={s.profileImage}
          />
        </View>
        <View style={s.userInfo}>
          <Text style={s.userName}>{user?.user_metadata?.full_name || 'Usuário Batatop'}</Text>
          <Text style={s.userEmail}>{user?.email || 'Conectado via Supabase'}</Text>
        </View>
      </View>

    </View>
  );
}

function MenuItem({ icon, label, value, onPress, isLast = false, color = COLORS.primary }) {
  return (
    <Pressable 
      style={[s.menuItem, isLast && { borderBottomWidth: 0 }]} 
      onPress={onPress}
    >
      <View style={s.menuItemLeft}>
        <View style={[s.menuIconBg, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={s.menuItemTextContainer}>
          <Text style={s.menuItemLabel}>{label}</Text>
          {value && <Text style={s.menuItemValue}>{value}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user || null;
      setUser(u);

      if (u) {
        const { data } = await supabase
          .from('addresses')
          .select('street, number, city, state')
          .eq('user_id', u.id)
          .eq('is_default', true)
          .single();
        if (data) {
          setDefaultAddress(`${data.street}, ${data.number} · ${data.city}/${data.state}`);
        } else {
          // nenhum padrão, pega o mais recente
          const { data: any } = await supabase
            .from('addresses')
            .select('street, number, city, state')
            .eq('user_id', u.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (any) setDefaultAddress(`${any.street}, ${any.number} · ${any.city}/${any.state}`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Sair', 
        style: 'destructive', 
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        } 
      }
    ]);
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={s.notLoggedIn}>
        <Ionicons name="person-circle-outline" size={80} color={COLORS.border} />
        <Text style={s.notLoggedInTitle}>Você não está logado</Text>
        <Text style={s.notLoggedInText}>Faça login para salvar seus endereços e ver seus pedidos.</Text>
        <Pressable style={s.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={s.loginBtnText}>Fazer Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 120 }}>
        <ProfileHeader user={user} />

        <Section title="Minha Conta">
          <MenuItem icon="location-outline" label="Meus Endereços" value={defaultAddress || 'Gerenciar endereços de entrega'} onPress={() => router.push('/addresses')} />
          <MenuItem icon="receipt-outline" label="Meus Pedidos" value="Histórico de compras" onPress={() => router.push('/pedidos')} />
          <MenuItem icon="card-outline" label="Formas de Pagamento" isLast onPress={() => {}} />
        </Section>

        <Section title="Suporte">
          <MenuItem icon="help-circle-outline" label="Ajuda e Suporte" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Termos de Uso" isLast onPress={() => {}} />
        </Section>

        {/* Botão sair — no fundo da tela */}
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={s.logoutBtnText}>Sair da Conta</Text>
        </Pressable>

        <Text style={s.versionText}>Batata Top v2.1.0</Text>
      </ScrollView>
    </View>
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
  },
  scroll: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING[6],
    marginHorizontal: SPACING[5],
    marginBottom: SPACING[6],
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    gap: SPACING[4],
    ...SHADOWS.sm,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[5],
    width: '100%',
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.borderLight,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    marginHorizontal: SPACING[5],
    marginBottom: SPACING[4],
    paddingVertical: SPACING[4],
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.error + '50',
    backgroundColor: COLORS.error + '08',
  },
  logoutBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  section: {
    paddingHorizontal: SPACING[5],
    marginBottom: SPACING[6],
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[3],
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[4],
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextContainer: {
    gap: 2,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuItemValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
    marginVertical: SPACING[8],
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  notLoggedInTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  notLoggedInText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    marginBottom: 30,
  },
  loginBtn: {
    backgroundColor: '#FFB500',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  loginBtnText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
});