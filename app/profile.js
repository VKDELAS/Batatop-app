import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATIONS } from '../constants/theme';

function PressableScale({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.95,
      duration: ANIMATIONS.fast,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: ANIMATIONS.normal,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Item de Menu
 */
function MenuItem({ icon, label, value, onPress, rightIcon = true }) {
  return (
    <PressableScale style={s.menuItem} onPress={onPress}>
      <View style={s.menuItemLeft}>
        <View style={s.menuItemIconContainer}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        <View style={s.menuItemContent}>
          <Text style={s.menuItemLabel}>{label}</Text>
          {value && <Text style={s.menuItemValue}>{value}</Text>}
        </View>
      </View>
      {rightIcon && <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />}
    </PressableScale>
  );
}

/**
 * Seção
 */
function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionContent}>{children}</View>
    </View>
  );
}

/**
 * Modal de Editar Perfil
 */
function EditProfileModal({ visible, onClose, onSave }) {
  const [name, setName] = useState('João Silva');
  const [email, setEmail] = useState('joao@example.com');
  const [phone, setPhone] = useState('(11) 98765-4321');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      onSave({ name, email, phone });
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={s.modalContainer}>
        {/* Header */}
        <View style={s.modalHeader}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={s.modalTitle}>Editar Perfil</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={s.modalAvatarSection}>
            <Image
              source={{ uri: 'https://via.placeholder.com/120?text=User' }}
              style={s.modalAvatar}
            />
            <Pressable style={s.modalAvatarBtn}>
              <Ionicons name="camera" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          {/* Campos */}
          <View style={s.modalForm}>
            <View style={s.formGroup}>
              <Text style={s.formLabel}>Nome Completo</Text>
              <TextInput
                style={s.formInput}
                value={name}
                onChangeText={setName}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={s.formGroup}>
              <Text style={s.formLabel}>Email</Text>
              <TextInput
                style={s.formInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={s.formGroup}>
              <Text style={s.formLabel}>Telefone</Text>
              <TextInput
                style={s.formInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Botão Salvar */}
          <PressableScale
            style={s.modalSaveBtn}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Text style={s.modalSaveBtnText}>Salvar Alterações</Text>
            )}
          </PressableScale>
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * Tela de Perfil
 */
export default function Profile() {
  const router = useRouter();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 98765-4321',
  });

  const handleEditSave = (data) => {
    setProfileData(data);
  };

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ===== HEADER DO PERFIL ===== */}
        <View style={s.profileHeader}>
          <Image
            source={{ uri: 'https://via.placeholder.com/120?text=User' }}
            style={s.profileAvatar}
          />
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{profileData.name}</Text>
            <Text style={s.profileEmail}>{profileData.email}</Text>
            <View style={s.profileStats}>
              <View style={s.profileStat}>
                <Text style={s.profileStatValue}>12</Text>
                <Text style={s.profileStatLabel}>Pedidos</Text>
              </View>
              <View style={s.profileStatDivider} />
              <View style={s.profileStat}>
                <Text style={s.profileStatValue}>4.8</Text>
                <Text style={s.profileStatLabel}>Avaliação</Text>
              </View>
              <View style={s.profileStatDivider} />
              <View style={s.profileStat}>
                <Text style={s.profileStatValue}>R$ 340</Text>
                <Text style={s.profileStatLabel}>Gasto</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ===== BOTÃO DE EDITAR ===== */}
        <PressableScale
          style={s.editBtn}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="pencil" size={18} color={COLORS.text} />
          <Text style={s.editBtnText}>Editar Perfil</Text>
        </PressableScale>

        {/* ===== SEÇÃO: DADOS PESSOAIS ===== */}
        <Section title="Dados Pessoais">
          <MenuItem
            icon="person"
            label="Nome Completo"
            value={profileData.name}
            onPress={() => setEditModalVisible(true)}
          />
          <MenuItem
            icon="mail"
            label="Email"
            value={profileData.email}
            onPress={() => setEditModalVisible(true)}
          />
          <MenuItem
            icon="call"
            label="Telefone"
            value={profileData.phone}
            onPress={() => setEditModalVisible(true)}
          />
        </Section>

        {/* ===== SEÇÃO: ENDEREÇOS ===== */}
        <Section title="Endereços">
          <MenuItem
            icon="location"
            label="Endereço Principal"
            value="Rua das Flores, 123 - São Paulo"
            onPress={() => {}}
          />
          <MenuItem
            icon="add-circle"
            label="Adicionar Novo Endereço"
            onPress={() => {}}
            rightIcon={false}
          />
        </Section>

        {/* ===== SEÇÃO: PAGAMENTO ===== */}
        <Section title="Formas de Pagamento">
          <MenuItem
            icon="card"
            label="Cartão de Crédito"
            value="Visa **** 4242"
            onPress={() => {}}
          />
          <MenuItem
            icon="wallet"
            label="Adicionar Cartão"
            onPress={() => {}}
            rightIcon={false}
          />
        </Section>

        {/* ===== SEÇÃO: FAVORITOS ===== */}
        <Section title="Meus Favoritos">
          <MenuItem
            icon="heart"
            label="Produtos Favoritos"
            value="3 itens"
            onPress={() => {}}
          />
        </Section>

        {/* ===== SEÇÃO: NOTIFICAÇÕES ===== */}
        <Section title="Preferências">
          <MenuItem
            icon="notifications"
            label="Notificações Push"
            value="Ativadas"
            onPress={() => {}}
          />
          <MenuItem
            icon="mail-unread"
            label="Email Marketing"
            value="Desativado"
            onPress={() => {}}
          />
        </Section>

        {/* ===== SEÇÃO: SUPORTE ===== */}
        <Section title="Suporte">
          <MenuItem
            icon="help-circle"
            label="Central de Ajuda"
            onPress={() => {}}
            rightIcon={false}
          />
          <MenuItem
            icon="chatbubbles"
            label="Fale Conosco"
            onPress={() => {}}
            rightIcon={false}
          />
          <MenuItem
            icon="document-text"
            label="Termos e Condições"
            onPress={() => {}}
            rightIcon={false}
          />
        </Section>

        {/* ===== BOTÃO LOGOUT ===== */}
        <PressableScale
          style={s.logoutBtn}
          onPress={() => {
            // Logout logic
            router.push('/');
          }}
        >
          <Ionicons name="log-out" size={18} color={COLORS.text} />
          <Text style={s.logoutBtnText}>Sair da Conta</Text>
        </PressableScale>

        <View style={{ height: SPACING[8] }} />
      </ScrollView>

      {/* Modal de Editar */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleEditSave}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },

  // ===== HEADER DO PERFIL =====
  profileHeader: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[6],
    paddingBottom: SPACING[4],
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    gap: SPACING[4],
    alignItems: 'flex-start',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.borderAccent,
  },
  profileInfo: {
    flex: 1,
    gap: SPACING[2],
  },
  profileName: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.xl,
  },
  profileEmail: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[2],
    gap: SPACING[3],
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  profileStatLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: SPACING[1],
  },
  profileStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },

  // ===== BOTÃO EDITAR =====
  editBtn: {
    marginHorizontal: SPACING[6],
    marginTop: SPACING[4],
    marginBottom: SPACING[6],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    ...SHADOWS.glow,
  },
  editBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
  },

  // ===== SEÇÕES =====
  section: {
    paddingHorizontal: SPACING[6],
    marginBottom: SPACING[6],
  },
  sectionTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
    marginBottom: SPACING[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },

  // ===== MENU ITEMS =====
  menuItem: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  menuItemValue: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING[1],
  },

  // ===== BOTÃO LOGOUT =====
  logoutBtn: {
    marginHorizontal: SPACING[6],
    marginBottom: SPACING[6],
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
  },

  // ===== MODAL =====
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[4],
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.xl,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[6],
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: SPACING[8],
  },
  modalAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.borderAccent,
  },
  modalAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: -SPACING[2],
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  modalForm: {
    gap: SPACING[4],
    marginBottom: SPACING[6],
  },
  formGroup: {
    gap: SPACING[2],
  },
  formLabel: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  formInput: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    color: COLORS.text,
    fontSize: TYPOGRAPHY.sizes.base,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[6],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[6],
    ...SHADOWS.glow,
  },
  modalSaveBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
  },
});
