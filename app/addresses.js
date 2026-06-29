/**
 * addresses.js
 * Tela de endereços — página inteira, sem Modal.
 */

import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Animated,
  FlatList, TouchableOpacity, BackHandler, Modal,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavContext, useHeaderHeight } from './_layout';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { supabase } from '../supabaseConfig';

const CIDADE_PERMITIDA = 'Iacanga';
const UF_PERMITIDA     = 'SP';

// PressableScale
function PressableScale({ children, onPress, style, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();
  return (
    <Pressable onPress={disabled ? undefined : onPress} onPressIn={pressIn} onPressOut={pressOut} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

// AuthGate
function AuthGate({ onBack }) {
  const router = useRouter();
  return (
    <View style={g.wrap}>
      <Pressable style={g.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
      </Pressable>
      <View style={g.sheet}>
        <View style={g.iconWrap}>
          <View style={g.iconCircle}>
            <Ionicons name="location" size={34} color={COLORS.primary} />
          </View>
          <View style={g.lockBadge}>
            <Ionicons name="lock-closed" size={11} color="#fff" />
          </View>
        </View>
        <Text style={g.title}>Seus endereços</Text>
        <Text style={g.sub}>Para salvar endereços de entrega você precisa estar logado.</Text>
        <View style={g.warnBanner}>
          <Ionicons name="information-circle" size={15} color={COLORS.primary} />
          <Text style={g.warnText}>Não é possível adicionar endereços sem uma conta ativa.</Text>
        </View>
        <PressableScale onPress={() => router.push('/auth/login')} style={g.btnPrimary}>
          <View style={g.btnInner}>
            <Text style={g.btnPrimaryText}>Entrar na conta</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </View>
        </PressableScale>
        <PressableScale onPress={() => router.push('/auth/register')} style={g.btnSecondary}>
          <View style={g.btnInner}>
            <Ionicons name="person-add-outline" size={15} color={COLORS.primary} />
            <Text style={g.btnSecondaryText}>Criar conta</Text>
          </View>
        </PressableScale>
        <Text style={g.footer}>Rápido, gratuito e seus dados ficam seguros.</Text>
      </View>
    </View>
  );
}

// Modal busca logradouro
function BuscaLogradouroModal({ visible, onClose, onSelect }) {
  const [rua, setRua]         = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const buscar = async () => {
    const ruaClean = rua.trim();
    if (ruaClean.length < 3) { setError('Digite pelo menos 3 letras.'); return; }
    setLoading(true); setError(''); setResults([]);
    try {
      const url = `https://viacep.com.br/ws/${UF_PERMITIDA}/${encodeURIComponent(CIDADE_PERMITIDA)}/${encodeURIComponent(ruaClean)}/json/`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setError(`Nenhuma rua encontrada em ${CIDADE_PERMITIDA}/${UF_PERMITIDA}.`); return;
      }
      setResults(data);
    } catch { setError('Erro ao buscar. Verifique sua conexão.'); }
    finally  { setLoading(false); }
  };

  const handleSelect = (item) => {
    onSelect({ cep: item.cep.replace('-', ''), street: item.logradouro, neighborhood: item.bairro, city: item.localidade, state: item.uf });
    onClose(); setRua(''); setResults([]); setError('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.header}>
            <Text style={m.headerTitle}>Buscar pelo nome da rua</Text>
            <Pressable onPress={onClose} style={m.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </Pressable>
          </View>
          <Text style={m.hint}>Buscamos apenas endereços em {CIDADE_PERMITIDA}/{UF_PERMITIDA}.</Text>
          <View style={m.searchRow}>
            <TextInput style={m.searchInput} value={rua} onChangeText={setRua}
              placeholder="Ex: Rua das Flores" placeholderTextColor={COLORS.textMuted}
              autoFocus onSubmitEditing={buscar} returnKeyType="search" />
            <Pressable style={m.searchBtn} onPress={buscar}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="search" size={18} color="#fff" />}
            </Pressable>
          </View>
          {!!error && <View style={m.errorRow}><Ionicons name="alert-circle-outline" size={14} color="#EF4444" /><Text style={m.errorText}>{error}</Text></View>}
          <FlatList data={results} keyExtractor={(i) => i.cep} style={m.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={m.resultItem} onPress={() => handleSelect(item)}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                <View style={m.resultText}>
                  <Text style={m.resultRua}>{item.logradouro}</Text>
                  <Text style={m.resultSub}>{item.bairro} · CEP {item.cep}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={m.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
}

// AddressCard
function AddressCard({ address, onSetDefault, onDelete }) {
  return (
    <View style={[ac.card, address.is_default && ac.cardDefault]}>
      <View style={ac.row}>
        <View style={[ac.iconWrap, address.is_default && ac.iconWrapDefault]}>
          <Ionicons name="location" size={20} color={address.is_default ? COLORS.primary : COLORS.textMuted} />
        </View>
        <View style={ac.textWrap}>
          <Text style={ac.line1} numberOfLines={1}>
            {address.street}, {address.number}{address.complement ? ` — ${address.complement}` : ''}
          </Text>
          <Text style={ac.line2} numberOfLines={1}>{address.city}, {address.state}</Text>
        </View>
        {address.is_default && <View style={ac.badge}><Text style={ac.badgeText}>Principal</Text></View>}
      </View>
      {!address.is_default && (
        <View style={ac.actions}>
          <Pressable style={ac.actionBtn} onPress={() => onSetDefault(address.id)}>
            <Ionicons name="star-outline" size={13} color={COLORS.primary} />
            <Text style={[ac.actionText, { color: COLORS.primary }]}>Tornar principal</Text>
          </Pressable>
          <Pressable style={[ac.actionBtn, ac.actionBtnDanger]} onPress={() => onDelete(address.id)}>
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
            <Text style={[ac.actionText, { color: '#EF4444' }]}>Remover</Text>
          </Pressable>
        </View>
      )}
      {address.is_default && (
        <Pressable style={[ac.actions, { borderTopWidth: 1, borderTopColor: '#F3E8C0' }]} onPress={() => onDelete(address.id)}>
          <View style={[ac.actionBtn, ac.actionBtnDanger]}>
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
            <Text style={[ac.actionText, { color: '#EF4444' }]}>Remover</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

// Field — componente estável (fora do AddressForm para não perder foco do TextInput a cada tecla)
function Field({ label, field, value, onChangeText, placeholder, keyboardType, half, editable = true }) {
  return (
    <View style={[ff.fieldWrap, half && ff.fieldHalf]}>
      <Text style={ff.label}>{label}</Text>
      <TextInput
        style={[ff.input, !editable && ff.inputRO]}
        value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || 'default'} editable={editable} autoCapitalize="words"
      />
    </View>
  );
}

// AddressForm
function AddressForm({ onSave, onCancel, saving }) {
  const [form, setForm] = useState({ cep: '', street: '', number: '', complement: '', neighborhood: '' });
  const [cepLoading, setCepLoading]         = useState(false);
  const [cepError, setCepError]             = useState('');
  const [cityError, setCityError]           = useState('');
  const [semCep, setSemCep]                 = useState(false);
  const [verifying, setVerifying]           = useState(false);

  const set = (field) => (val) => setForm((p) => ({ ...p, [field]: val }));

  const handleToggleSemCep = () => {
    setSemCep((prev) => {
      if (!prev) { setForm((p) => ({ ...p, cep: '' })); setCepError(''); }
      setCityError('');
      return !prev;
    });
  };

  const validarCidade = (city, state) => {
    const ok = city.trim().toLowerCase() === CIDADE_PERMITIDA.toLowerCase() && state.trim().toUpperCase() === UF_PERMITIDA;
    if (!ok) { setCityError(`Só aceitamos endereços em ${CIDADE_PERMITIDA}/${UF_PERMITIDA}. 🚫`); return false; }
    setCityError(''); return true;
  };

  const buscarCep = async (cepRaw) => {
    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true); setCepError(''); setCityError('');
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { setCepError('CEP não encontrado.'); return; }
      if (!validarCidade(data.localidade, data.uf)) return;
      setForm((p) => ({ ...p, street: data.logradouro || p.street, neighborhood: data.bairro || p.neighborhood }));
    } catch { setCepError('Erro ao buscar CEP.'); }
    finally  { setCepLoading(false); }
  };

  const handleCepChange = (val) => {
    const nums = val.replace(/\D/g, '').slice(0, 8);
    const fmt  = nums.length > 5 ? `${nums.slice(0, 5)}-${nums.slice(5)}` : nums;
    set('cep')(fmt);
    if (nums.length === 8) buscarCep(nums);
  };

  const handleSave = async () => {
    const required = semCep ? ['street', 'number', 'neighborhood'] : ['cep', 'street', 'number', 'neighborhood'];
    for (const f of required) { if (!form[f].trim()) { Alert.alert('Campo obrigatório', `Preencha: ${f}`); return; } }

    setVerifying(true);
    setCityError('');
    try {
      if (semCep) {
        // Sem CEP: confirma que a rua digitada existe em Iacanga/SP via ViaCEP
        const url = `https://viacep.com.br/ws/${UF_PERMITIDA}/${encodeURIComponent(CIDADE_PERMITIDA)}/${encodeURIComponent(form.street.trim())}/json/`;
        const res  = await fetch(url);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          setCityError(`Não encontramos essa rua em ${CIDADE_PERMITIDA}/${UF_PERMITIDA}. Verifique o nome digitado. 🚫`);
          return;
        }
      } else {
        // Com CEP: revalida o CEP final pra garantir que ainda corresponde a Iacanga/SP
        const cepDigits = form.cep.replace(/\D/g, '');
        const res  = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const data = await res.json();
        if (data.erro) { setCepError('CEP não encontrado.'); return; }
        if (!validarCidade(data.localidade, data.uf)) return;
      }
    } catch {
      setCityError('Não foi possível verificar o endereço. Verifique sua conexão e tente novamente.');
      return;
    } finally {
      setVerifying(false);
    }

    onSave({ ...form, cep: form.cep.replace(/\D/g, '') });
  };

  return (
    <View style={ff.container}>
      {/* Aviso cidade */}
      <View style={ff.cityBanner}>
        <Ionicons name="location" size={14} color={COLORS.primary} />
        <Text style={ff.cityBannerText}>
          Entregamos apenas em <Text style={{ fontWeight: '800' }}>{CIDADE_PERMITIDA}/{UF_PERMITIDA}</Text>
        </Text>
      </View>

      {/* CEP — toggle só desabilita o campo, sem nada extra */}
      <View style={ff.fieldWrap}>
        <Text style={ff.label}>CEP{semCep ? ' (opcional)' : ''}</Text>
        <View style={ff.cepRow}>
          <TextInput
            style={[ff.input, { flex: 1 }, semCep && ff.inputRO]}
            value={semCep ? '' : form.cep}
            onChangeText={semCep ? undefined : handleCepChange}
            placeholder="00000-000" placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric" maxLength={9} editable={!semCep}
          />
          {cepLoading && !semCep && <ActivityIndicator size="small" color={COLORS.primary} style={ff.cepLoader} />}
        </View>
        {!!cepError && !semCep && <Text style={ff.fieldError}>{cepError}</Text>}

        {/* Toggle "Não sei meu CEP" — apenas desabilita o campo, nenhum elemento novo aparece */}
        <Pressable style={ff.toggleRow} onPress={handleToggleSemCep}>
          <View style={[ff.toggleBox, semCep && ff.toggleBoxOn]}>
            {semCep && <Ionicons name="checkmark" size={11} color="#fff" />}
          </View>
          <Text style={[ff.toggleText, semCep && ff.toggleTextOn]}>Não sei meu CEP</Text>
        </Pressable>
      </View>

      {/* Rua + Número */}
      <View style={ff.row}>
        <Field label="Rua / Avenida" field="street" value={form.street} onChangeText={set('street')} placeholder="Ex: Rua das Flores" />
        <Field label="Nº" field="number" value={form.number} onChangeText={set('number')} placeholder="123" half keyboardType="numeric" />
      </View>

      <Field label="Complemento" field="complement" value={form.complement} onChangeText={set('complement')} placeholder="Apto, Casa... (opcional)" />
      <Field label="Bairro" field="neighborhood" value={form.neighborhood} onChangeText={set('neighborhood')} placeholder="Ex: Centro" />

      {!!cityError && (
        <View style={ff.cityError}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text style={ff.cityErrorText}>{cityError}</Text>
        </View>
      )}

      <View style={ff.actions}>
        <Pressable style={[ff.cancelBtn, (saving || verifying) && { opacity: 0.5 }]} onPress={onCancel} disabled={saving || verifying}>
          <Text style={ff.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable style={[ff.saveBtn, (saving || verifying) && { opacity: 0.7 }]} onPress={handleSave} disabled={saving || verifying}>
          {(saving || verifying)
            ? <ActivityIndicator size="small" color="#fff" />
            : <View style={ff.saveBtnInner}><Ionicons name="checkmark" size={15} color="#fff" /><Text style={ff.saveText}>Salvar</Text></View>
          }
        </Pressable>
      </View>
    </View>
  );
}

// Tela Principal
export default function Addresses() {
  const [user, setUser]         = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);

  const router = useRouter();
  const { lastRoute, setAnimation } = useNavContext();
  const headerHeight = useHeaderHeight();

  const handleBack = () => {
    if (showForm) { setShowForm(false); return true; }
    setAnimation('slide_from_left');
    router.replace(lastRoute || '/');
    return true;
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [lastRoute, showForm]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('addresses').select('*').eq('user_id', user.id)
        .order('is_default', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch { Alert.alert('Erro', 'Não foi possível carregar seus endereços.'); }
    finally  { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('addresses').insert({
        user_id: user.id, street: form.street.trim(), number: form.number.trim(),
        complement: form.complement.trim(), neighborhood: form.neighborhood.trim(),
        city: CIDADE_PERMITIDA, state: UF_PERMITIDA,
        cep: form.cep.replace(/\D/g, ''), is_default: addresses.length === 0,
      });
      if (error) throw error;
      setShowForm(false);
      await fetchAddresses();
    } catch { Alert.alert('Erro', 'Não foi possível salvar o endereço.'); }
    finally  { setSaving(false); }
  };

  const handleSetDefault = async (id) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true  }).eq('id', id);
    await fetchAddresses();
  };

  const handleDelete = (id) => {
    Alert.alert('Remover endereço', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        await supabase.from('addresses').delete().eq('id', id);
        await fetchAddresses();
      }},
    ]);
  };

  if (!user) return <AuthGate onBack={handleBack} />;

  return (
    <View style={s.page}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scrollContent, { paddingTop: headerHeight + SPACING[4] }]} keyboardShouldPersistTaps="handled">

          {/* Cabeçalho da tela (não fixo, dentro do scroll) */}
          <View style={s.inlineHeader}>
            <Pressable style={s.backBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
            </Pressable>
            <Text style={s.headerTitle}>
              {showForm ? 'Novo endereço' : 'Endereço de Entrega'}
            </Text>
            <View style={{ width: 36 }} />
          </View>


          {loading ? (
            <View style={s.loader}><ActivityIndicator color={COLORS.primary} size="large" /></View>
          ) : showForm ? (
            <AddressForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
          ) : (
            <>
              {addresses.length === 0 && (
                <View style={s.empty}>
                  <Ionicons name="location-outline" size={40} color={COLORS.border} />
                  <Text style={s.emptyText}>Nenhum endereço ainda</Text>
                </View>
              )}
              {addresses.map((addr) => (
                <AddressCard key={addr.id} address={addr} onSetDefault={handleSetDefault} onDelete={handleDelete} />
              ))}
              <Pressable style={s.addBtn} onPress={() => setShowForm(true)}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={s.addBtnText}>Adicionar novo endereço</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Estilos AuthGate
const g = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING[8], paddingTop: 130 },
  backBtn: { position: 'absolute', top: 140, left: SPACING[5], width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '18', borderWidth: 2, borderColor: COLORS.primary + '50', alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 3 },
  sheet: { width: '100%', alignItems: 'center', gap: SPACING[3] },
  iconWrap: { position: 'relative', marginBottom: SPACING[4] },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '18', borderWidth: 2, borderColor: COLORS.primary + '40', alignItems: 'center', justifyContent: 'center' },
  lockBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.background },
  title: { color: COLORS.text, fontWeight: '800', fontSize: 24, letterSpacing: -0.5, textAlign: 'center' },
  sub: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizes.sm, textAlign: 'center', lineHeight: 21, marginBottom: SPACING[2] },
  warnBanner: { flexDirection: 'row', gap: SPACING[2], backgroundColor: COLORS.primary + '15', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.primary + '35', padding: SPACING[4], width: '100%', marginBottom: SPACING[2] },
  warnText: { flex: 1, color: COLORS.primary, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING[4], width: '100%', overflow: 'hidden' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING[2] },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: TYPOGRAPHY.sizes.base },
  btnSecondary: { borderRadius: RADIUS.lg, paddingVertical: SPACING[4], width: '100%', borderWidth: 1.5, borderColor: COLORS.primary, overflow: 'hidden' },
  btnSecondaryText: { color: COLORS.primary, fontWeight: '700', fontSize: TYPOGRAPHY.sizes.base },
  footer: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: SPACING[4] },
});

// Estilos Modal busca
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING[5], maxHeight: '75%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[2] },
  headerTitle: { color: COLORS.text, fontWeight: '800', fontSize: TYPOGRAPHY.sizes.base },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.backgroundElevated, alignItems: 'center', justifyContent: 'center' },
  hint: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING[4], lineHeight: 16 },
  searchRow: { flexDirection: 'row', gap: SPACING[2], marginBottom: SPACING[3] },
  searchInput: { flex: 1, backgroundColor: COLORS.backgroundElevated, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING[4], paddingVertical: SPACING[3], color: COLORS.text, fontSize: TYPOGRAPHY.sizes.sm },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, width: 46, alignItems: 'center', justifyContent: 'center' },
  errorRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: SPACING[2] },
  errorText: { color: '#EF4444', fontSize: 12 },
  list: { marginTop: SPACING[2] },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], paddingVertical: SPACING[4] },
  resultText: { flex: 1 },
  resultRua: { color: COLORS.text, fontWeight: '600', fontSize: TYPOGRAPHY.sizes.sm },
  resultSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  separator: { height: 1, backgroundColor: COLORS.border },
});

// Estilos AddressCard
const ac = StyleSheet.create({
  card: { backgroundColor: COLORS.backgroundCard, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[4], marginBottom: SPACING[3] },
  cardDefault: { borderColor: COLORS.primary + '60', backgroundColor: '#FFFBEB' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3] },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  iconWrapDefault: { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary + '40' },
  textWrap: { flex: 1 },
  line1: { color: COLORS.text, fontWeight: '700', fontSize: TYPOGRAPHY.sizes.sm },
  line2: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizes.xs, marginTop: 2 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: SPACING[3], paddingVertical: 4 },
  badgeText: { color: COLORS.background, fontSize: 11, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: SPACING[2], marginTop: SPACING[3], paddingTop: SPACING[3], borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING[3], paddingVertical: 6, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.backgroundElevated },
  actionBtnDanger: { borderColor: '#EF444430', backgroundColor: '#EF444408' },
  actionText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
});

// Estilos AddressForm
const ff = StyleSheet.create({
  container: { backgroundColor: COLORS.backgroundCard, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[5], gap: SPACING[4], marginBottom: SPACING[4] },
  cityBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '12', borderRadius: RADIUS.md, padding: SPACING[3], borderWidth: 1, borderColor: COLORS.primary + '30' },
  cityBannerText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', gap: SPACING[3] },
  fieldWrap: { flex: 1, gap: SPACING[1] },
  fieldHalf: { flex: 0, width: 72 },
  label: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.backgroundElevated, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING[4], paddingVertical: SPACING[3], color: COLORS.text, fontSize: TYPOGRAPHY.sizes.sm },
  inputRO: { opacity: 0.4 },
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  cepLoader: { position: 'absolute', right: SPACING[3] },
  fieldError: { color: '#EF4444', fontSize: 11, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: SPACING[2] },
  toggleBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.backgroundElevated, alignItems: 'center', justifyContent: 'center' },
  toggleBoxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  toggleTextOn: { color: COLORS.primary },
  cityError: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#EF444412', borderRadius: RADIUS.md, padding: SPACING[3], borderWidth: 1, borderColor: '#EF444430' },
  cityErrorText: { flex: 1, color: '#EF4444', fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: SPACING[3] },
  cancelBtn: { flex: 1, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.backgroundElevated },
  cancelText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: TYPOGRAPHY.sizes.sm },
  saveBtn: { flex: 2, height: 48, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING[2] },
  saveText: { color: '#fff', fontWeight: '800', fontSize: TYPOGRAPHY.sizes.sm },
});

// Estilos tela principal
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  inlineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING[4] },
  headerTitle: { color: COLORS.text, fontWeight: '800', fontSize: TYPOGRAPHY.sizes.lg, letterSpacing: -0.3 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '15', borderWidth: 1.5, borderColor: COLORS.primary + '40', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING[5], paddingTop: SPACING[4], paddingBottom: SPACING[8] },
  loader: { paddingVertical: SPACING[10], alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: SPACING[10], gap: SPACING[3] },
  emptyText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING[2], borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: SPACING[4], backgroundColor: COLORS.primary + '0A', marginTop: SPACING[3] },
  addBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: TYPOGRAPHY.sizes.sm },
});