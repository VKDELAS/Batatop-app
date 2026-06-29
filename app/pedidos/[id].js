import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { usePedidos } from '../hooks/usePedidos';
import { useHeaderHeight } from '../_layout';

// ─── Constantes de status ─────────────────────────────────────────────────────

const STATUS_LABELS = {
  pending: 'Aguardando confirmação',
  preparing: 'Em preparo',
  ready: 'Pronto para entrega',
  delivered: 'Pedido entregue',
  cancelled: 'Cancelado',
};

const STATUS_ICONS = {
  pending: 'time-outline',
  preparing: 'flame-outline',
  ready: 'checkmark-circle-outline',
  delivered: 'bag-check-outline',
  cancelled: 'close-circle-outline',
};

const STATUS_COLORS = {
  pending: '#D97706',
  preparing: '#EA580C',
  ready: '#2563EB',
  delivered: '#16A34A',
  cancelled: '#DC2626',
};

const STATUS_BG = {
  pending: '#FEF3C7',
  preparing: '#FFF7ED',
  ready: '#EFF6FF',
  delivered: '#F0FDF4',
  cancelled: '#FEF2F2',
};

const PAYMENT_LABELS = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
};

const getStatusStep = (status) => {
  const map = { pending: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 0 };
  return map[status] ?? 1;
};

// ─── Barra de progresso ───────────────────────────────────────────────────────

function ProgressBar({ status }) {
  const step = getStatusStep(status);
  if (status === 'cancelled') return null;

  const steps = ['Confirmado', 'Preparo', 'Pronto', 'Entregue'];
  const progressPercent = ((step - 1) / 3) * 100;

  return (
    <View style={pb.wrapper}>
      <View style={pb.track}>
        <View style={[pb.fill, { width: `${progressPercent}%` }]} />
      </View>
      <View style={pb.dotsRow}>
        {steps.map((label, i) => {
          const active = i + 1 <= step;
          return (
            <View key={label} style={pb.dotCol}>
              <View style={[pb.dot, active && pb.dotActive]} />
              <Text style={[pb.dotLabel, active && pb.dotLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Tela de detalhe ──────────────────────────────────────────────────────────

export default function DetalhesPedido() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { buscarPedidoPorId, loading } = usePedidos();
  const headerHeight = useHeaderHeight();

  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const carregar = async () => {
      const resultado = await buscarPedidoPorId(id);
      if (resultado.success) {
        setPedido(resultado.data);
      } else {
        setErro(true);
      }
    };

    carregar();
  }, [id]);

  const handleWhatsApp = () => {
    if (!pedido) return;
    const num = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();
    const msg = encodeURIComponent(
      `Olá, preciso de ajuda com o meu pedido #${num}.\nCliente: ${pedido.customerName}\nTotal: R$ ${pedido.total.toFixed(2).replace('.', ',')}`
    );
    Linking.openURL(`https://wa.me/5514997361015?text=${msg}`);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading || (!pedido && !erro)) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Carregando pedido...</Text>
      </View>
    );
  }

  // ── Erro ─────────────────────────────────────────────────────────────────────
  if (erro || !pedido) {
    return (
      <View style={s.centered}>
        <Ionicons name="alert-circle-outline" size={56} color={COLORS.border} />
        <Text style={s.errorTitle}>Pedido não encontrado</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const num = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();
  const statusColor = STATUS_COLORS[pedido.status] ?? COLORS.textMuted;
  const statusBg = STATUS_BG[pedido.status] ?? COLORS.borderLight;
  const statusLabel = STATUS_LABELS[pedido.status] ?? pedido.status;
  const statusIcon = STATUS_ICONS[pedido.status] ?? 'bag-outline';

  const timeStr = pedido.createdAt
    ? pedido.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const paymentLabel =
    PAYMENT_LABELS[pedido.paymentMethod] ||
    pedido.paymentMethod?.toUpperCase() ||
    '—';

  const enderecoCompleto = [
    pedido.address,
    pedido.complement,
    pedido.neighborhood,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: headerHeight + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho inline — título + botão voltar dentro do scroll */}
        <View style={s.inlineHeader}>
          <Pressable style={s.backArrow} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text ?? '#111'} />
          </Pressable>
          <View style={s.inlineHeaderText}>
            <Text style={s.headerTitle}>Acompanhar Pedido</Text>
            <Text style={s.headerSub}>#{num}</Text>
          </View>
        </View>
        {/* Card de status */}
        <View style={s.card}>
          <View style={s.statusRow}>
            <View style={[s.statusIconBox, { backgroundColor: statusBg }]}>
              <Ionicons name={statusIcon} size={24} color={statusColor} />
            </View>
            <View style={s.statusInfo}>
              <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
              {timeStr ? (
                <Text style={s.statusTime}>Realizado às {timeStr}</Text>
              ) : null}
            </View>
          </View>
          <ProgressBar status={pedido.status} />
        </View>

        {/* Mercado Pago Payment Card */}
        {pedido.status === 'pending' && (pedido.paymentMethod === 'pix' || pedido.paymentMethod?.toLowerCase() === 'pix') && pedido.metadata?.pix && (
          <View style={[s.card, s.paymentBox]}>
            <View style={s.sectionHeader}>
              <Ionicons name="qr-code-outline" size={18} color="#EA580C" />
              <Text style={s.sectionTitle}>Pagamento via PIX</Text>
            </View>
            <Text style={s.paymentSubText}>
              Aponte a câmera para o QR Code abaixo ou copie a chave Pix Copia e Cola para efetuar o pagamento.
            </Text>
            
            {pedido.metadata.pix.qr_code_base64 ? (
              <View style={s.qrContainer}>
                <Image
                  source={{ uri: `data:image/png;base64,${pedido.metadata.pix.qr_code_base64}` }}
                  style={s.qrImage}
                />
              </View>
            ) : null}

            {pedido.metadata.pix.simulation ? (
              <View style={s.simulationBadge}>
                <Text style={s.simulationText}>Modo Simulação (Ambiente de Testes)</Text>
              </View>
            ) : null}

            <Pressable
              style={[s.copyBtn, copied && s.copyBtnActive]}
              onPress={async () => {
                await Clipboard.setStringAsync(pedido.metadata.pix.qr_code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={18} color="#FFF" />
              <Text style={s.copyBtnText}>{copied ? "Código Copiado!" : "Copiar Código PIX"}</Text>
            </Pressable>
          </View>
        )}


        {/* Itens do pedido */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Ionicons name="bag-outline" size={18} color={COLORS.primary} />
            <Text style={s.sectionTitle}>Itens do Pedido</Text>
          </View>

          <View style={s.divider} />

          {pedido.items && pedido.items.length > 0 ? (
            pedido.items.map((item, idx) => (
              <View key={idx}>
                <View style={s.itemRow}>
                  <Text style={s.itemName}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text style={s.itemPrice}>
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                {item.adicionais && item.adicionais.length > 0 && (
                  <Text style={s.itemAdicionais}>
                    + {item.adicionais.join(', ')}
                  </Text>
                )}
                {item.pastaType && (
                  <Text style={s.itemAdicionais}>Massa: {item.pastaType}</Text>
                )}
                {idx < pedido.items.length - 1 && <View style={s.itemDivider} />}
              </View>
            ))
          ) : (
            <Text style={s.noItems}>Itens não disponíveis</Text>
          )}

          <View style={s.divider} />

          {/* Cupom */}
          {!!pedido.couponCode && (
            <View style={s.couponRow}>
              <Ionicons name="ticket-outline" size={13} color="#16A34A" />
              <Text style={s.couponLabel}>Cupom: {pedido.couponCode}</Text>
              {pedido.discountAmount > 0 && (
                <Text style={s.couponDiscount}>
                  - R$ {pedido.discountAmount.toFixed(2).replace('.', ',')}
                </Text>
              )}
            </View>
          )}

          {/* Total */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>
              R$ {pedido.total.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* Endereço + Pagamento lado a lado */}
        <View style={s.infoRow}>
          {/* Endereço */}
          <View style={[s.card, s.infoCard]}>
            <View style={s.infoHeader}>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={s.infoTitle}>Endereço</Text>
            </View>
            <Text style={s.infoText}>
              {enderecoCompleto || 'Não informado'}
            </Text>
          </View>

          {/* Pagamento */}
          <View style={[s.card, s.infoCard]}>
            <View style={s.infoHeader}>
              <Ionicons name="card-outline" size={16} color={COLORS.primary} />
              <Text style={s.infoTitle}>Pagamento</Text>
            </View>
            <Text style={s.infoText}>
              {paymentLabel}
              {pedido.metadata?.card?.status === 'approved' && ' (Aprovado)'}
            </Text>
            {pedido.metadata?.card?.brand && (
              <Text style={[s.infoText, { fontSize: 11, color: '#666', marginTop: 2 }]}>
                {pedido.metadata.card.brand.toUpperCase()} final **{pedido.metadata.card.last4}
              </Text>
            )}
          </View>
        </View>

        {/* Observações */}
        {!!pedido.notes && (
          <View style={s.card}>
            <View style={s.infoHeader}>
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
              <Text style={s.infoTitle}>Observações</Text>
            </View>
            <Text style={s.infoText}>{pedido.notes}</Text>
          </View>
        )}

        {/* Botão de ajuda */}
        <Pressable style={s.helpBtn} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
          <Text style={s.helpBtnText}>Preciso de Ajuda</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundElevated ?? '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[3] ?? 12,
    padding: SPACING[6] ?? 24,
    backgroundColor: COLORS.backgroundElevated ?? '#F5F5F5',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.sm ?? 14,
    color: COLORS.textSecondary ?? '#666',
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.sizes.lg ?? 18,
    fontWeight: '800',
    color: COLORS.text ?? '#111',
  },
  backBtn: {
    marginTop: SPACING[2] ?? 8,
    paddingHorizontal: SPACING[6] ?? 24,
    paddingVertical: SPACING[3] ?? 12,
    borderRadius: RADIUS.xl ?? 16,
    backgroundColor: COLORS.primary,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base ?? 16,
  },

  // Cabeçalho inline (dentro do scroll, abaixo do header global)
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3] ?? 12,
    marginBottom: SPACING[4] ?? 16,
  },
  inlineHeaderText: {
    flex: 1,
  },
  backArrow: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg ?? 12,
    backgroundColor: COLORS.white ?? '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border ?? '#E5E5E5',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg ?? 18,
    fontWeight: '800',
    color: COLORS.text ?? '#111',
  },
  headerSub: {
    fontSize: TYPOGRAPHY.sizes.sm ?? 13,
    color: COLORS.textMuted ?? '#999',
    fontWeight: '600',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING[4] ?? 16,
    gap: SPACING[4] ?? 16,
    paddingBottom: SPACING[8] ?? 32,
  },

  // Cards
  card: {
    backgroundColor: COLORS.white ?? '#FFF',
    borderRadius: RADIUS.xl ?? 16,
    borderWidth: 1,
    borderColor: COLORS.border ?? '#E5E5E5',
    padding: SPACING[4] ?? 16,
    ...(SHADOWS?.sm ?? {}),
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3] ?? 12,
  },
  statusIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg ?? 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: { flex: 1 },
  statusLabel: {
    fontSize: TYPOGRAPHY.sizes.base ?? 16,
    fontWeight: '800',
  },
  statusTime: {
    fontSize: TYPOGRAPHY.sizes.sm ?? 13,
    color: COLORS.textMuted ?? '#999',
    marginTop: 2,
  },

  // Section header dentro do card
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2] ?? 8,
    marginBottom: SPACING[3] ?? 12,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base ?? 16,
    fontWeight: '800',
    color: COLORS.text ?? '#111',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight ?? '#F0F0F0',
    marginVertical: SPACING[3] ?? 12,
  },
  itemDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight ?? '#F0F0F0',
    marginVertical: SPACING[2] ?? 8,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm ?? 14,
    fontWeight: '600',
    color: COLORS.text ?? '#111',
    marginRight: SPACING[2] ?? 8,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.sizes.sm ?? 14,
    fontWeight: '700',
    color: COLORS.text ?? '#111',
  },
  itemAdicionais: {
    fontSize: 12,
    color: COLORS.textMuted ?? '#999',
    marginTop: 2,
  },
  noItems: {
    fontSize: TYPOGRAPHY.sizes.sm ?? 14,
    color: COLORS.textMuted ?? '#999',
    fontStyle: 'italic',
  },

  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: SPACING[3] ?? 12,
    paddingVertical: 6,
    borderRadius: RADIUS.lg ?? 12,
    marginBottom: SPACING[3] ?? 12,
  },
  couponLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  couponDiscount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.sm ?? 14,
    fontWeight: '700',
    color: COLORS.textSecondary ?? '#666',
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sizes.lg ?? 18,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Endereço + Pagamento
  infoRow: {
    flexDirection: 'row',
    gap: SPACING[3] ?? 12,
  },
  infoCard: {
    flex: 1,
    padding: SPACING[3] ?? 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING[2] ?? 8,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.sm ?? 13,
    fontWeight: '800',
    color: COLORS.text ?? '#111',
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm ?? 13,
    color: COLORS.textSecondary ?? '#555',
    lineHeight: 18,
  },

  // Botão de ajuda
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2] ?? 8,
    backgroundColor: '#25D366',
    paddingVertical: SPACING[4] ?? 16,
    borderRadius: RADIUS.xl ?? 16,
    ...(SHADOWS?.md ?? {}),
  },
  helpBtnText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.sizes.base ?? 16,
    fontWeight: '800',
  },
  
  // Payment box
  paymentBox: {
    borderWidth: 1.5,
    borderColor: '#FFF3E0',
    backgroundColor: '#FFFDF9',
    padding: 16,
  },
  paymentSubText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  simulationBadge: {
    backgroundColor: '#FFE0B2',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginBottom: 16,
  },
  simulationText: {
    color: '#E65100',
    fontSize: 11,
    fontWeight: '800',
  },
  copyBtn: {
    backgroundColor: '#FFB800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  copyBtnActive: {
    backgroundColor: '#27AE60',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  payOnlineBtn: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payOnlineBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

// ─── Progress bar ─────────────────────────────────────────────────────────────

const pb = StyleSheet.create({
  wrapper: {
    paddingTop: SPACING[4] ?? 16,
    paddingBottom: SPACING[1] ?? 4,
  },
  track: {
    height: 4,
    backgroundColor: COLORS.borderLight ?? '#F0F0F0',
    borderRadius: 2,
    marginBottom: SPACING[2] ?? 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dotCol: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight ?? '#E0E0E0',
    borderWidth: 2,
    borderColor: COLORS.border ?? '#D0D0D0',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dotLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted ?? '#BBB',
    textTransform: 'uppercase',
  },
  dotLabelActive: {
    color: COLORS.primary,
  },
});