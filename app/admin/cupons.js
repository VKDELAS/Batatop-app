import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Alert, Modal, TextInput, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseConfig';
import * as Haptics from 'expo-haptics';

const EMPTY_COUPON = {
  code: '', discount: '', type: 'percentage',
  expiresAt: '', permanent: true,
  maxUsage: '', maxUsagePerUser: '',
};

export default function AdminCupons() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);

  // ─── Carregar cupons ────────────────────────────────────────────
  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os cupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  // ─── Abrir modal ────────────────────────────────────────────────
  const openModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      const hasExpiry = !!coupon.expires_at;
      let expiryStr = '';
      if (hasExpiry) {
        const d = new Date(coupon.expires_at);
        expiryStr = d.toISOString().split('T')[0];
      }
      setForm({
        code: coupon.code || '',
        discount: String(coupon.discount || ''),
        type: coupon.type || 'percentage',
        expiresAt: expiryStr,
        permanent: !hasExpiry,
        maxUsage: coupon.max_usage ? String(coupon.max_usage) : '',
        maxUsagePerUser: coupon.max_usage_per_user ? String(coupon.max_usage_per_user) : '',
      });
    } else {
      setEditingCoupon(null);
      setForm(EMPTY_COUPON);
    }
    setModalVisible(true);
  };

  // ─── Salvar cupom ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.code.trim()) { Alert.alert('Atenção', 'Informe o código do cupom.'); return; }
    const discount = parseFloat(form.discount.replace(',', '.'));
    if (isNaN(discount) || discount <= 0) { Alert.alert('Atenção', 'Desconto inválido.'); return; }
    if (!form.permanent && !form.expiresAt) { Alert.alert('Atenção', 'Informe a data de validade ou marque como permanente.'); return; }

    const expires_at = form.permanent ? null : new Date(form.expiresAt + 'T23:59:59').toISOString();
    const max_usage = form.maxUsage ? parseInt(form.maxUsage) : null;
    const max_usage_per_user = form.maxUsagePerUser ? parseInt(form.maxUsagePerUser) : null;

    setSaving(true);
    try {
      if (editingCoupon) {
        const { error } = await supabase.from('coupons').update({
          code: form.code.toUpperCase().trim(),
          discount, type: form.type,
          expires_at, max_usage, max_usage_per_user,
        }).eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert({
          code: form.code.toUpperCase().trim(),
          discount, type: form.type,
          expires_at, max_usage, max_usage_per_user,
          is_active: true, usage_count: 0,
        });
        if (error) throw error;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      await loadCoupons();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Não foi possível salvar o cupom.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle ativo ───────────────────────────────────────────────
  const handleToggleActive = async (coupon) => {
    try {
      await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
      await loadCoupons();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { Alert.alert('Erro', 'Não foi possível alterar o status.'); }
  };

  // ─── Deletar ────────────────────────────────────────────────────
  const handleDelete = (coupon) => {
    Alert.alert('Deletar Cupom', `Excluir o cupom "${coupon.code}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deletar', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('coupons').delete().eq('id', coupon.id);
          await loadCoupons();
        } catch { Alert.alert('Erro', 'Não foi possível deletar.'); }
      }},
    ]);
  };

  const activeCoupons = coupons.filter(c => c.is_active);
  const inactiveCoupons = coupons.filter(c => !c.is_active);

  const formatExpiry = (dateStr) => {
    if (!dateStr) return 'Sem expiração';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Gerenciar Cupons</Text>
          <Text style={s.headerSub}>{activeCoupons.length} ativo(s) · {inactiveCoupons.length} inativo(s)</Text>
        </View>
        <Pressable style={s.addBtn} onPress={() => openModal()}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={s.addBtnText}>Novo</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#A855F7" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.listContent}>
          {/* Ativos */}
          <Text style={s.sectionTitle}>Cupons Ativos ({activeCoupons.length})</Text>
          {activeCoupons.length === 0 ? (
            <View style={s.emptySection}>
              <Text style={s.emptySectionText}>Nenhum cupom ativo</Text>
            </View>
          ) : activeCoupons.map(c => (
            <CouponCard key={c.id} coupon={c} formatExpiry={formatExpiry} onEdit={() => openModal(c)} onDelete={() => handleDelete(c)} onToggle={() => handleToggleActive(c)} />
          ))}

          {/* Inativos */}
          {inactiveCoupons.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 20 }]}>Cupons Inativos ({inactiveCoupons.length})</Text>
              {inactiveCoupons.map(c => (
                <CouponCard key={c.id} coupon={c} formatExpiry={formatExpiry} onEdit={() => openModal(c)} onDelete={() => handleDelete(c)} onToggle={() => handleToggleActive(c)} />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</Text>
            <Pressable onPress={() => setModalVisible(false)} style={s.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#1A1A1A" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.modalBody}>

            {/* Código */}
            <Text style={s.fieldLabel}>Código do Cupom *</Text>
            <TextInput
              style={s.input}
              placeholder="Ex: PROMO10"
              value={form.code}
              onChangeText={v => setForm(f => ({ ...f, code: v.toUpperCase() }))}
              autoCapitalize="characters"
              maxLength={20}
              placeholderTextColor="#9CA3AF"
            />

            {/* Tipo + Valor */}
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Tipo *</Text>
                <View style={s.typeRow}>
                  {[{ key: 'percentage', label: '%' }, { key: 'fixed', label: 'R$' }].map(t => (
                    <Pressable
                      key={t.key}
                      style={[s.typeBtn, form.type === t.key && s.typeBtnActive]}
                      onPress={() => setForm(f => ({ ...f, type: t.key }))}
                    >
                      <Text style={[s.typeBtnText, form.type === t.key && s.typeBtnTextActive]}>{t.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={{ flex: 2 }}>
                <Text style={s.fieldLabel}>Valor *</Text>
                <TextInput
                  style={s.input}
                  placeholder={form.type === 'percentage' ? '10' : '5,00'}
                  value={form.discount}
                  onChangeText={v => setForm(f => ({ ...f, discount: v }))}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Limites */}
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Limite global</Text>
                <TextInput style={s.input} placeholder="Ilimitado" value={form.maxUsage} onChangeText={v => setForm(f => ({ ...f, maxUsage: v }))} keyboardType="number-pad" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Limite p/ pessoa</Text>
                <TextInput style={s.input} placeholder="Ilimitado" value={form.maxUsagePerUser} onChangeText={v => setForm(f => ({ ...f, maxUsagePerUser: v }))} keyboardType="number-pad" placeholderTextColor="#9CA3AF" />
              </View>
            </View>

            {/* Permanente toggle */}
            <View style={s.permanentRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Permanente</Text>
                <Text style={s.permanentSub}>Sem data de expiração</Text>
              </View>
              <Switch
                value={form.permanent}
                onValueChange={v => setForm(f => ({ ...f, permanent: v, expiresAt: v ? '' : f.expiresAt }))}
                trackColor={{ false: '#E5E7EB', true: '#A855F7' }}
                thumbColor="#FFF"
              />
            </View>

            {/* Data expiração */}
            {!form.permanent && (
              <>
                <Text style={s.fieldLabel}>Data de vencimento *</Text>
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  value={form.expiresAt}
                  onChangeText={v => setForm(f => ({ ...f, expiresAt: v }))}
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={s.hint}>Formato: AAAA-MM-DD (ex: 2025-12-31)</Text>
              </>
            )}

            <Pressable style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>{editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function CouponCard({ coupon, formatExpiry, onEdit, onDelete, onToggle }) {
  const isActive = coupon.is_active;
  return (
    <View style={[s.couponCard, isActive && s.couponCardActive]}>
      <View style={s.couponLeft}>
        <View style={[s.couponIconBg, { backgroundColor: isActive ? '#F3E8FF' : '#F3F4F6' }]}>
          <Ionicons name="pricetag-outline" size={18} color={isActive ? '#A855F7' : '#9CA3AF'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.couponCode}>{coupon.code}</Text>
          <Text style={s.couponValue}>
            {coupon.type === 'percentage' ? `${coupon.discount}% de desconto` : `R$ ${Number(coupon.discount).toFixed(2)} de desconto`}
          </Text>
          <View style={s.couponMeta}>
            <Text style={s.couponMetaText}>Usos: {coupon.usage_count || 0}{coupon.max_usage ? `/${coupon.max_usage}` : ''}</Text>
            <Text style={s.couponMetaDot}>·</Text>
            <Text style={s.couponMetaText}>Válido: {formatExpiry(coupon.expires_at)}</Text>
          </View>
        </View>
      </View>
      <View style={s.couponActions}>
        <Switch
          value={isActive}
          onValueChange={onToggle}
          trackColor={{ false: '#E5E7EB', true: '#A855F7' }}
          thumbColor="#FFF"
          style={{ transform: [{ scale: 0.8 }] }}
        />
        <View style={s.couponBtns}>
          <Pressable style={s.iconBtn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={16} color="#6B7280" />
          </Pressable>
          <Pressable style={[s.iconBtn, { backgroundColor: '#FEE2E2' }]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingBottom: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 8 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  headerSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#A855F7' },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', marginBottom: 10 },
  emptySection: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 8 },
  emptySectionText: { color: '#9CA3AF', fontWeight: '600', fontSize: 14 },

  couponCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10, borderWidth: 1.5, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  couponCardActive: { borderColor: '#E9D5FF' },
  couponLeft: { flex: 1, flexDirection: 'row', gap: 12 },
  couponIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  couponCode: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', letterSpacing: 0.5 },
  couponValue: { fontSize: 12, fontWeight: '700', color: '#A855F7', marginTop: 2 },
  couponMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  couponMetaText: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  couponMetaDot: { fontSize: 10, color: '#D1D5DB' },
  couponActions: { alignItems: 'flex-end', gap: 8 },
  couponBtns: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },

  modalContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  modalCloseBtn: { padding: 4, backgroundColor: '#F3F4F6', borderRadius: 10 },
  modalBody: { padding: 20, paddingBottom: 60 },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A', fontWeight: '600', marginBottom: 16 },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: -12, marginBottom: 16, fontWeight: '500' },

  row: { flexDirection: 'row', gap: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  typeBtnActive: { backgroundColor: '#A855F7', borderColor: '#A855F7' },
  typeBtnText: { fontSize: 16, fontWeight: '900', color: '#6B7280' },
  typeBtnTextActive: { color: '#FFF' },

  permanentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 16 },
  permanentSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },

  saveBtn: { backgroundColor: '#A855F7', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
});
