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
  ScrollView,
} from 'react-native';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useProdutos, useProdutosPorCategoria, useBuscarProdutos } from './hooks/useProdutos';
import { useScrollHandler, useHeaderHeight } from './_layout';

// MAPEAMENTO: label visível → valor exato no campo `category` do Supabase
// Se o banco usar 'Batatas' com maiúscula, troque aqui.
const CATEGORIA_MAP = {
  'Todas':   'Todas',
  'Batatas': 'batata',
  'Macarrão':'macarrao',
  'Bebidas': 'bebida',
};

// Ícone Ionicons por categoria
const CATEGORIA_ICON = {
  'Todas':   'grid-outline',
  'Batatas': 'leaf-outline',
  'Macarrão':'restaurant-outline',
  'Bebidas': 'cafe-outline',
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

const TABS = ['Todas', 'Batatas', 'Macarrão', 'Bebidas'];

// header:  paddingTop(16) + headerRow(36) + paddingBottom(16) = 68
// search:  paddingVertical(12*2) + searchBox(44) = 68
// tabs:    paddingVertical(12*2) + chip(36) = 60
const HEADER_H = 68;
const SEARCH_H = 68;
const TABS_H   = 60;
const STICKY_H = HEADER_H + SEARCH_H + TABS_H; // 196

export default function Cardapio() {
  const { categoria } = useLocalSearchParams();
  const [tabAtiva, setTabAtiva] = useState(
    TABS.includes(categoria) ? categoria : 'Todas'
  );
  const [query, setQuery]         = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [stickyHeight, setStickyHeight]   = useState(STICKY_H); // medido via onLayout
  const router                    = useRouter();
  const { onScroll: globalScroll, resetHeader } = useScrollHandler();
  const globalHeaderH = useHeaderHeight();
  const flatListRef               = useRef(null);

  // Animated value local para animar o header + abas do próprio cardápio
  const localScrollY = useRef(new Animated.Value(0)).current;
  const prevLocal    = useRef(0);
  const localVisible = useRef(true);
  const localTransY  = useRef(new Animated.Value(0)).current;
  const stickyHeightRef = useRef(STICKY_H); // ref para uso dentro do listener sem re-criar
  const searchAnim   = useRef(new Animated.Value(0)).current; // fade+slide on mount

  const showLocalHeader = useCallback(() => {
    if (!localVisible.current) {
      localVisible.current = true;
      Animated.spring(localTransY, {
        toValue: 0, useNativeDriver: true,
        tension: 80, friction: 12,
      }).start();
    }
  }, []);

  // Listener de animação do header local
  useEffect(() => {
    const id = localScrollY.addListener(({ value }) => {
      const delta = value - prevLocal.current;
      prevLocal.current = value;

      if (value <= 10) {
        showLocalHeader();
        resetHeader(); // garante header global visível ao voltar ao topo
      } else if (delta > 6 && localVisible.current) {
        localVisible.current = false;
        Animated.timing(localTransY, {
          toValue: -(stickyHeightRef.current), duration: 220,
          useNativeDriver: true,
        }).start();
      } else if (delta < -6 && !localVisible.current) {
        showLocalHeader();
      }
    });
    return () => localScrollY.removeListener(id);
  }, []);

  // (animação de entrada da search bar controlada pelo useFocusEffect abaixo)

  // Fix do header: ao receber foco, reseta tudo antes de qualquer animação
  useFocusEffect(
    useCallback(() => {
      // 1. Reseta o estado interno do listener para evitar delta sujo
      prevLocal.current = 0;
      localVisible.current = true;

      // 2. Zera os Animated.Values diretamente (sem animar) para o listener
      //    não disparar hide ao receber eventos com valor antigo
      localScrollY.setValue(0);
      localTransY.setValue(0);
      searchAnim.setValue(0);

      // 3. Força o header global a aparecer
      resetHeader();

      // 4. Rola pro topo (sem animação para não disparar o listener no meio)
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

      // 5. Roda a animação de entrada da search bar depois do frame settle
      const t = setTimeout(() => {
        Animated.spring(searchAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }).start();
      }, 60);

      return () => clearTimeout(t);
    }, [resetHeader])
  );

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

  // Handler combinado: atualiza o localScrollY E o global (para o header do _layout)
  const handleScroll = useCallback((event) => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    localScrollY.setValue(y);
    globalScroll(event);
  }, [globalScroll]);

  return (
    <View style={s.screen}>

      {/* ── HEADER + ABAS animados ── */}
      <Animated.View
        style={[s.stickyWrap, { top: globalHeaderH + 8, transform: [{ translateY: localTransY }] }]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setStickyHeight(h);
          stickyHeightRef.current = h;
        }}
      >
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
            </Pressable>
            <Text style={s.titulo}>Cardápio</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        {/* BARRA DE PESQUISA */}
        <View style={s.searchSection}>
          <View style={s.searchAccentBar} />
          <Animated.View
            style={[
              s.searchAnimWrap,
              {
                opacity: searchAnim,
                transform: [{
                  translateX: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={[s.searchBox, searchFocused && s.searchBoxFocused]}>
              <View style={s.searchIconWrap}>
                <Ionicons name="search-outline" size={16} color={searchFocused ? COLORS.primary : COLORS.textMuted} />
              </View>
              <TextInput
                style={s.searchInput}
                placeholder="Buscar produto..."
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={10} style={s.clearBtn}>
                  <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>

        {/* ABAS */}
        <View style={s.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabsRow}
          >
            {TABS.map((tab) => {
              const ativo = tab === tabAtiva;
              return (
                <Pressable
                  key={tab}
                  style={[s.tab, ativo ? s.tabAtivo : s.tabInativo]}
                  onPress={() => { setTabAtiva(tab); setQuery(''); }}
                >
                  <Ionicons
                    name={CATEGORIA_ICON[tab]}
                    size={14}
                    color={ativo ? COLORS.text : COLORS.textMuted}
                  />
                  <Text style={[s.tabTxt, ativo ? s.tabTxtAtivo : s.tabTxtInativo]}>
                    {tab}
                  </Text>
                  {ativo && <View style={s.tabActiveDot} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>

      {/* ── LISTA ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={lista}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ProdutoCard produto={item} />}
          contentContainerStyle={[s.listContent, { paddingTop: globalHeaderH + stickyHeight + SPACING[4] }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
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

  // STICKY WRAPPER — header + abas animados juntos
  stickyWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },

  // HEADER
  header: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[4],
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },

  // SEARCH SECTION — barra amarela + campo
  searchSection: {
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  searchAccentBar: {
    width: 4,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.55,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
    flexShrink: 0,
  },
  searchAnimWrap: {
    flex: 1,
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

  // SEARCH — melhorado
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    minHeight: 44,
  },
  searchBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundElevated,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    paddingVertical: 0,
    fontWeight: '500',
  },
  clearBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ABAS — melhoradas com ScrollView horizontal
  tabsContainer: {
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    position: 'relative',
    minHeight: 36,
  },
  tabAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabInativo: {
    backgroundColor: COLORS.backgroundCard,
    borderColor: COLORS.border,
  },
  tabTxt: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabTxtAtivo:   { color: COLORS.text      },
  tabTxtInativo: { color: COLORS.textMuted },
  tabActiveDot: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },

  // LISTA
  listContent: {
    paddingHorizontal: SPACING[5],
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
