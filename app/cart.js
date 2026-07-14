import { View, Text, ScrollView, StyleSheet, Pressable, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../utils/cartStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { supabase } from '../supabaseConfig';
import { useScrollHandler, useHeaderHeight } from './_layout';

const SUPABASE_STORAGE = 'https://eucwoxjmjfqylyrqunwk.supabase.co/storage/v1/object/public/Products/';

function resolveImage(imageUrl) {
  if (imageUrl) {
    if (imageUrl.startsWith('http')) return imageUrl;
    return SUPABASE_STORAGE + imageUrl.replace(/^\/products\//, '');
  }
  return 'https://images.unsplash.com/photo-1518013391915-e40643a1bce1?w=400';
}

function CartItem({ item, onRemove, onUpdateQty }) {
  const itemId = item.cartItemId || item.id;
  return (
    <View style={s.cartItem}>
      <Image source={{ uri: resolveImage(item.imagem) }} style={s.itemImage} resizeMode="cover" />
      <View style={s.itemInfo}>
        <View style={s.itemHeaderRow}>
          <Text style={s.itemName} numberOfLines={1}>{item.nome}</Text>
          <Pressable onPress={() => onRemove(itemId)} style={s.removeBtn}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>
        
        {item.adicionais && item.adicionais.length > 0 && (
          <Text style={s.itemAdicionais}>
            + {item.adicionais.map(a => a.name).join(', ')}
          </Text>
        )}
        
        {item.observacoes ? (
          <View style={s.notesContainer}>
            <Ionicons name="chatbubble-outline" size={12} color="#EA580C" />
            <Text style={s.itemNotes} numberOfLines={2}>
              {item.observacoes}
            </Text>
          </View>
        ) : null}

        <View style={s.itemBottomRow}>
          <Text style={s.itemPrice}>{item.preco}</Text>
          <View style={s.qtyControls}>
            <Pressable style={s.qtyBtn} onPress={() => onUpdateQty(itemId, item.quantity - 1)}>
              <Ionicons name="remove" size={14} color="#EA580C" />
            </Pressable>
            <Text style={s.qtyText}>{item.quantity}</Text>
            <Pressable style={s.qtyBtn} onPress={() => onUpdateQty(itemId, item.quantity + 1)}>
              <Ionicons name="add" size={14} color="#EA580C" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function Cart() {
  const router = useRouter();
  const { items, remove, updateQty, clear } = useCart();
  const [processing, setProcessing] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const { onScroll, resetHeader } = useScrollHandler();
  const headerHeight = useHeaderHeight();

  useFocusEffect(
    useCallback(() => {
      resetHeader();
    }, [resetHeader])
  );

  const subtotal = items.reduce((sum, item) => sum + (item.precoNum * item.quantity) / 100, 0);
  const deliveryFee = 5.00;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    setProcessing(true);
    const { data: { session } } = await supabase.auth.getSession();
    setProcessing(false);

    if (!session) {
      setAuthModalVisible(true);
    } else {
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.emptyContainer}>
          <View style={s.emptyIconBg}>
            <Ionicons name="bag-handle-outline" size={56} color={COLORS.primary} />
          </View>
          <Text style={s.emptyTitle}>Sua sacola está vazia</Text>
          <Text style={s.emptySub}>Que tal adicionar algumas batatas recheadas da Batatop para começar?</Text>
          <Pressable style={s.emptyBtn} onPress={() => router.push('/cardapio')}>
            <Text style={s.emptyBtnText}>Ver Cardápio</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView 
        style={s.scroll} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ padding: SPACING[4], paddingTop: headerHeight + 16, paddingBottom: insets.bottom + 120 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <Text style={s.title}>Meu Carrinho</Text>
        
        <View style={s.itemsList}>
          {items.map((item) => (
            <CartItem key={item.cartItemId || item.id} item={item} onRemove={remove} onUpdateQty={updateQty} />
          ))}
        </View>

        {/* Resumo financeiro estilo iFood */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Resumo de valores</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>R$ {subtotal.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Taxa de entrega</Text>
            <Text style={s.summaryValue}>R$ {deliveryFee.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>

        {/* Info adicional */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Ionicons name="time-outline" size={18} color="#EA580C" />
            <View style={s.infoTextCol}>
              <Text style={s.infoTextTitle}>Tempo estimado</Text>
              <Text style={s.infoTextSub}>15 a 22 minutos para entrega</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer fixo */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable 
          style={[s.checkoutBtn, processing && s.checkoutBtnDisabled]} 
          onPress={handleCheckout}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={s.checkoutBtnText}>Ir para o pagamento</Text>
              <Text style={s.checkoutBtnPrice}>R$ {total.toFixed(2).replace('.', ',')}</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Modal de Autenticação Premium */}
      <Modal
        visible={authModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={s.modalBackdrop} onPress={() => setAuthModalVisible(false)} />
          <View style={s.modalContent}>
            {/* Top decorative pill */}
            <View style={s.modalPill} />
            
            <View style={s.modalIconBg}>
              <Ionicons name="lock-closed" size={32} color="#FFB800" />
            </View>

            <Text style={s.modalTitle}>Acesse sua conta</Text>
            <Text style={s.modalSubtitle}>
              Para finalizar o seu pedido e escolher a forma de entrega, por favor faça login ou crie uma conta.
            </Text>

            <Pressable 
              style={s.modalLoginBtn}
              onPress={() => {
                setAuthModalVisible(false);
                router.push('/auth/login');
              }}
            >
              <Text style={s.modalLoginBtnText}>Fazer Login</Text>
            </Pressable>

            <Pressable 
              style={s.modalRegisterBtn}
              onPress={() => {
                setAuthModalVisible(false);
                router.push('/auth/register');
              }}
            >
              <Text style={s.modalRegisterBtnText}>Criar Nova Conta</Text>
            </Pressable>

            <Pressable 
              style={s.modalCloseBtn}
              onPress={() => setAuthModalVisible(false)}
            >
              <Text style={s.modalCloseBtnText}>Voltar para o carrinho</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  itemsList: {
    gap: 12,
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    paddingRight: 8,
  },
  removeBtn: {
    padding: 4,
  },
  itemAdicionais: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontWeight: '500',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  itemNotes: {
    fontSize: 11,
    color: '#EA580C',
    fontStyle: 'italic',
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 2,
    backgroundColor: '#FFFFFF',
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFB800',
  },
  infoCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoTextCol: {
    flex: 1,
  },
  infoTextTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
  },
  infoTextSub: {
    fontSize: 12,
    color: '#F57C00',
    marginTop: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  checkoutBtn: {
    backgroundColor: '#FFB800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
  },
  checkoutBtnDisabled: {
    opacity: 0.7,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  checkoutBtnPrice: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  emptySub: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  
  // Custom auth modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalPill: {
    width: 38,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 20,
  },
  modalIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  modalLoginBtn: {
    backgroundColor: '#FFB800',
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalLoginBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  modalRegisterBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFB800',
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalRegisterBtnText: {
    color: '#FFB800',
    fontWeight: '800',
    fontSize: 15,
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalCloseBtnText: {
    color: '#999999',
    fontWeight: '700',
    fontSize: 14,
  },
});
