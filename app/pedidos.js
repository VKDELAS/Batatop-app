import { View, Text, ScrollView, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';

function OrderCard({ order }) {
  const statusColors = {
    'Em preparo': COLORS.warning,
    'Entregue': COLORS.success,
    'Cancelado': COLORS.error,
    'A caminho': COLORS.info,
  };

  return (
    <Pressable style={s.orderCard}>
      <View style={s.orderHeader}>
        <View style={s.orderHeaderLeft}>
          <Text style={s.orderId}>Pedido #{order.id}</Text>
          <Text style={s.orderDate}>{order.date}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusColors[order.status] + '15' }]}>
          <Text style={[s.statusText, { color: statusColors[order.status] }]}>{order.status}</Text>
        </View>
      </View>

      <View style={s.orderContent}>
        {order.items.map((item, idx) => (
          <Text key={idx} style={s.orderItemText}>
            {item.quantity}x {item.name}
          </Text>
        ))}
      </View>

      <View style={s.orderFooter}>
        <Text style={s.orderTotal}>Total: {order.total}</Text>
        <Pressable style={s.reorderBtn}>
          <Text style={s.reorderBtnText}>Repetir Pedido</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function Pedidos() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Simulando busca de pedidos
    setTimeout(() => {
      setOrders([
        {
          id: '8942',
          date: 'Hoje, 19:45',
          status: 'Em preparo',
          total: 'R$ 45,90',
          items: [{ name: 'Batata Gourmet Frango', quantity: 1 }, { name: 'Coca-Cola 350ml', quantity: 1 }]
        },
        {
          id: '8810',
          date: 'Ontem, 21:20',
          status: 'Entregue',
          total: 'R$ 38,00',
          items: [{ name: 'Batata Clássica G', quantity: 1 }]
        },
        {
          id: '8755',
          date: '05 Jun, 20:15',
          status: 'Entregue',
          total: 'R$ 52,50',
          items: [{ name: 'Batata Especial Bacon', quantity: 1 }, { name: 'Suco de Laranja', quantity: 1 }]
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <View style={s.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loaderText}>Carregando seus pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING[5] }}>
        <Text style={s.title}>Meus Pedidos</Text>
        
        {orders.length > 0 ? (
          orders.map(order => <OrderCard key={order.id} order={order} />)
        ) : (
          <View style={s.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.border} />
            <Text style={s.emptyTitle}>Nenhum pedido ainda</Text>
            <Text style={s.emptySub}>Que tal fazer sua primeira Batatop hoje?</Text>
            <Pressable style={s.emptyBtn} onPress={() => router.push('/cardapio')}>
              <Text style={s.emptyBtnText}>Ver Cardápio</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginBottom: SPACING[4],
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING[3],
    marginBottom: SPACING[3],
  },
  orderHeaderLeft: {
    gap: 2,
  },
  orderId: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  orderContent: {
    marginBottom: SPACING[4],
    gap: 4,
  },
  orderItemText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  orderTotal: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '800',
    color: COLORS.primary,
  },
  reorderBtn: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loaderText: {
    marginTop: SPACING[4],
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: SPACING[2],
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING[4],
  },
  emptySub: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[6],
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
