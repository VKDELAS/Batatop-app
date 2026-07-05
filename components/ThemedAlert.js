/**
 * ThemedAlert.js
 *
 * Substituto do Alert.alert() nativo, com o visual do app (tema em
 * constants/theme.js) em vez do alerta cinza do sistema.
 *
 * Uso (mesma assinatura do Alert.alert):
 *   showThemedAlert('Título', 'Mensagem');
 *   showThemedAlert('Remover endereço', 'Tem certeza?', [
 *     { text: 'Cancelar', style: 'cancel' },
 *     { text: 'Remover', style: 'destructive', onPress: () => {...} },
 *   ]);
 *
 * `<ThemedAlertHost />` precisa estar montado na árvore (uma vez por tela/
 * fluxo que chama showThemedAlert) — é só ele quem realmente renderiza o
 * modal. Padrão singleton: showThemedAlert funciona de qualquer lugar
 * (inclusive fora de componente React), igual o Alert.alert original.
 */
import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';

let _setConfig = null;

export function showThemedAlert(title, message, buttons = [{ text: 'OK' }]) {
  if (!_setConfig) {
    // Host ainda não montou nessa árvore — evita quebrar silenciosamente.
    console.warn('ThemedAlertHost não está montado. Envolva a tela com <ThemedAlertHost />.');
    return;
  }
  _setConfig({ title, message, buttons });
}

export function ThemedAlertHost() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    _setConfig = setConfig;
    return () => { if (_setConfig === setConfig) _setConfig = null; };
  }, []);

  if (!config) return null;

  const buttons = config.buttons?.length ? config.buttons : [{ text: 'OK' }];

  const handlePress = (btn) => {
    setConfig(null);
    btn.onPress?.();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setConfig(null)}>
      <View style={a.overlay}>
        <View style={a.card}>
          <Text style={a.title}>{config.title}</Text>
          {!!config.message && <Text style={a.message}>{config.message}</Text>}

          <View style={[a.actions, buttons.length > 2 && a.actionsColumn]}>
            {buttons.map((btn, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  a.btn,
                  btn.style === 'cancel' && a.btnCancel,
                  btn.style === 'destructive' && a.btnDestructive,
                  btn.style !== 'cancel' && btn.style !== 'destructive' && a.btnDefault,
                  pressed && a.btnPressed,
                ]}
                onPress={() => handlePress(btn)}
              >
                <Text style={[
                  a.btnText,
                  btn.style === 'cancel' && a.btnTextCancel,
                  btn.style === 'destructive' && a.btnTextDestructive,
                  btn.style !== 'cancel' && btn.style !== 'destructive' && a.btnTextDefault,
                ]}>
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const a = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[6],
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.backgroundCard ?? COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING[5],
  },
  title: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
    marginBottom: SPACING[2],
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
    marginBottom: SPACING[5],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING[3],
  },
  actionsColumn: {
    flexDirection: 'column-reverse',
  },
  btn: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnDefault: {
    backgroundColor: COLORS.primary,
  },
  btnCancel: {
    backgroundColor: COLORS.backgroundElevated,
  },
  btnDestructive: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  btnTextDefault: {
    color: '#fff',
  },
  btnTextCancel: {
    color: COLORS.textSecondary,
  },
  btnTextDestructive: {
    color: '#fff',
  },
});
