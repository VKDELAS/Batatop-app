import { View, Text, ScrollView, StyleSheet, Pressable, Image, Switch, Alert, TextInput, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Helper component for premium bouncy scale feedback on touch
function PressableScale({ children, onPress, style, activeOpacity = 0.95 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: activeOpacity,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
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

// Profile Header Component
function ProfileHeader({ user, onEditPress }) {
  return (
    <View style={s.headerContainer}>
      <View style={s.profileImageContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/120?text=User' }}
          style={s.profileImage}
        />
        <Pressable style={s.editImageBtn} onPress={onEditPress}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
      <View style={s.userInfo}>
        <Text style={s.userName}>{user.name}</Text>
        <Text style={s.userEmail}>{user.email}</Text>
        <Text style={s.userPhone}>{user.phone}</Text>
      </View>
      <Pressable style={s.editHeaderBtn} onPress={onEditPress}>
        <Ionicons name="pencil" size={18} color="#C8321A" />
      </Pressable>
    </View>
  );
}

// Menu Item Component
function MenuItem({ icon, label, value, onPress, rightIcon = true }) {
  return (
    <PressableScale style={s.menuItem} onPress={onPress}>
      <View style={s.menuItemLeft}>
        <Ionicons name={icon} size={22} color="#C8321A" />
        <View style={s.menuItemText}>
          <Text style={s.menuItemLabel}>{label}</Text>
          {value && <Text style={s.menuItemValue}>{value}</Text>}
        </View>
      </View>
      {rightIcon && <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />}
    </PressableScale>
  );
}

// Section Component
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

// Edit Profile Modal
function EditProfileModal({ visible, onClose, user, onSave }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);

  const handleSave = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    onSave({ name, email, phone });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={s.modalContainer}>
        <View style={s.modalHeader}>
          <Pressable onPress={onClose}>
            <Text style={s.modalCloseBtn}>Cancelar</Text>
          </Pressable>
          <Text style={s.modalTitle}>Editar Perfil</Text>
          <Pressable onPress={handleSave}>
            <Text style={s.modalSaveBtn}>Salvar</Text>
          </Pressable>
        </View>

        <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
          <View style={s.formGroup}>
            <Text style={s.formLabel}>Nome Completo</Text>
            <TextInput
              style={s.formInput}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor="#A3A3A3"
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Email</Text>
            <TextInput
              style={s.formInput}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#A3A3A3"
              keyboardType="email-address"
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Telefone</Text>
            <TextInput
              style={s.formInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#A3A3A3"
              keyboardType="phone-pad"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 98765-4321',
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);

  const handleEditProfile = (updatedUser) => {
    setUser(updatedUser);
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Sair',
          onPress: () => {
            router.push('/');
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <View style={s.topHeader}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#C8321A" />
        </Pressable>
        <Text style={s.topTitle}>Meu Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader user={user} onEditPress={() => setEditModalVisible(true)} />

        <View style={s.statsContainer}>
          <View style={s.statItem}>
            <Text style={s.statValue}>12</Text>
            <Text style={s.statLabel}>Pedidos</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>R$ 245</Text>
            <Text style={s.statLabel}>Gasto</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>⭐ 4.8</Text>
            <Text style={s.statLabel}>Avaliação</Text>
          </View>
        </View>

        <Section title="Meus Endereços">
          <MenuItem
            icon="location"
            label="Casa"
            value="Rua das Flores, 123"
            onPress={() => Alert.alert('Endereço', 'Rua das Flores, 123 - Iacanga, SP')}
          />
          <MenuItem
            icon="location"
            label="Trabalho"
            value="Av. Principal, 456"
            onPress={() => Alert.alert('Endereço', 'Av. Principal, 456 - Iacanga, SP')}
          />
          <MenuItem
            icon="add-circle"
            label="Adicionar novo endereço"
            onPress={() => Alert.alert('Novo Endereço', 'Funcionalidade em desenvolvimento')}
            rightIcon={false}
          />
        </Section>

        <Section title="Formas de Pagamento">
          <MenuItem
            icon="card"
            label="Cartão de Crédito"
            value="**** 1234"
            onPress={() => Alert.alert('Cartão', 'Visa terminado em 1234')}
          />
          <MenuItem
            icon="card"
            label="Cartão de Débito"
            value="**** 5678"
            onPress={() => Alert.alert('Cartão', 'Mastercard terminado em 5678')}
          />
          <MenuItem
            icon="add-circle"
            label="Adicionar forma de pagamento"
            onPress={() => Alert.alert('Novo Cartão', 'Funcionalidade em desenvolvimento')}
            rightIcon={false}
          />
        </Section>

        <Section title="Favoritos">
          <MenuItem
            icon="heart"
            label="Batata Gourmet Premium"
            value="5 itens"
            onPress={() => Alert.alert('Favoritos', 'Vendo seus itens favoritos')}
          />
        </Section>

        <Section title="Notificações">
          <View style={s.notificationItem}>
            <View style={s.notificationLeft}>
              <Ionicons name="notifications" size={22} color="#C8321A" />
              <Text style={s.notificationLabel}>Notificações de Pedidos</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ECE6DC', true: '#C8321A' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#A3A3A3'}
            />
          </View>
          <View style={s.notificationItem}>
            <View style={s.notificationLeft}>
              <Ionicons name="gift" size={22} color="#C8321A" />
              <Text style={s.notificationLabel}>Promoções e Ofertas</Text>
            </View>
            <Switch
              value={promotionsEnabled}
              onValueChange={setPromotionsEnabled}
              trackColor={{ false: '#ECE6DC', true: '#C8321A' }}
              thumbColor={promotionsEnabled ? '#FFFFFF' : '#A3A3A3'}
            />
          </View>
        </Section>

        <Section title="Suporte">
          <MenuItem
            icon="help-circle"
            label="Central de Ajuda"
            onPress={() => Alert.alert('Ajuda', 'Abrindo central de ajuda')}
          />
          <MenuItem
            icon="chatbubble"
            label="Fale Conosco"
            onPress={() => Alert.alert('Contato', 'Abrindo chat de suporte')}
          />
          <MenuItem
            icon="document-text"
            label="Termos e Condições"
            onPress={() => Alert.alert('Termos', 'Abrindo termos e condições')}
          />
          <MenuItem
            icon="shield"
            label="Política de Privacidade"
            onPress={() => Alert.alert('Privacidade', 'Abrindo política de privacidade')}
          />
        </Section>

        <View style={s.logoutSection}>
          <Pressable style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#C8321A" />
            <Text style={s.logoutBtnText}>Sair da Conta</Text>
          </Pressable>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        user={user}
        onSave={handleEditProfile}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  topTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  scroll: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#ECE6DC',
  },
  editImageBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C8321A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  userPhone: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  editHeaderBtn: {
    position: 'absolute',
    top: 24,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C8321A',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ECE6DC',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  menuItemValue: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  notificationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  logoutSection: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C8321A',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C8321A',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#A3A3A3',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  modalCloseBtn: {
    fontSize: 14,
    color: '#A3A3A3',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalSaveBtn: {
    fontSize: 14,
    color: '#C8321A',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ECE6DC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
});
