import { Stack } from 'expo-router';
import { View, Text, StatusBar, StyleSheet, Image, Pressable, Modal, ScrollView, TextInput, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

function AddressModal({ visible, onClose, onSelectAddress }) {
  const [addresses, setAddresses] = useState([
    { id: 1, label: 'Casa', address: 'Rua das Flores, 123 - Iacanga, SP', main: true },
    { id: 2, label: 'Trabalho', address: 'Av. Principal, 456 - Iacanga, SP', main: false },
  ]);
  const [newAddress, setNewAddress] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      const newItem = {
        id: addresses.length + 1,
        label: `Endereço ${addresses.length + 1}`,
        address: newAddress,
        main: false,
      };
      setAddresses([...addresses, newItem]);
      setNewAddress('');
      setShowForm(false);
    }
  };

  const handleSelectAddress = (address) => {
    onSelectAddress(address);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={s.modalContainer}>
        <View style={s.modalHeader}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color="#1A1A1A" />
          </Pressable>
          <Text style={s.modalTitle}>Endereço de Entrega</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
          {addresses.map((addr) => (
            <Pressable
              key={addr.id}
              style={s.addressItem}
              onPress={() => handleSelectAddress(addr)}
            >
              <View style={s.addressItemLeft}>
                <Ionicons name="location" size={24} color="#C8321A" />
                <View style={s.addressItemText}>
                  <Text style={s.addressItemLabel}>{addr.label}</Text>
                  <Text style={s.addressItemAddress}>{addr.address}</Text>
                </View>
              </View>
              {addr.main && <View style={s.mainBadge}><Text style={s.mainBadgeText}>Principal</Text></View>}
            </Pressable>
          ))}

          {!showForm ? (
            <Pressable style={s.addAddressBtn} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={24} color="#C8321A" />
              <Text style={s.addAddressBtnText}>Adicionar novo endereço</Text>
            </Pressable>
          ) : (
            <View style={s.addressForm}>
              <TextInput
                style={s.addressInput}
                placeholder="Rua, número, complemento..."
                placeholderTextColor="#A3A3A3"
                value={newAddress}
                onChangeText={setNewAddress}
              />
              <View style={s.formButtons}>
                <Pressable style={s.formBtnCancel} onPress={() => setShowForm(false)}>
                  <Text style={s.formBtnCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={s.formBtnSave} onPress={handleAddAddress}>
                  <Text style={s.formBtnSaveText}>Salvar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Header() {
  const [selectedAddress, setSelectedAddress] = useState({
    label: 'Casa',
    address: 'Rua das Flores, 123',
  });
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <SafeAreaView style={s.headerSafe} edges={['top']}>
        <View style={s.headerRow}>
          <View style={s.logoRow}>
            <View style={s.logoBg}>
              <Text style={s.logoText}>🍟</Text>
            </View>
            <View>
              <Text style={s.logoTitle}>batata top</Text>
              <Text style={s.logoSubtitle}>Iacanga - SP</Text>
            </View>
          </View>
          <Pressable style={s.cartBtn}>
            <Ionicons name="cart" size={24} color="#FFFFFF" />
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>0</Text>
            </View>
          </Pressable>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            style={s.addressSelector}
            onPress={() => setAddressModalVisible(true)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={s.addressSelectorLeft}>
              <Ionicons name="location" size={20} color="#C8321A" />
              <View style={s.addressSelectorText}>
                <Text style={s.addressSelectorLabel}>Entregando em</Text>
                <Text style={s.addressSelectorValue} numberOfLines={1}>
                  {selectedAddress.address}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color="#C8321A" />
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelectAddress={setSelectedAddress}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#111111" barStyle="light-content" />
      <Header />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9F5F0' },
          animationEnabled: true,
        }}
      />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  headerSafe: {
    backgroundColor: '#111111',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#C8321A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
  },
  logoTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    color: '#A3A3A3',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  cartBtn: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F5A623',
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  addressSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  addressSelectorText: {
    flex: 1,
  },
  addressSelectorLabel: {
    color: '#6B6B6B',
    fontSize: 11,
    fontWeight: '600',
  },
  addressSelectorValue: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
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
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addressItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  addressItemText: {
    flex: 1,
  },
  addressItemLabel: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  addressItemAddress: {
    color: '#6B6B6B',
    fontSize: 12,
    marginTop: 3,
  },
  mainBadge: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mainBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#C8321A',
    borderRadius: 14,
    backgroundColor: '#FFF5F0',
  },
  addAddressBtnText: {
    color: '#C8321A',
    fontWeight: '700',
    fontSize: 14,
  },
  addressForm: {
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE6DC',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ECE6DC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 12,
    backgroundColor: '#F9F5F0',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  formBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    alignItems: 'center',
  },
  formBtnCancelText: {
    color: '#6B6B6B',
    fontWeight: '700',
    fontSize: 14,
  },
  formBtnSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#C8321A',
    alignItems: 'center',
  },
  formBtnSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
