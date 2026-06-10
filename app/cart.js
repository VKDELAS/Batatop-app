import { View, Text, ScrollView, StyleSheet, Pressable, Image, ActivityIndicator, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../utils/cartStore';

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

// Cart Item Component
function CartItem({ item, onRemove, onUpdateQty }) {
  return (
    <View style={s.cartItem}>
      <Image source={{ uri: item.imagem }} style={s.itemImage} resizeMode="cover" />
      <View style={s.itemInfo}>
        <Text style={s.itemName}>{item.nome}</Text>
        <Text style={s.itemDesc} numberOfLines={1}>{item.descricao}</Text>
        <Text style={s.itemPrice}>{item.preco}</Text>
      </View>
      <View style={s.itemControls}>
        <Pressable
          style={s.qtyBtn}
          onPress={() => onUpdateQty(item.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={16} color="#C8321A" />
        </Pressable>
        <Text style={s.qtyText}>{item.quantity}</Text>
        <Pressable
          style={s.qtyBtn}
          onPress={() => onUpdateQty(item.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color="#C8321A" />
        </Pressable>
        <Pressable
          style={s.removeBtn}
          onPress={() => onRemove(item.id)}
        >
          <Ionicons name="trash" size={18} color="#C8321A" />
        </Pressable>
      </View>
    </View>
  );
}

// Order Summary Component
function OrderSummary({ subtotal, deliveryFee, discount, total }) {
  return (
    <View style={s.summaryContainer}>
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>Subtotal</Text>
        <Text style={s.summaryValue}>R$ {(subtotal / 100).toFixed(2)}</Text>
      </View>
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>Taxa de Entrega</Text>
        <Text style={s.summaryValue}>R$ {(deliveryFee / 100).toFixed(2)}</Text>
      </View>
      {discount > 0 && (
        <View style={[s.summaryRow, s.discountRow]}>
          <Text style={s.discountLabel}>Desconto</Text>
          <Text style={s.discountValue}>-R$ {(discount / 100).toFixed(2)}</Text>
        </View>
      )}
      <View style={[s.summaryRow, s.totalRow]}>
        <Text style={s.totalLabel}>Total</Text>
        <Text style={s.totalValue}>R$ {(total / 100).toFixed(2)}</Text>
      </View>
    </View>
  );
}

export default function Cart() {
  const router = useRouter();
  const { items, remove, updateQty, clear } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [processing, setProcessing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.precoNum * item.quantity), 0);
  const deliveryFee = 500; // R$ 5.00
  const discount = 0;
  const total = subtotal + deliveryFee - discount;

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Carrinho Vazio', 'Adicione produtos antes de finalizar o pedido.');
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Sucesso!',
        'Seu pedido foi recebido! Você receberá uma confirmação por SMS.',
        [
          {
            text: 'OK',
            onPress: () => {
              clear();
              router.push('/');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar o pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#C8321A" />
          </Pressable>
          <Text style={s.title}>Carrinho</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={s.emptyContainer}>
          <Ionicons name="cart" size={64} color="#C8321A" />
          <Text style={s.emptyTitle}>Carrinho Vazio</Text>
          <Text style={s.emptyDesc}>Adicione produtos para começar seu pedido</Text>
          <Pressable style={s.continueBtnEmpty} onPress={() => router.push('/cardapio')}>
            <Text style={s.continueBtnText}>Continuar Comprando</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#C8321A" />
        </Pressable>
        <Text style={s.title}>Carrinho ({items.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.itemsContainer}>
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={remove}
              onUpdateQty={updateQty}
            />
          ))}
        </View>

        <OrderSummary
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          discount={discount}
          total={total}
        />

        <View style={s.paymentSection}>
          <Text style={s.sectionTitle}>Forma de Pagamento</Text>
          <View style={s.paymentOptions}>
            <Pressable
              style={[s.paymentOption, paymentMethod === 'credit' && s.paymentOptionActive]}
              onPress={() => setPaymentMethod('credit')}
            >
              <Ionicons
                name="card"
                size={24}
                color={paymentMethod === 'credit' ? '#C8321A' : '#A3A3A3'}
              />
              <Text style={[s.paymentLabel, paymentMethod === 'credit' && s.paymentLabelActive]}>
                Crédito
              </Text>
            </Pressable>
            <Pressable
              style={[s.paymentOption, paymentMethod === 'debit' && s.paymentOptionActive]}
              onPress={() => setPaymentMethod('debit')}
            >
              <Ionicons
                name="card"
                size={24}
                color={paymentMethod === 'debit' ? '#C8321A' : '#A3A3A3'}
              />
              <Text style={[s.paymentLabel, paymentMethod === 'debit' && s.paymentLabelActive]}>
                Débito
              </Text>
            </Pressable>
            <Pressable
              style={[s.paymentOption, paymentMethod === 'pix' && s.paymentOptionActive]}
              onPress={() => setPaymentMethod('pix')}
            >
              <Ionicons
                name="qr-code"
                size={24}
                color={paymentMethod === 'pix' ? '#C8321A' : '#A3A3A3'}
              />
              <Text style={[s.paymentLabel, paymentMethod === 'pix' && s.paymentLabelActive]}>
                PIX
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={s.deliverySection}>
          <Text style={s.sectionTitle}>Informações de Entrega</Text>
          <View style={s.deliveryInfo}>
            <Ionicons name="location" size={20} color="#C8321A" />
            <View style={s.deliveryText}>
              <Text style={s.deliveryLabel}>Rua das Flores, 123</Text>
              <Text style={s.deliveryDesc}>Iacanga, SP - Entrega em 15-22 min</Text>
            </View>
          </View>
        </View>

        <View style={s.promoSection}>
          <Text style={s.sectionTitle}>Código Promocional</Text>
          <View style={s.promoInput}>
            <Ionicons name="ticket" size={20} color="#A3A3A3" />
            <Text style={s.promoPlaceholder}>Adicionar código promocional</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Pressable
          style={s.continueBtn}
          onPress={() => router.push('/cardapio')}
        >
          <Text style={s.continueBtnText}>Continuar</Text>
        </Pressable>
        <Pressable
          style={[s.checkoutBtn, processing && s.checkoutBtnDisabled]}
          onPress={handleCheckout}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={s.checkoutBtnText}>Finalizar</Text>
              <Text style={s.checkoutBtnPrice}>R$ {(total / 100).toFixed(2)}</Text>
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
    backgroundColor: '#F9F5F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  scroll: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  continueBtnEmpty: {
    backgroundColor: '#C8321A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    overflow: 'hidden',
    gap: 12,
    padding: 12,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  itemDesc: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C8321A',
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A1A',
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 4,
  },
  summaryContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  discountRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECE6DC',
  },
  discountLabel: {
    fontSize: 13,
    color: '#27AE60',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 13,
    color: '#27AE60',
    fontWeight: 'bold',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#C8321A',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C8321A',
  },
  paymentSection: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE6DC',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    alignItems: 'center',
    gap: 6,
  },
  paymentOptionActive: {
    backgroundColor: '#FFF5F0',
    borderColor: '#C8321A',
  },
  paymentLabel: {
    fontSize: 11,
    color: '#6B6B6B',
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentLabelActive: {
    color: '#C8321A',
  },
  deliverySection: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE6DC',
  },
  deliveryInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  deliveryText: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  deliveryDesc: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  promoSection: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE6DC',
  },
  promoInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9F5F0',
    borderRadius: 8,
    gap: 8,
  },
  promoPlaceholder: {
    fontSize: 13,
    color: '#A3A3A3',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE6DC',
  },
  continueBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8321A',
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C8321A',
  },
  checkoutBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#C8321A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  checkoutBtnDisabled: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkoutBtnPrice: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
