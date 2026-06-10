import { View, Text, ScrollView, StyleSheet, Pressable, Image, Switch, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

function ProfileHeader({ user, onEditPress }) {
  return (
    <View style={s.headerContainer}>
      <View style={s.profileTop}>
        <View style={s.profileImageWrapper}>
          <Image
            source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix' }}
            style={s.profileImage}
          />
          <Pressable style={s.editImageBtn} onPress={onEditPress}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </Pressable>
        </View>
        <View style={s.userInfo}>
          <Text style={s.userName}>{user.name}</Text>
          <Text style={s.userEmail}>{user.email}</Text>
          <Text style={s.userPhone}>{user.phone}</Text>
        </View>
      </View>
      <Pressable style={s.editProfileBtn} onPress={onEditPress}>
        <Text style={s.editProfileBtnText}>Editar Perfil</Text>
      </Pressable>
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
  const [user, setUser] = useState({
    name: 'Cliente Batatop',
    email: 'cliente@batatop.com.br',
    phone: '(14) 99999-9999',
  });
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => router.replace('/') }
    ]);
  };

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader user={user} onEditPress={() => Alert.alert('Editar', 'Funcionalidade em breve!')} />

        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Text style={s.statValue}>12</Text>
            <Text style={s.statLabel}>Pedidos</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>R$ 450</Text>
            <Text style={s.statLabel}>Economia</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>4</Text>
            <Text style={s.statLabel}>Cupons</Text>
          </View>
        </View>

        <Section title="Minha Conta">
          <MenuItem icon="location-outline" label="Endereços" value="2 cadastrados" onPress={() => {}} />
          <MenuItem icon="card-outline" label="Pagamentos" value="Cartão **** 1234" onPress={() => {}} />
          <MenuItem icon="heart-outline" label="Favoritos" value="5 itens" isLast onPress={() => {}} />
        </Section>

        <Section title="Preferências">
          <View style={s.switchItem}>
            <View style={s.menuItemLeft}>
              <View style={[s.menuIconBg, { backgroundColor: COLORS.info + '15' }]}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.info} />
              </View>
              <Text style={s.menuItemLabel}>Notificações Push</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </Section>

        <Section title="Suporte">
          <MenuItem icon="help-circle-outline" label="Ajuda e Suporte" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Termos de Uso" isLast onPress={() => {}} />
        </Section>

        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={s.logoutBtnText}>Sair da Conta</Text>
        </Pressable>

        <Text style={s.versionText}>Versão 2.0.1 (Build 42)</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundElevated,
  },
  scroll: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING[6],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING[5],
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.borderLight,
  },
  editImageBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  editProfileBtn: {
    width: '100%',
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  editProfileBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: SPACING[5],
    gap: SPACING[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    gap: 2,
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
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
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuItemValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    ...SHADOWS.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: SPACING[5],
    marginTop: SPACING[2],
    paddingVertical: SPACING[4],
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
    marginVertical: SPACING[8],
  },
});
