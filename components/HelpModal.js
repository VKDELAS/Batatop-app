import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

// Habilita animação de layout suave no accordion (Android)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Perguntas frequentes — conteúdo aprovado
const FAQ_ITEMS = [
  {
    id: 'onde-esta',
    question: 'Onde está meu pedido?',
    answer:
      'Abra Pedidos no app e toque no pedido em andamento. Lá você vê o status atual (aguardando pagamento, em preparo, pronto ou entregue) e os detalhes do que pediu.',
  },
  {
    id: 'acompanhar-status',
    question: 'Como acompanho o status do pedido?',
    answer:
      'O status é atualizado automaticamente na tela Pedidos. Você também recebe atualizações conforme o pedido avança — de "em preparo" até "pronto" ou "entregue".',
  },
  {
    id: 'tempo-entrega',
    question: 'Quanto tempo demora a entrega?',
    answer:
      'O tempo varia conforme a demanda e a distância. Em geral, pedidos em Iacanga-SP levam cerca de 30 a 60 minutos após a confirmação. Em horários de pico, pode demorar um pouco mais.',
  },
  {
    id: 'entrega-cidade',
    question: 'Vocês entregam na minha cidade?',
    answer:
      'Sim, mas somente em Iacanga-SP. Ao cadastrar o endereço, o app valida se você está na área de entrega. Se estiver fora, será necessário escolher retirada no local.',
  },
  {
    id: 'formas-pagamento',
    question: 'Quais formas de pagamento aceitas?',
    answer:
      'Aceitamos Dinheiro, PIX, Cartão de Crédito e Cartão de Débito. No checkout, escolha a forma preferida. Pagamentos com cartão e PIX são processados com segurança via Mercado Pago.',
  },
  {
    id: 'pagamento-pix',
    question: 'Como funciona o pagamento por PIX?',
    answer:
      'Ao finalizar o pedido com PIX, você recebe o QR Code ou código para pagar. O pedido só entra em preparo após a confirmação do pagamento. Se não pagar em alguns minutos, o pedido pode ser cancelado automaticamente.',
  },
  {
    id: 'cancelar-pedido',
    question: 'Posso cancelar meu pedido?',
    answer:
      'Se o pedido ainda estiver aguardando pagamento ou pendente, entre em contato conosco o mais rápido possível pelo app ou WhatsApp. Após o início do preparo, o cancelamento depende da análise da loja.',
  },
  {
    id: 'retirada-local',
    question: 'Posso pedir para retirar no local?',
    answer:
      'Sim. No checkout, selecione Retirada em vez de entrega. Quando o pedido estiver Pronto, você pode buscar na loja no endereço informado no app.',
  },
  {
    id: 'pedido-errado',
    question: 'O que fazer se meu pedido vier errado ou incompleto?',
    answer:
      'Entre em contato conosco em até 30 minutos após receber o pedido, informando o número do pedido e o que aconteceu. Vamos analisar e, se for o caso, refazer o item ou aplicar o reembolso/crédito.',
  },
  {
    id: 'cupom-desconto',
    question: 'Como uso um cupom de desconto?',
    answer:
      'Na tela de Checkout, digite o código do cupom no campo indicado antes de finalizar. O desconto é aplicado automaticamente se o cupom for válido e estiver dentro da validade.',
  },
];

/**
 * Modal (bottom sheet compacto) de Central de Ajuda.
 *
 * Mesmo padrão visual do PaymentMethodModal: overlay + sheet com pill,
 * cantos arredondados e altura limitada ao conteúdo (não cobre a tela toda).
 *
 * Lista de FAQ em accordion — cada item expande a resposta ao tocar.
 * No final, um botão "Falar com o suporte" leva pro WhatsApp (via
 * onContactSupport, que reaproveita a lógica já existente na tela).
 */
export default function HelpModal({ visible, onClose, onContactSupport }) {
  const [expandedId, setExpandedId] = useState(null);

  function toggleItem(id) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleClose() {
    setExpandedId(null);
    onClose?.();
  }

  function handleSupportPress() {
    handleClose();
    onContactSupport?.();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.modalOverlay}>
        <Pressable style={s.modalBackdrop} onPress={handleClose} />
        <View style={s.modalContent}>
          <View style={s.modalPill} />

          <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
            <View style={s.headerRow}>
              <Ionicons name="help-circle" size={22} color={COLORS.primary} />
              <Text style={s.modalTitle}>Central de Ajuda</Text>
            </View>
            <Text style={s.modalSub}>
              Veja as dúvidas mais comuns antes de falar com o suporte.
            </Text>

            {FAQ_ITEMS.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[s.faqItem, expanded && s.faqItemActive]}
                  onPress={() => toggleItem(item.id)}
                >
                  <View style={s.faqQuestionRow}>
                    <Text style={[s.faqQuestion, expanded && s.faqQuestionActive]}>
                      {item.question}
                    </Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={expanded ? COLORS.primary : COLORS.textMuted}
                    />
                  </View>
                  {expanded && <Text style={s.faqAnswer}>{item.answer}</Text>}
                </Pressable>
              );
            })}

            <View style={s.supportBox}>
              <Text style={s.supportText}>Não encontrou o que precisava?</Text>
              <Pressable style={s.supportBtn} onPress={handleSupportPress}>
                <Ionicons name="logo-whatsapp" size={18} color={COLORS.white} />
                <Text style={s.supportBtnText}>Falar com o suporte</Text>
              </Pressable>
            </View>

            <Pressable style={s.modalCloseBtn} onPress={handleClose}>
              <Text style={s.modalCloseBtnText}>Fechar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[10],
    alignItems: 'center',
    // Sheet compacto — cresce com o conteúdo, sem cobrir a tela toda
    maxHeight: '75%',
  },
  modalPill: {
    width: 38,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING[5],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[1],
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: COLORS.text,
  },
  modalSub: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING[5],
  },
  faqItem: {
    width: '100%',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING[2],
    backgroundColor: COLORS.backgroundCard,
  },
  faqItemActive: {
    borderColor: COLORS.borderAccent,
    backgroundColor: COLORS.backgroundElevated,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  faqQuestion: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  faqQuestionActive: {
    color: COLORS.accent,
  },
  faqAnswer: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: SPACING[2],
  },
  supportBox: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING[4],
    marginBottom: SPACING[2],
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  supportText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING[3],
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    width: '100%',
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.secondary,
    ...SHADOWS.sm,
  },
  supportBtnText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  modalCloseBtn: {
    marginTop: SPACING[4],
    marginBottom: SPACING[1],
    width: '100%',
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
  },
  modalCloseBtnText: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
