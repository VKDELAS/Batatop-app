/**
 * addresses.js
 * Tela de endereços — visual estilo bottom sheet, tema amarelo/claro.
 *
 * Regras de negócio:
 *  - Sem login     → AuthGate (entrar / criar conta)
 *  - Com login     → Lista endereços + form de adicionar
 *  - Só aceita endereços de Iacanga/SP
 *  - "Não sei meu CEP" → busca por logradouro na ViaCEP filtrado por Iacanga
 *
 * Supabase table: addresses
 *   id, user_id, street, number, complement,
 *   neighborhood, city, state, cep, is_default
 */

import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Animated, Modal,
  FlatList, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { supabase } from '../supabaseConfig';
// useAuth resolvido localmente via supabase.auth

const CIDADE_PERMITIDA = 'Iacanga';
const UF_PERMITIDA     = 'SP';

// ─── PressableScale ───────────────────────────────────────────────────────────
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

// ─── AuthGate ─────────────────────────────────────────────────────────────────
function AuthGate() {
  const router = useRouter();
  return (
    <View style={g.wrap}>
      <View style={g.sheet}>
        {/* Ícone */}
        <View style={g.iconWrap}>
          <View style={g.iconCircle}>
            <Ionicons name="location" size={34} color={COLORS.primary} />
          </View>
          <View style={g.lockBadge}>
            <Ionicons name="lock-closed" size={11} color="#fff" />
          </View>
        </View>

        <Text style={g.title}>Seus endereços</Text>
        <Text style={g.sub}>
          Para salvar endereços de entrega você precisa estar logado.
        </Text>

        {/* Aviso amarelo */}
        <View style={g.warnBanner}>
          <Ionicons name="information-circle" size={15} color={COLORS.primary} />
          <Text style={g.warnText}>
            Não é possível adicionar endereços sem uma conta ativa.
          </Text>
        </View>

        {/* Botões */}
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

// ─── Modal "Não sei meu CEP" ──────────────────────────────────────────────────
function BuscaLogradouroModal({ visible, onClose, onSelect }) {
  const [rua, setRua]         = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const buscar = async () => {
    const ruaClean = rua.trim();
    if (ruaClean.length < 3) {
      setError('Digite pelo menos 3 letras do nome da rua.');
      return;
    }
    setLoading(true);
    setError('');
    setResults([]);
    try {
      // ViaCEP: busca por logradouro em cidade específica
      const url = `https://viacep.com.br/ws/${UF_PERMITIDA}/${encodeURIComponent(CIDADE_PERMITIDA)}/${encodeURIComponent(ruaClean)}/json/`;
      const res  = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setError(`Nenhuma rua encontrada em ${CIDADE_PERMITIDA}/${UF_PERMITIDA}.`);
        return;
      }
      setResults(data);
    } catch {
      setError('Erro ao buscar. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    onSelect({
      cep:          item.cep.replace('-', ''),
      street:       item.logradouro,
      neighborhood: item.bairro,
      city:         item.localidade,
      state:        item.uf,
    });
    onClose();
    setRua('');
    setResults([]);
    setError('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          {/* Header */}
          <View style={m.header}>
            <Text style={m.headerTitle}>Buscar pelo nome da rua</Text>
            <Pressable onPress={onClose} style={m.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <Text style={m.hint}>
            Buscamos apenas endereços em {CIDADE_PERMITIDA}/{UF_PERMITIDA}.
          </Text>

          {/* Campo de busca */}
          <View style={m.searchRow}>
            <TextInput
              style={m.searchInput}
              value={rua}
              onChangeText={setRua}
              placeholder="Ex: Rua das Flores"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
              onSubmitEditing={buscar}
              returnKeyType="search"
            />
            <Pressable style={m.searchBtn} onPress={buscar}>
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="search" size={18} color="#fff" />
              }
            </Pressable>
          </View>

          {!!error && (
            <View style={m.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
              <Text style={m.errorText}>{error}</Text>
            </View>
          )}

          {/* Resultados */}
          <FlatList
            data={results}
            keyExtractor={(item) => item.cep}
            style={m.list}
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

// ─── AddressCard ──────────────────────────────────────────────────────────────
function AddressCard({ address, onSetDefault, onDelete }) {
  return (
    <View style={[ac.card, address.is_default && ac.cardDefault]}>
      <View style={ac.row}>
        {/* Ícone */}
        <View style={[ac.iconWrap, address.is_default && ac.iconWrapDefault]}>
          <Ionicons
            name="location"
            size={20}
            color={address.is_default ? COLORS.primary : COLORS.textMuted}
          />
        </View>

        {/* Texto */}
        <View style={ac.textWrap}>
          <Text style={ac.line1} numberOfLines={1}>
            {address.street}, {address.number}
            {address.complement ? ` — ${address.complement}` : ''}
          </Text>
          <Text style={ac.line2} numberOfLines={1}>
            {address.city}, {address.state}
          </Text>
        </View>

        {/* Badge padrão */}
        {address.is_default && (
          <View style={ac.badge}>
            <Text style={ac.badgeText}>Principal</Text>
          </View>
        )}
      </View>

      {/* Ações — só aparecem se não é padrão */}
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

      {/* Ação de remover mesmo sendo padrão */}
      {address.is_default && (
        <Pressable style={[ac.actions, { borderTopWidth: 1, borderTopColor: '#F3E8C0' }]}
          onPress={() => onDelete(address.id)}>
          <View style={[ac.actionBtn, ac.actionBtnDanger]}>
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
            <Text style={[ac.actionText, { color: '#EF4444' }]}>Remover</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

// ─── AddressForm ──────────────────────────────────────────────────────────────
function AddressForm({ onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    cep: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '',
  });
  const [cepLoading, setCepLoading]   = useState(false);
  const [cepError, setCepError]       = useState('');
  const [cityError, setCityError]     = useState('');
  const [showBuscaModal, setShowBuscaModal] = useState(false);

  const set = (field) => (val) => setForm((p) => ({ ...p, [field]: val }));

  // ── Validar cidade ──────────────────────────────────────────────────────
  const validarCidade = (city, state) => {
    const cidadeOk = city.trim().toLowerCase() === CIDADE_PERMITIDA.toLowerCase();
    const ufOk     = state.trim().toUpperCase() === UF_PERMITIDA;
    if (!cidadeOk || !ufOk) {
      setCityError(`Só aceitamos endereços em ${CIDADE_PERMITIDA}/${UF_PERMITIDA}. 🚫`);
      return false;
    }
    setCityError('');
    return true;
  };

  // ── Busca por CEP ───────────────────────────────────────────────────────
  const buscarCep = async (cepRaw) => {
    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    setCepError('');
    setCityError('');
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { setCepError('CEP não encontrado.'); return; }

      // Valida cidade antes de preencher
      if (!validarCidade(data.localidade, data.uf)) return;

      setForm((p) => ({
        ...p,
        street:       data.logradouro  || p.street,
        neighborhood: data.bairro      || p.neighborhood,
        city:         data.localidade  || p.city,
        state:        data.uf          || p.state,
      }));
    } catch {
      setCepError('Erro ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (val) => {
    const nums      = val.replace(/\D/g, '').slice(0, 8);
    const formatted = nums.length > 5 ? `${nums.slice(0, 5)}-${nums.slice(5)}` : nums;
    set('cep')(formatted);
    if (nums.length === 8) buscarCep(nums);
  };

  // ── Seleção pelo modal de busca ─────────────────────────────────────────
  const handleLogradouroSelect = (dados) => {
    setForm((p) => ({ ...p, ...dados, cep: formatCep(dados.cep) }));
    setCepError('');
    setCityError('');
  };

  const formatCep = (c) => {
    const n = c.replace(/\D/g, '');
    return n.length === 8 ? `${n.slice(0,5)}-${n.slice(5)}` : c;
  };

  // ── Salvar ──────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!validarCidade(form.city, form.state)) return;
    const required = ['cep', 'street', 'number', 'neighborhood', 'city', 'state'];
    for (const field of required) {
      if (!form[field].trim()) {
        Alert.alert('Campo obrigatório', `Preencha: ${field}`);
        return;
      }
    }
    onSave({ ...form, cep: form.cep.replace(/\D/g, '') });
  };

  // ── Campo reutilizável ──────────────────────────────────────────────────
  const Field = ({ label, field, placeholder, keyboardType, half, editable = true }) => (
    <View style={[ff.fieldWrap, half && ff.fieldHalf]}>
      <Text style={ff.label}>{label}</Text>
      <TextInput
        style={[ff.input, !editable && ff.inputRO]}
        value={form[field]}
        onChangeText={set(field)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || 'default'}
        editable={editable}
        autoCapitalize="words"
      />
    </View>
  );

  return (
    <>
      <BuscaLogradouroModal
        visible={showBuscaModal}
        onClose={() => setShowBuscaModal(false)}
        onSelect={handleLogradouroSelect}
      />

      <View style={ff.container}>
        {/* Header */}
        <View style={ff.header}>
          <Text style={ff.headerTitle}>Novo endereço</Text>
          <Pressable onPress={onCancel} style={ff.closeBtn}>
            <Ionicons name="close" size={19} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {/* Aviso cidade */}
        <View style={ff.cityBanner}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={ff.cityBannerText}>
            Entregamos apenas em <Text style={{ fontWeight: '800' }}>{CIDADE_PERMITIDA}/{UF_PERMITIDA}</Text>
          </Text>
        </View>

        {/* CEP */}
        <View style={ff.fieldWrap}>
          <Text style={ff.label}>CEP</Text>
          <View style={ff.cepRow}>
            <TextInput
              style={[ff.input, { flex: 1 }]}
              value={form.cep}
              onChangeText={handleCepChange}
              placeholder="00000-000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={9}
            />
            {cepLoading && (
              <ActivityIndicator size="small" color={COLORS.primary} style={ff.cepLoader} />
            )}
          </View>
          {!!cepError && <Text style={ff.fieldError}>{cepError}</Text>}

          {/* Não sei meu CEP */}
          <Pressable style={ff.naoSeiCep} onPress={() => setShowBuscaModal(true)}>
            <Ionicons name="help-circle-outline" size={13} color={COLORS.primary} />
            <Text style={ff.naoSeiCepText}>Não sei meu CEP — buscar pelo nome da rua</Text>
          </Pressable>
        </View>

        {/* Rua + Número */}
        <View style={ff.row}>
          <Field label="Rua / Avenida" field="street" placeholder="Ex: Rua das Flores" />
          <Field label="Nº" field="number" placeholder="123" half keyboardType="numeric" />
        </View>

        {/* Complemento */}
        <Field label="Complemento" field="complement" placeholder="Apto, Casa... (opcional)" />

        {/* Bairro */}
        <Field label="Bairro" field="neighborhood" placeholder="Ex: Centro" />

        {/* Cidade + UF */}
        <View style={ff.row}>
          <Field label="Cidade" field="city" placeholder={CIDADE_PERMITIDA} />
          <Field label="UF" field="state" placeholder={UF_PERMITIDA} half />
        </View>

        {/* Erro de cidade */}
        {!!cityError && (
          <View style={ff.cityError}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={ff.cityErrorText}>{cityError}</Text>
          </View>
        )}

        {/* Botões */}
        <View style={ff.actions}>
          <Pressable style={ff.cancelBtn} onPress={onCancel}>
            <Text style={ff.cancelText}>Cancelar</Text>
          </Pressable>
          <PressableScale onPress={handleSave} style={ff.saveBtn} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="checkmark" size={15} color="#fff" />
                  <Text style={ff.saveText}>Salvar</Text>
                </>
            }
          </PressableScale>
        </View>
      </View>
    </>
  );
}

// ─── Tela Principal ───────────────────────────────────────────────────────────
export default function Addresses() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at',  { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus endereços.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('addresses').insert({
        user_id:      user.id,
        street:       form.street.trim(),
        number:       form.number.trim(),
        complement:   form.complement.trim(),
        neighborhood: form.neighborhood.trim(),
        city:         CIDADE_PERMITIDA,
        state:        UF_PERMITIDA,
        cep:          form.cep.replace(/\D/g, ''),
        is_default:   addresses.length === 0,
      });
      if (error) throw error;
      setShowForm(false);
      await fetchAddresses();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o endereço.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true  }).eq('id', id);
    await fetchAddresses();
  };

  const handleDelete = (id) => {
    Alert.alert('Remover endereço', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          await supabase.from('addresses').delete().eq('id', id);
          await fetchAddresses();
        },
      },
    ]);
  };

  if (!user) return <AuthGate />;

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Cabeçalho fixo */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Endereço de Entrega</Text>
        {!showForm && (
          <Pressable style={s.addBtnHeader} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : (
          <>
            {addresses.length === 0 && !showForm && (
              <View style={s.empty}>
                <Ionicons name="location-outline" size={40} color={COLORS.border} />
                <Text style={s.emptyText}>Nenhum endereço ainda</Text>
              </View>
            )}

            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
              />
            ))}

            {showForm && (
              <AddressForm
                onSave={handleSave}
                onCancel={() => setShowForm(false)}
                saving={saving}
              />
            )}

            {!showForm && (
              <Pressable style={s.addBtn} onPress={() => setShowForm(true)}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={s.addBtnText}>Adicionar novo endereço</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos — AuthGate ───────────────────────────────────────────────────────
const g = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[8],
  },
  sheet: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING[3],
  },
  iconWrap: { position: 'relative', marginBottom: SPACING[4] },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 2, borderColor: COLORS.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.background,
  },
  title: {
    color: COLORS.text, fontWeight: '800',
    fontSize: 24, letterSpacing: -0.5, textAlign: 'center',
  },
  sub: {
    color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center', lineHeight: 21, marginBottom: SPACING[2],
  },
  warnBanner: {
    flexDirection: 'row', gap: SPACING[2],
    backgroundColor: COLORS.primary + '15',
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.primary + '35',
    padding: SPACING[4], width: '100%',
    marginBottom: SPACING[2],
  },
  warnText: {
    flex: 1, color: COLORS.primary,
    fontSize: 12, lineHeight: 17, fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: SPACING[4], width: '100%',
    overflow: 'hidden',
  },
  btnInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING[2],
  },
  btnPrimaryText: {
    color: '#fff', fontWeight: '800', fontSize: TYPOGRAPHY.sizes.base,
  },
  btnSecondary: {
    borderRadius: RADIUS.lg, paddingVertical: SPACING[4], width: '100%',
    borderWidth: 1.5, borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  btnSecondaryText: {
    color: COLORS.primary, fontWeight: '700', fontSize: TYPOGRAPHY.sizes.base,
  },
  footer: {
    color: COLORS.textMuted, fontSize: 11,
    textAlign: 'center', marginTop: SPACING[4],
  },
});

// ─── Estilos — Modal busca logradouro ─────────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING[5], maxHeight: '75%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING[2],
  },
  headerTitle: {
    color: COLORS.text, fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  hint: {
    color: COLORS.textMuted, fontSize: 12,
    marginBottom: SPACING[4], lineHeight: 16,
  },
  searchRow: {
    flexDirection: 'row', gap: SPACING[2], marginBottom: SPACING[3],
  },
  searchInput: {
    flex: 1, backgroundColor: COLORS.backgroundElevated,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING[4], paddingVertical: SPACING[3],
    color: COLORS.text, fontSize: TYPOGRAPHY.sizes.sm,
  },
  searchBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    width: 46, alignItems: 'center', justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    marginBottom: SPACING[2],
  },
  errorText: { color: '#EF4444', fontSize: 12 },
  list: { marginTop: SPACING[2] },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING[3], paddingVertical: SPACING[4],
  },
  resultText: { flex: 1 },
  resultRua: {
    color: COLORS.text, fontWeight: '600',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  resultSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  separator: { height: 1, backgroundColor: COLORS.border },
});

// ─── Estilos — AddressCard ────────────────────────────────────────────────────
const ac = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl, borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING[4], marginBottom: SPACING[3],
  },
  cardDefault: {
    borderColor: COLORS.primary + '60',
    backgroundColor: '#FFFBEB',          // amarelo bem clarinho
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING[3],
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  iconWrapDefault: {
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary + '40',
  },
  textWrap: { flex: 1 },
  line1: {
    color: COLORS.text, fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  line2: {
    color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full ?? 999,
    paddingHorizontal: SPACING[3], paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.background, fontSize: 11, fontWeight: '800',
  },
  actions: {
    flexDirection: 'row', gap: SPACING[2],
    marginTop: SPACING[3], paddingTop: SPACING[3],
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING[3], paddingVertical: 6,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundElevated,
  },
  actionBtnDanger: {
    borderColor: '#EF444430', backgroundColor: '#EF444408',
  },
  actionText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
});

// ─── Estilos — AddressForm ────────────────────────────────────────────────────
const ff = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl, borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING[5], gap: SPACING[4],
    marginBottom: SPACING[4],
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingBottom: SPACING[3],
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text, fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.lg, letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  cityBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary + '12',
    borderRadius: RADIUS.md, padding: SPACING[3],
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  cityBannerText: {
    color: COLORS.primary, fontSize: 12, fontWeight: '600',
  },
  row: { flexDirection: 'row', gap: SPACING[3] },
  fieldWrap: { flex: 1, gap: SPACING[1] },
  fieldHalf: { flex: 0, width: 72 },
  label: {
    color: COLORS.textSecondary, fontSize: 10,
    fontWeight: '700', letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING[4], paddingVertical: SPACING[3],
    color: COLORS.text, fontSize: TYPOGRAPHY.sizes.sm,
  },
  inputRO: { opacity: 0.55 },
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  cepLoader: { position: 'absolute', right: SPACING[3] },
  fieldError: { color: '#EF4444', fontSize: 11, fontWeight: '600' },
  naoSeiCep: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginTop: 4,
  },
  naoSeiCepText: {
    color: COLORS.primary, fontSize: 12,
    fontWeight: '600', textDecorationLine: 'underline',
  },
  cityError: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#EF444412', borderRadius: RADIUS.md,
    padding: SPACING[3], borderWidth: 1, borderColor: '#EF444430',
  },
  cityErrorText: { flex: 1, color: '#EF4444', fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: SPACING[3] },
  cancelBtn: {
    flex: 1, paddingVertical: SPACING[4],
    borderRadius: RADIUS.lg, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundElevated,
  },
  cancelText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: TYPOGRAPHY.sizes.sm },
  saveBtn: {
    flex: 2, backgroundColor: COLORS.primary,
    paddingVertical: SPACING[4], borderRadius: RADIUS.lg,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING[2],
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: TYPOGRAPHY.sizes.sm },
});

// ─── Estilos — Tela principal ─────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 130, // espaço pro header global
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    color: COLORS.text, fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.lg,
    letterSpacing: -0.3,
  },
  addBtnHeader: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1.5, borderColor: COLORS.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[8],
  },
  loader: { paddingVertical: SPACING[10], alignItems: 'center' },
  empty: {
    alignItems: 'center', paddingVertical: SPACING[10], gap: SPACING[3],
  },
  emptyText: {
    color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING[2],
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.primary + '0A',
    marginTop: SPACING[3],
  },
  addBtnText: {
    color: COLORS.primary, fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});