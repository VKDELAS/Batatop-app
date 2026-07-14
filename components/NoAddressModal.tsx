/**
 * components/NoAddressModal.tsx
 *
 * Aparece quando a pessoa tenta adicionar um produto sem ter nenhum
 * endereço salvo. Único botão leva pra `app/addresses.js`, que já cuida
 * do fluxo completo (MapSelector → form de criar, via ?autoMap=1).
 *
 * Bottom sheet — mesma estrutura visual do AddressVerificationModal
 * (handle, título, subtítulo, botão), pra manter consistência entre os
 * dois modais de endereço.
 */

import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCadastrar: () => void;
};

export default function NoAddressModal({ visible, onClose, onCadastrar }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.iconWrap}>
            <Ionicons name="location-outline" size={28} color={COLORS.primary} />
          </View>

          <Text style={s.title}>Nenhum endereço cadastrado</Text>
          <Text style={s.subtitle}>
            Cadastre um endereço de entrega pra continuar com o seu pedido.
          </Text>

          <Pressable style={s.button} onPress={onCadastrar}>
            <Text style={s.buttonText}>Cadastrar endereço</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[8],
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: SPACING[5],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  title: { color: COLORS.text, fontWeight: '800', fontSize: TYPOGRAPHY.sizes.lg, marginBottom: SPACING[2], textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizes.sm, textAlign: 'center', lineHeight: 20, marginBottom: SPACING[6] },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  buttonText: { color: '#333', fontWeight: '800', fontSize: TYPOGRAPHY.sizes.sm },
});
