import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Alert, RefreshControl, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseConfig';
import * as Haptics from 'expo-haptics';

// ─── Configurações ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Pendente',   color: '#EA580C', bg: '#FFEDD5', icon: 'time-outline' },
  preparing: { label: 'Preparando', color: '#2563EB', bg: '#DBEAFE', icon: 'restaurant-outline' },
  preparo:   { label: 'Preparando', color: '#2563EB', bg: '#DBEAFE', icon: 'restaurant-outline' },
  ready:     { label: 'Pronto',     color: '#7C3AED', bg: '#F3E8FF', icon: 'checkmark-circle-outline' },
  delivered: { label: 'Entregue',   color: '#059669', bg: '#D1FAE5', icon: 'checkmark-done-outline' },
  entregue:  { label: 'Entregue',   color: '#059669', bg: '#D1FAE5', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelado',  color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
};

const FILTERS = [
  { key: 'all',       label: 'Todos',     color: '#FFB800' },
  { key: 'pending',   label: 'Pendentes', color: '#EA580C' },
  { key: 'preparing', label: 'Preparo',   color: '#2563EB' },
  { key: 'ready',     label: 'Pronto',    color: '#7C3AED' },
  { key: 'delivered', label: 'Entregues', color: '#059669' },
  { key: 'cancelled', label: 'Cancelados',color: '#DC2626' },
];

// ─── Componente Principal ──────────────────────────────────────────
export default function AdminPedidos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const lastCountRef = useRef(0);
  const intervalRef = useRef(null);

  // ─── Carregar pedidos ───────────────────────────────────────────
  const loadOrders = useCallback(async (isInitial = false) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const all = data || [];

      // Notificar novo pedido
      if (!isInitial && all.length > lastCountRef.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      lastCountRef.current = all.length;
      setOrders(all);
    } catch (e) {
      console.error('Erro ao carregar pedidos:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(true);
    intervalRef.current = setInterval(() => loadOrders(), 10000);
    return () => clearInterval(intervalRef.current);
  }, [loadOrders]);

  // ─── Atualizar status ───────────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Deletar pedido ─────────────────────────────────────────────
  const handleDelete = (order) => {
    Alert.alert(
      'Deletar Pedido',
      `Tem certeza que deseja deletar o Pedido #${order.order_number}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('orders').delete().eq('id', order.id);
              if (error) throw error;
              setModalVisible(false);
              await loadOrders();
            } catch {
              Alert.alert('Erro', 'Não foi possível deletar o pedido.');
            }
          },
        },
      ]
    );
  };

  // ─── Filtrar pedidos ────────────────────────────────────────────
  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter || (filter === 'preparing' && o.status === 'preparo'));

  const getCount = (key) => {
    if (key === 'all') return orders.length;
    if (key === 'preparing') return orders.filter(o => o.status === 'preparing' || o.status === 'preparo').length;
    return orders.filter(o => o.status === key).length;
  };

  const cfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </Pressable>
        <View style={s.headerTextCol}>
          <Text style={s.headerTitle}>Gerenciar Pedidos</Text>
          <Text style={s.headerSub}>Acompanhe e gerencie os pedidos</Text>
        </View>
        <Pressable onPress={() => { setRefreshing(true); loadOrders(); }} style={s.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color="#FFB800" />
        </Pressable>
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={s.filterContent}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[s.filterBtn, active && { backgroundColor: f.color, borderColor: f.color }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.filterCount, active && { color: '#FFF' }]}>{getCount(f.key)}</Text>
              <Text style={[s.filterLabel, active && { color: '#FFF' }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Lista */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#FFB800" />
          <Text style={s.loadingText}>Carregando pedidos...</Text>
        </View>
      ) : (
        <ScrollView
          style={s.list}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} colors={['#FFB800']} />}
        >
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={56} color="#E5E7EB" />
              <Text style={s.emptyText}>Nenhum pedido encontrado</Text>
            </View>
          ) : (
            filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                cfg={cfg}
                updatingId={updatingId}
                onStatusChange={handleStatusChange}
                onPress={() => { setSelectedOrder(order); setModalVisible(true); }}
                onDelete={() => handleDelete(order)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Modal detalhes */}
      <OrderModal
        visible={modalVisible}
        order={selectedOrder}
        cfg={cfg}
        updatingId={updatingId}
        onClose={() => setModalVisible(false)}
        onStatusChange={handleStatusChange}
        onDelete={() => selectedOrder && handleDelete(selectedOrder)}
      />
    </View>
  );
}

// ─── Card de Pedido ────────────────────────────────────────────────
function OrderCard({ order, cfg, updatingId, onStatusChange, onPress, onDelete }) {
  const c = cfg(order.status);
  const items = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items) : []);

  return (
    <Pressable style={[s.card, { borderLeftColor: c.color }]} onPress={onPress}>
      {/* Cabeçalho do card */}
      <View style={[s.cardHeader, { backgroundColor: c.bg }]}>
        <View style={s.cardHeaderLeft}>
          <View style={[s.statusBadge, { backgroundColor: c.color }]}>
            <Ionicons name={c.icon} size={12} color="#FFF" />
            <Text style={s.statusBadgeText}>{c.label}</Text>
          </View>
          <Text style={s.orderNum}>Pedido #{order.order_number}</Text>
          <Text style={s.orderTime}>
            {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {order.customer_name}
          </Text>
        </View>
        <View style={s.cardHeaderRight}>
          <Text style={s.cardTotal}>R$ {Number(order.total_amount || 0).toFixed(2).replace('.', ',')}</Text>
          <Pressable onPress={onDelete} style={s.deleteBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* Itens resumido */}
      <View style={s.cardBody}>
        <Text style={s.itemsSummary} numberOfLines={1}>
          {items.map(i => `${i.quantity}x ${i.name}`).join(' · ')}
        </Text>
        <Text style={s.addressText} numberOfLines={1}>
          <Ionicons name="location-outline" size={11} /> {order.delivery_address || order.address || '—'}
        </Text>
      </View>

      {/* Botões de ação */}
      {order.status !== 'delivered' && order.status !== 'entregue' && order.status !== 'cancelled' && (
        <View style={s.cardActions}>
          {(order.status === 'pending') && (
            <ActionBtn label="Preparar" icon="restaurant-outline" color="#2563EB" loading={updatingId === order.id} onPress={() => onStatusChange(order.id, 'preparing')} />
          )}
          {(order.status === 'preparing' || order.status === 'preparo') && (
            <ActionBtn label="Pronto" icon="checkmark-circle-outline" color="#7C3AED" loading={updatingId === order.id} onPress={() => onStatusChange(order.id, 'ready')} />
          )}
          {order.status === 'ready' && (
            <ActionBtn label="Entregue" icon="checkmark-done-outline" color="#059669" loading={updatingId === order.id} onPress={() => onStatusChange(order.id, 'delivered')} />
          )}
          <ActionBtn label="Cancelar" icon="close-circle-outline" color="#DC2626" outline loading={updatingId === order.id} onPress={() => onStatusChange(order.id, 'cancelled')} />
        </View>
      )}
    </Pressable>
  );
}

// ─── Botão de Ação ─────────────────────────────────────────────────
function ActionBtn({ label, icon, color, outline, loading, onPress }) {
  return (
    <Pressable
      style={[s.actionBtn, outline ? { borderColor: color, borderWidth: 1.5, backgroundColor: '#FFF' } : { backgroundColor: color }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator size="small" color={outline ? color : '#FFF'} />
        : <>
            <Ionicons name={icon} size={14} color={outline ? color : '#FFF'} />
            <Text style={[s.actionBtnText, outline && { color }]}>{label}</Text>
          </>
      }
    </Pressable>
  );
}

// ─── Modal de detalhes ─────────────────────────────────────────────
function OrderModal({ visible, order, cfg, updatingId, onClose, onStatusChange, onDelete }) {
  if (!order) return null;
  const c = cfg(order.status);
  const items = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items || '[]') : []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        {/* Modal Header */}
        <View style={[s.modalHeader, { backgroundColor: c.color }]}>
          <View>
            <Text style={s.modalTitle}>Pedido #{order.order_number}</Text>
            <View style={s.modalStatusRow}>
              <Ionicons name={c.icon} size={14} color="#FFF" />
              <Text style={s.modalStatus}>{c.label}</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={s.modalCloseBtn}>
            <Ionicons name="close" size={22} color="#FFF" />
          </Pressable>
        </View>

        <ScrollView style={s.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Cliente */}
          <SectionLabel icon="person-outline" label="Cliente" />
          <InfoRow icon="person-outline" label="Nome" value={order.customer_name} />
          <InfoRow icon="call-outline" label="Telefone" value={order.customer_phone} />
          <InfoRow icon="location-outline" label="Endereço" value={order.delivery_address || order.address || '—'} />
          <InfoRow icon="card-outline" label="Pagamento" value={(order.payment_method || '').toUpperCase()} />

          {/* Itens */}
          <SectionLabel icon="basket-outline" label="Itens do Pedido" />
          {items.map((item, i) => (
            <View key={i} style={s.itemRow}>
              <View style={s.itemQtyBadge}>
                <Text style={s.itemQty}>{item.quantity}x</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.name}</Text>
                {item.pastaType && <Text style={s.itemDetail}>Tipo: {item.pastaType}</Text>}
                {Array.isArray(item.adicionais) && item.adicionais.length > 0 && (
                  <Text style={s.itemDetail}>+ {item.adicionais.map(a => `${a.quantity}x ${a.name}`).join(', ')}</Text>
                )}
              </View>
              <Text style={s.itemPrice}>R$ {(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}

          {/* Observações */}
          {!!order.notes && (
            <>
              <SectionLabel icon="document-text-outline" label="Observações" />
              <View style={s.notesBox}>
                <Text style={s.notesText}>{order.notes}</Text>
              </View>
            </>
          )}

          {/* Totais */}
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>R$ {Number(order.total_amount || 0).toFixed(2).replace('.', ',')}</Text>
            </View>
          </View>

          {/* Ações do modal */}
          {order.status !== 'delivered' && order.status !== 'entregue' && order.status !== 'cancelled' && (
            <View style={s.modalActions}>
              {order.status === 'pending' && (
                <Pressable style={[s.modalActionBtn, { backgroundColor: '#2563EB' }]} onPress={() => onStatusChange(order.id, 'preparing')} disabled={updatingId === order.id}>
                  {updatingId === order.id ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="restaurant-outline" size={18} color="#FFF" /><Text style={s.modalActionText}>Preparar</Text></>}
                </Pressable>
              )}
              {(order.status === 'preparing' || order.status === 'preparo') && (
                <Pressable style={[s.modalActionBtn, { backgroundColor: '#7C3AED' }]} onPress={() => onStatusChange(order.id, 'ready')} disabled={updatingId === order.id}>
                  {updatingId === order.id ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="checkmark-circle-outline" size={18} color="#FFF" /><Text style={s.modalActionText}>Pronto</Text></>}
                </Pressable>
              )}
              {order.status === 'ready' && (
                <Pressable style={[s.modalActionBtn, { backgroundColor: '#059669' }]} onPress={() => onStatusChange(order.id, 'delivered')} disabled={updatingId === order.id}>
                  {updatingId === order.id ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="checkmark-done-outline" size={18} color="#FFF" /><Text style={s.modalActionText}>Marcar Entregue</Text></>}
                </Pressable>
              )}
              <Pressable style={[s.modalActionBtn, { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#DC2626' }]} onPress={() => onStatusChange(order.id, 'cancelled')}>
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={[s.modalActionText, { color: '#DC2626' }]}>Cancelar</Text>
              </Pressable>
            </View>
          )}

          <Pressable style={s.deleteOrderBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={s.deleteOrderText}>Deletar Pedido</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function SectionLabel({ icon, label }) {
  return (
    <View style={s.sectionLabel}>
      <Ionicons name={icon} size={13} color="#9CA3AF" />
      <Text style={s.sectionLabelText}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={16} color="#6B7280" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingBottom: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { padding: 8, marginRight: 4 },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  refreshBtn: { padding: 8 },

  filterBar: { maxHeight: 80, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FFF', alignItems: 'center', minWidth: 68 },
  filterCount: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', lineHeight: 22 },
  filterLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280' },

  list: { flex: 1 },
  listContent: { padding: 12, gap: 10, paddingBottom: 40 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#9CA3AF', fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: '#D1D5DB', fontSize: 15, fontWeight: '700' },

  card: { backgroundColor: '#FFF', borderRadius: 20, borderLeftWidth: 5, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, justifyContent: 'space-between' },
  cardHeaderLeft: { flex: 1 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 4 },
  statusBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  orderNum: { fontSize: 15, fontWeight: '900', color: '#1A1A1A' },
  orderTime: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  cardTotal: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
  deleteBtn: { padding: 4 },

  cardBody: { paddingHorizontal: 14, paddingBottom: 12, gap: 4 },
  itemsSummary: { fontSize: 12, color: '#374151', fontWeight: '600' },
  addressText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  cardActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, minWidth: 90 },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, paddingTop: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  modalStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  modalStatus: { color: '#FFF', fontSize: 12, fontWeight: '700', opacity: 0.9 },
  modalCloseBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },

  modalBody: { flex: 1 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionLabelText: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  infoIcon: { width: 36, height: 36, backgroundColor: '#F9FAFB', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 2 },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  itemQtyBadge: { width: 36, height: 36, backgroundColor: '#FEF3C7', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemQty: { fontSize: 12, fontWeight: '900', color: '#D97706' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  itemDetail: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#1A1A1A' },

  notesBox: { marginHorizontal: 16, padding: 14, backgroundColor: '#FFF9E6', borderRadius: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  notesText: { fontSize: 13, color: '#92400E', fontWeight: '500', lineHeight: 20 },

  totalsBox: { marginHorizontal: 16, marginTop: 8, padding: 16, backgroundColor: '#FFF', borderRadius: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#FFB800' },

  modalActions: { marginHorizontal: 16, marginTop: 20, gap: 10 },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16, paddingHorizontal: 20 },
  modalActionText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  deleteOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FFF' },
  deleteOrderText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
});
