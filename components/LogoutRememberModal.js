import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

// Modal exibido ao clicar em "Sair", perguntando se a conta deve continuar
// disponível pro "Continuar como Fulano" do AuthBottomSheet.tsx.
//
// - onRemember: NÃO derruba a sessão real do Supabase, só sai da tela de
//   perfil. É isso que permite o "Continuar como Enzzo" entrar automático,
//   sem pedir senha, da próxima vez.
// - onForget: logout de verdade (supabase.auth.signOut()) + limpa o cache
//   local, então da próxima vez o bottom sheet cai direto no Estado A.
export default function LogoutRememberModal({ visible, onRemember, onForget, onRequestClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onRequestClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Quer que sua conta seja lembrada no próximo acesso?</Text>
          <Text style={styles.description}>
            Quando você entrar novamente por este aparelho, a conta (junto com informações
            sobre pedidos e pagamentos) será lembrada.
          </Text>

          <Pressable style={styles.btnPrimary} onPress={onRemember}>
            <Text style={styles.btnPrimaryText}>Sim, lembrar minha conta</Text>
          </Pressable>

          <Pressable style={styles.btnLink} onPress={onForget}>
            <Text style={styles.btnLinkText}>Não, esquecer minha conta</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
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
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING[3],
    paddingHorizontal: SPACING[2],
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[6],
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 55,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  btnPrimaryText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  btnLink: {
    paddingVertical: SPACING[2],
  },
  btnLinkText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
