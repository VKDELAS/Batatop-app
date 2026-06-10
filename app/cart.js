import { View, Text, ScrollView, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../utils/cartStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

function CartItem({ item, onRemove, onUpdateQty }) {
  return (
    <View style={s.cartItem}>
      <Image source={{ uri: item.imagem }} style={s.itemImage} resizeMode="cover" />
      <View style={s.itemInfo}>
        <View>
          <Text style={s.itemName}>{item.nome}</Text>
          <Text style={s.itemPrice}>{item.preco}</Text>
        </View>
        <View style={s.itemControls}>
          <View style={s.qtyControls}>
            <Pressable style={s.qtyBtn} onPress={() => onUpdateQty(item.id, item.quantity - 1)}>
              <Ionicons name="remove" size={16} color={COLORS.primary} />
            </Pressable>
            <Text style={s.qtyText}>{item.quantity}</Text>
            <Pressable style={s.qtyBtn} onPress={() => onUpdateQty(item.id, item.quantity + 1)}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
            </Pressable>
          </View>
          <Pressable onPress={() => onRemove(item.id)}>
            <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function Cart() {
  const router = useRouter();
  const { items, remove, updateQty, clear } = useCart();
  const [processing, setProcessing] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const preco = parseFloat(item.preco.replace('R$ ', '').replace(',', '.'));
    return sum + (preco * item.quantity);
  }, 0);
  const deliveryFee = 5.00;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      Alert.alert('Sucesso!', 'Pedido enviado com sucesso!', [
        { text: 'OK', onPress: () => { clear(); router.replace('/pedidos'); } }
      ]);
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.emptyContainer}>
          <View style={s.emptyIconBg}>
            <Ionicons name="cart-outline" size={64} color={COLORS.primary} />
          </View>
          <Text style={s.emptyTitle}>Seu carrinho está vazio</Text>
          <Text style={s.emptySub}>Adicione algumas delícias da Batatop para começar!</Text>
          <Pressable style={s.emptyBtn} onPress={() => router.push('/cardapio')}>
            <Text style={s.emptyBtnText}>Ver Cardápio</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING[5] }}>
        <Text style={s.title}>Meu Carrinho</Text>
        
        <View style={s.itemsList}>
          {items.map((item) => (
            <CartItem key={item.id} item={item} onRemove={remove} onUpdateQty={updateQty} />
          ))}
        </View>

        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>R$ {subtotal.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Taxa de Entrega</Text>
            <Text style={s.summaryValue}>R$ {deliveryFee.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>

        <View style={s.paymentCard}>
          <Text style={s.sectionTitle}>Pagamento</Text>
          <Pressable style={s.paymentSelector}>
            <View style={s.paymentLeft}>
              <Ionicons name="card-outline" size={20} color={COLORS.primary} />
              <Text style={s.paymentText}>Pagar na Entrega (Cartão/Dinheiro)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </Pressable>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Pressable 
          style={[s.checkoutBtn, processing && s.checkoutBtnDisabled]} 
          onPress={handleCheckout}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={s.checkoutBtnText}>Finalizar Pedido</Text>
              <Text style={s.checkoutBtnPrice}>R$ {total.toFixed(2).replace('.', ',')}</Text>
            </>
          )}
        </Pressable>
      </View>
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
  title: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING[5],
  },
  itemsList: {
    gap: SPACING[3],
    marginBottom: SPACING[6],
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING[3],
    gap: SPACING[3],
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.borderLight,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    padding: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 8,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING[5],
    gap: SPACING[3],
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING[4],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING[3],
    marginTop: SPACING[1],
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '800',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING[5],
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING[10],
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[3],
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING[1],
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  paymentText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING[5],
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[6],
    height: 56,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
  },
  checkoutBtnDisabled: {
    opacity: 0.7,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  checkoutBtnPrice: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[10],
    gap: SPACING[2],
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[8],
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[8],
    paddingVertical: SPACING[4],
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
});
