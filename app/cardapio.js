import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useProdutos, useProdutosPorCategoria, useBuscarProdutos } from './hooks/useProdutos';

// MAPEAMENTO: label visível → valor exato no campo `category` do Supabase
// Se o banco usar 'Batatas' com maiúscula, troque aqui.
const CATEGORIA_MAP = {
  'Todas':   'Todas',
  'Batatas': 'batata',
  'Macarrão':'macarrao',
  'Bebidas': 'bebida',
};

// ─── PressableScale ───────────────────────────────────────────────────────────
function PressableScale({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  const onOut = () => Animated.timing(scale, { toValue: 1,    duration: 180, useNativeDriver: true }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Fallbacks de imagem ──────────────────────────────────────────────────────
const IMG_FALLBACK = {
  batatas:  'https://images.unsplash.com/photo-1518013391915-e40643a1bce1?w=400',
  macarrao: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400',
  bebidas:  'https://images.unsplash.com/photo-1544145945-f904253d0c7b?w=400',
};
function fallback(cat) {
  const k = (cat ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return IMG_FALLBACK[k] ?? IMG_FALLBACK.batatas;
}

// ─── ProdutoCard ──────────────────────────────────────────────────────────────
function ProdutoCard({ produto }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);

  return (
    <Pressable
      style={s.card}
      onPress={() => router.push(`/produto/${produto.id}`)}
    >
      {/* Imagem */}
      <View style={s.imgBox}>
        <Image
          source={{ uri: imgErr ? fallback(produto.categoria) : produto.imagem }}
          style={s.img}
          onError={() => setImgErr(true)}
        />
        <View style={s.ratingPin}>
          <Ionicons name="star" size={9} color={COLORS.primary} />
          <Text style={s.ratingTxt}>{produto.avaliacoes ?? '4.5'}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={s.info}>
        <View>
          <Text style={s.nome} numberOfLines={2}>{produto.nome}</Text>
          <Text style={s.desc} numberOfLines={2}>{produto.descricao}</Text>
        </View>

        <View style={s.footer}>
          <View>
            <Text style={s.preco}>{produto.precoFormatado}</Text>
            <View style={s.tempoRow}>
              <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
              <Text style={s.tempo}>{produto.tempo} min</Text>
            </View>
          </View>
          <Pressable
            style={s.addBtn}
            onPress={() => router.push(`/produto/${produto.id}`)}
            hitSlop={8}
          >
            <Ionicons name="add" size={18} color={COLORS.text} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Tela de Cardápio ─────────────────────────────────────────────────────────
import { useScrollHandler } from './_layout';

const TABS = ['Todas', 'Batatas', 'Macarrão', 'Bebidas'];

export default function Cardapio() {
  const [tabAtiva, setTabAtiva] = useState('Todas');
  const [query, setQuery]       = useState('');
  const router                  = useRouter();
  const onScroll                = useScrollHandler();

  // valor passado pro hook — passa a string do banco, ou 'Todas' para não filtrar
  const catParaHook = CATEGORIA_MAP[tabAtiva];

  const { produtos: todos,    loading: lTodos }  = useProdutos();
  const { produtos: porCat,   loading: lCat }    = useProdutosPorCategoria(catParaHook);
  const { produtos: buscados, loading: lBusca }  = useBuscarProdutos(query);

  let lista   = [];
  let loading = false;

  if (query.trim()) {
    lista   = buscados;
    loading = lBusca;
  } else if (tabAtiva === 'Todas') {
    lista   = todos;
    loading = lTodos;
  } else {
    lista   = porCat;
    loading = lCat;
  }

  const scrollHandler = typeof onScroll === 'function' ? onScroll() : null;

  return (
    <View style={s.screen}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </Pressable>
          <Text style={s.titulo}>Cardápio</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={15} color={COLORS.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar produto..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={15} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── ABAS / FILTROS ── */}
      <View style={s.tabsRow}>
        {TABS.map((tab) => {
          const ativo = tab === tabAtiva;
          return (
            <Pressable
              key={tab}
              style={[s.tab, ativo ? s.tabAtivo : s.tabInativo]}
              onPress={() => { setTabAtiva(tab); setQuery(''); }}
            >
              <Text style={[s.tabTxt, ativo ? s.tabTxtAtivo : s.tabTxtInativo]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── LISTA ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ProdutoCard produto={item} />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="storefront-outline" size={44} color={COLORS.border} />
              <Text style={s.emptyTitle}>Nenhum produto</Text>
              <Text style={s.emptyDesc}>Tente outra categoria ou busca.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  // HEADER
  header: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[3],
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING[3],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.xl,
    letterSpacing: -0.3,
  },

  // SEARCH
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    paddingVertical: 0,
  },

  // ABAS
  tabsRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tabAtivo:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabInativo: { backgroundColor: 'transparent',  borderColor: COLORS.border  },
  tabTxt: { fontSize: TYPOGRAPHY.sizes.xs, fontWeight: '700' },
  tabTxtAtivo:   { color: COLORS.text      },
  tabTxtInativo: { color: COLORS.textMuted },

  // LISTA
  listContent: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[12],
    gap: SPACING[3],
  },

  // CARD
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    height: 112,
    ...SHADOWS.sm,
  },
  imgBox: {
    width: 112,
    height: 112,
    flexShrink: 0,
    position: 'relative',
  },
  img: {
    width: 112,
    height: 112,
    backgroundColor: COLORS.backgroundElevated,
  },
  ratingPin: {
    position: 'absolute',
    bottom: SPACING[2],
    left: SPACING[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 1,
  },
  ratingTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // INFO
  info: {
    flex: 1,
    padding: SPACING[3],
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  nome: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 19,
    marginBottom: 3,
  },
  desc: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: SPACING[2],
  },
  preco: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  tempoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  tempo: { color: COLORS.textMuted, fontSize: 10 },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // STATES
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING[16],
    gap: SPACING[3],
  },
  emptyTitle: { color: COLORS.text,    fontWeight: '700', fontSize: TYPOGRAPHY.sizes.base },
  emptyDesc:  { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizes.sm },
});