import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  Image,
  FlatList,
  ToastAndroid,
  Platform,
  Alert,
  Clipboard,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useProductRanking } from './hooks/useProductRanking';
import BannerCarousel from '../components/BannerCarousel';
import {
  useScrollHandler,
  useHeaderHeight,
  useHeaderHidden,
  HEADER_HYSTERESIS,
  HEADER_ANIM_DURATION,
  HEADER_EASING,
} from './_layout';

// ─── Pressable com scale ───────────────────────────────────────────────────────
function PressableScale({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Cupom Card (card branco, borda amarela, botão fica verde ao copiar) ──────
function CupomCard({ codigo, desconto, descricao, validade }) {
  const [copiado, setCopiado] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const corAnim = useRef(new Animated.Value(0)).current; // 0 = amarelo, 1 = verde

  const copiarCodigo = () => {
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(codigo);
    } else {
      try {
        const { default: ExpoClipboard } = require('expo-clipboard');
        ExpoClipboard.setStringAsync(codigo);
      } catch (_) {}
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    Animated.timing(corAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    setCopiado(true);
    if (Platform.OS === 'android') ToastAndroid.show('Cupom copiado!', ToastAndroid.SHORT);
    setTimeout(() => {
      Animated.timing(corAnim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
      setCopiado(false);
    }, 2000);
  };

  const botaoBg = corAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#22C55E'],
  });
  const botaoBorda = corAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.primary, '#22C55E'],
  });
  const botaoTexto = corAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.primary, '#FFFFFF'],
  });
  const botaoIcone = copiado ? '#FFFFFF' : COLORS.primary;

  return (
    <View style={s.cupomCardShadow}>
      <View style={s.cupomCard}>
        <LinearGradient
          colors={['transparent', COLORS.primary, COLORS.primary, 'transparent']}
          locations={[0, 0.15, 0.85, 1]}
          style={s.cupomAccent}
        />

        <View style={s.cupomTopRow}>
          <Text style={s.cupomCodigo} numberOfLines={1}>{codigo}</Text>
          <Pressable onPress={copiarCodigo} hitSlop={8}>
            {/* Animated.View de fora só cuida do scale (native driver).
                A de dentro só cuida das cores (JS driver). Cada uma no seu
                node — é isso que evita o erro de misturar driver native/JS
                no mesmo Animated.View. */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Animated.View
                style={[s.cupomBotao, { backgroundColor: botaoBg, borderColor: botaoBorda }]}
              >
                <Ionicons name={copiado ? 'checkmark' : 'copy-outline'} size={12} color={botaoIcone} />
                <Animated.Text style={[s.cupomBotaoText, { color: botaoTexto }]}>
                  {copiado ? 'Copiado!' : 'Copiar'}
                </Animated.Text>
              </Animated.View>
            </Animated.View>
          </Pressable>
        </View>

        <Text style={s.cupomDesconto}>
          <Text style={s.cupomDescontoValor}>{desconto} </Text>
          {descricao}
        </Text>

        <Text style={s.cupomValidade}>{validade}</Text>
      </View>
    </View>
  );
}

// ─── Card de Produto (Mais Pedidos) ───────────────────────────────────────────
function ProdutoCard({ produto, index }) {
  const router = useRouter();
  const [useFallback, setUseFallback] = useState(false);

  const FALLBACKS = {
    batatas: 'https://images.unsplash.com/photo-1518013391915-e40643a1bce1?w=600',
    bebidas: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?w=600',
    macarrao: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
  };

  const imageSource = useFallback
    ? { uri: FALLBACKS[produto.categoria?.toLowerCase()] || FALLBACKS.batatas }
    : { uri: produto.imagem };

  const rank = produto.ranking ?? index + 1;

  return (
    <PressableScale onPress={() => router.push(`/produto/${produto.id}`)}>
      <View style={s.prodCard}>
        {/* Imagem */}
        <View style={s.prodImgWrapper}>
          <Image
            source={imageSource}
            style={s.prodImg}
            onError={() => setUseFallback(true)}
          />
          <View style={s.prodOverlay} />
          <View style={[s.rankBadge, rank <= 3 && s.rankBadgeTop]}>
            <Text style={s.rankBadgeText}>#{rank}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.prodInfo}>
          <View style={s.prodInfoLeft}>
            <Text style={s.prodNome} numberOfLines={1}>{produto.nome}</Text>
            <Text style={s.prodDesc} numberOfLines={1}>{produto.descricao}</Text>
            <View style={s.prodTags}>
              <View style={s.prodTag}>
                <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
                <Text style={s.prodTagText}>{produto.tempo} min</Text>
              </View>
              <View style={s.prodTag}>
                <Ionicons name="star" size={10} color={COLORS.primary} />
                <Text style={s.prodTagText}>{produto.avaliacoes || '4.8'}</Text>
              </View>
            </View>
          </View>
          <View style={s.prodInfoRight}>
            <Text style={s.prodPreco}>{produto.precoFormatado}</Text>
            <View style={s.addBtn}>
              <Ionicons name="add" size={16} color={COLORS.background} />
            </View>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

// ─── Card Horizontal (Destaques) ──────────────────────────────────────────────
function DestaqueMiniCard({ produto }) {
  const router = useRouter();
  const [useFallback, setUseFallback] = useState(false);

  const FALLBACKS = {
    batatas: 'https://images.unsplash.com/photo-1518013391915-e40643a1bce1?w=400',
    bebidas: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?w=400',
    macarrao: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400',
  };

  const imageSource = useFallback
    ? { uri: FALLBACKS[produto.categoria?.toLowerCase()] || FALLBACKS.batatas }
    : { uri: produto.imagem };

  return (
    <PressableScale onPress={() => router.push(`/produto/${produto.id}`)}>
      <View style={s.miniCard}>
        <View style={s.miniImgWrapper}>
          <Image
            source={imageSource}
            style={s.miniImg}
            resizeMode="cover"
            onError={() => setUseFallback(true)}
          />
        </View>
        <View style={s.miniBody}>
          <Text style={s.miniNome} numberOfLines={2}>{produto.nome}</Text>

          <View style={s.miniTags}>
            <View style={s.miniTag}>
              <Ionicons name="star" size={9} color={COLORS.primary} />
              <Text style={s.miniTagText}>{produto.avaliacoes || '4.5'}</Text>
            </View>
            <View style={s.miniTag}>
              <Ionicons name="time-outline" size={9} color={COLORS.textMuted} />
              <Text style={s.miniTagText}>{produto.tempo} min</Text>
            </View>
          </View>

          <View style={s.miniFooter}>
            <Text style={s.miniPreco}>{produto.precoFormatado}</Text>
            <Pressable style={s.miniBtnAdd} onPress={() => router.push(`/produto/${produto.id}`)}>
              <Ionicons name="add" size={20} color={COLORS.background} />
            </Pressable>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

// ─── Categorias (ícones 3D locais) ────────────────────────────────────────────
const CATEGORIAS = [
  { label: 'Cardápio',        icon: require('../assets/icones3d/icone cardapio.png'),         route: '/cardapio' },
  { label: 'Batatas',         icon: require('../assets/icones3d/icone batata.png'),          cat: 'Batatas'  },
  { label: 'Macarrão',        icon: require('../assets/icones3d/icone macarrao.png'),         cat: 'Macarrão' },
  { label: 'Bebidas', icon: require('../assets/icones3d/icone bebidas geladas.png'),  cat: 'Bebidas'  },
];

// ─── Barra flutuante de categorias (aparece quando a grid de categorias sai da tela) ──
// Literalmente a MESMA animação do header (mesma duração, mesma curva, mesmo
// esquema translateY+opacity via native driver) — só que ela é 100%
// absolute/overlay, então nunca empurra o resto do conteúdo (quem empurra é
// só o spacer do header, lá em cima).
function CategoriasFlutuantes({ scrollY, categoriasBottomY, headerHidden, router }) {
  const BAR_SLIDE_DISTANCE = 70; // ~altura da própria barra — sobe/desce igual o header sobe/desce a sua altura

  // hiddenAnim segue a MESMA convenção do headerAnim lá no _layout.js:
  // 0 = visível, 1 = escondida.
  const hiddenAnim = useRef(new Animated.Value(1)).current;
  const visibleRef = useRef(false);

  // headerHidden é um boolean ESTÁVEL (só muda quando o header já terminou de
  // sumir/aparecer) — é o que evita essa barra decidir mostrar/esconder no
  // meio da transição do header e desfazer a própria animação no caminho.
  const headerHiddenRef = useRef(headerHidden);
  useEffect(() => {
    headerHiddenRef.current = headerHidden;
  }, [headerHidden]);

  const animateTo = (shouldShow) => {
    Animated.timing(hiddenAnim, {
      toValue: shouldShow ? 0 : 1,
      duration: HEADER_ANIM_DURATION,
      easing: HEADER_EASING,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (categoriasBottomY == null) return;
    const id = scrollY.addListener(({ value }) => {
      const visibleNow = visibleRef.current;
      let shouldShow = visibleNow;

      if (!visibleNow) {
        // só aparece se o header já sumiu E já passamos da seção de categorias
        if (headerHiddenRef.current && value > categoriasBottomY + HEADER_HYSTERESIS) {
          shouldShow = true;
        }
      } else {
        // esconde se o header voltou a aparecer OU se voltamos pra cima da seção
        if (!headerHiddenRef.current || value < categoriasBottomY - HEADER_HYSTERESIS) {
          shouldShow = false;
        }
      }

      if (shouldShow !== visibleNow) {
        visibleRef.current = shouldShow;
        animateTo(shouldShow);
      }
    });
    return () => scrollY.removeListener(id);
  }, [categoriasBottomY]);

  // Se o header voltar a aparecer enquanto a barra tava visível, some com ela
  // na hora — sempre pro extremo (0 ou 1), nunca fica parada num valor parcial.
  useEffect(() => {
    if (!headerHidden && visibleRef.current) {
      visibleRef.current = false;
      animateTo(false);
    }
  }, [headerHidden]);

  if (categoriasBottomY == null) return null;

  const translateY = hiddenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -BAR_SLIDE_DISTANCE],
  });

  const opacity = hiddenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[s.miniCatWrap, { opacity, transform: [{ translateY }] }]}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.miniCatRow}
        >
          {CATEGORIAS.map((cat) => (
            <Pressable
              key={cat.label}
              style={s.miniCatPill}
              onPress={() =>
                cat.route
                  ? router.push(cat.route)
                  : router.push({ pathname: '/cardapio', params: { categoria: cat.cat } })
              }
            >
              <View style={s.miniCatPillIcon}>
                <Image source={cat.icon} style={s.miniCatPillIconImg} resizeMode="contain" />
              </View>
              <Text style={s.miniCatPillLabel} numberOfLines={1}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

// ─── Tela Principal ────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { produtos, loading } = useProductRanking();
  const { onScroll, resetHeader, scrollY } = useScrollHandler();
  const headerHeight = useHeaderHeight();
  const headerHidden = useHeaderHidden();
  const scrollRef = useRef(null);
  const [categoriasBottomY, setCategoriasBottomY] = useState(null);

  // Espaço reservado pro header no topo do conteúdo — agora é FIXO (sempre
  // igual à altura real do header), não anima mais nem encolhe/cresce. O
  // header virou puro overlay, exatamente igual a barra de categorias: ele
  // desliza por cima/some, mas nunca empurra o resto do conteúdo.
  const headerSpacerHeight = headerHeight;

  useFocusEffect(
    useCallback(() => {
      resetHeader();
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 50);
    }, [resetHeader])
  );

  const disponiveis = produtos.filter(p => p.disponivel);
  const maisPedidos = disponiveis.slice(0, 4);
  const destaques = disponiveis.slice(0, 6);

  const CUPONS = [
    { codigo: 'BATATA5', desconto: 'R$5 OFF', descricao: 'em qualquer batata', validade: 'Válido até 31/07' },
    { codigo: 'PRIMEIRA20', desconto: '20% OFF', descricao: 'na primeira compra', validade: 'Válido até 31/07' },
  ];

  return (
    <View style={s.container}>
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING[10] }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Espaço reservado pro header — fixo, não empurra mais nada */}
        <View style={{ height: headerSpacerHeight }} />

        {/* ══════════════════ CATEGORIAS (estilo iFood, grid 2x2) ══════════════════ */}
        <View
          style={[s.section, { paddingTop: SPACING[4] }]}
          onLayout={(e) => setCategoriasBottomY(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
        >
          <View style={s.catGrid}>
            {CATEGORIAS.map((cat) => (
              <Pressable
                key={cat.label}
                style={s.catGridItem}
                onPress={() =>
                  cat.route
                    ? router.push(cat.route)
                    : router.push({ pathname: '/cardapio', params: { categoria: cat.cat } })
                }
              >
                <View style={s.catGridBox}>
                  <Image source={cat.icon} style={s.catGridIcon} resizeMode="contain" />
                </View>
                <Text style={s.catGridLabel} numberOfLines={1}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ══════════════════ BANNERS (carrossel) ══════════════════ */}
        <View style={s.section}>
          <BannerCarousel />
        </View>

        {/* ══════════════════ DESTAQUES (scroll horizontal) ══════════════════ */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Destaques</Text>
            <Pressable onPress={() => router.push('/cardapio')} style={s.verTodos}>
              <Text style={s.verTodosText}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: SPACING[4] }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.miniCarousel}
            >
              {destaques.map((p) => (
                <DestaqueMiniCard key={p.id} produto={p} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ══════════════════ CUPONS ══════════════════ */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={s.cupomSectionIcon}>
                <Ionicons name="pricetag" size={13} color="#FFD54F" />
              </View>
              <Text style={s.sectionTitle}>Cupons disponíveis</Text>
            </View>
            <View style={s.cupomQtd}>
              <Text style={s.cupomQtdText}>{CUPONS.length} disponíveis</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.cupomRow}
            decelerationRate="fast"
            snapToInterval={212}
            snapToAlignment="start"
          >
            {CUPONS.map((c) => (
              <CupomCard key={c.codigo} {...c} />
            ))}
          </ScrollView>
        </View>

        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Mais pedidos</Text>
            <Pressable onPress={() => router.push('/cardapio')} style={s.verTodos}>
              <Text style={s.verTodosText}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
            </Pressable>
          </View>

          {loading ? (
            <View style={s.loader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            maisPedidos.map((p, i) => (
              <ProdutoCard key={p.id} produto={p} index={i} />
            ))
          )}
        </View>

      </ScrollView>

      <CategoriasFlutuantes
        scrollY={scrollY}
        categoriasBottomY={categoriasBottomY}
        headerHidden={headerHidden}
        router={router}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },



  // ── SECTION BASE ─────────────────────────────────────────────────────────
  section: {
    paddingTop: SPACING[6],
    gap: SPACING[4],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[6],
  },
  sectionTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.lg,
    letterSpacing: -0.3,
  },
  verTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verTodosText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.sizes.sm,
  },

  // ── CATEGORIAS (grid 2x2, estilo iFood — sem sombra/borda) ─────────────────
  catGrid: {
    paddingHorizontal: SPACING[6],
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACING[4],
  },
  catGridItem: {
    width: '48%',
    alignItems: 'center',
  },
  catGridBox: {
    width: '100%',
    aspectRatio: 2.3, // era 1.88 — bem mais achatado, menos altura vertical
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[2],
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  catGridIcon: {
    width: '62%',
    height: '62%',
  },
  catGridLabel: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
  },

  // ── BARRA FLUTUANTE DE CATEGORIAS (aparece ao sair da grid, estilo pill) ───
  miniCatWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 950,
    backgroundColor: COLORS.background,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  miniCatRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING[6],
    paddingVertical: SPACING[3],
    gap: SPACING[2],
  },
  miniCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: RADIUS.full ?? 999,
    paddingLeft: SPACING[1],
    paddingRight: SPACING[4],
    paddingVertical: SPACING[1],
    gap: SPACING[2],
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  miniCatPillIcon: {
    width: 48,
    height: 35,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  miniCatPillIconImg: {
    width: '76%',
    height: '76%',
  },
  miniCatPillLabel: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },

  // ── MINI CAROUSEL (Em alta) ───────────────────────────────────────────────
  miniCarousel: {
    paddingHorizontal: SPACING[6],
    gap: SPACING[3],
  },
  miniCard: {
    width: 170,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  miniImgWrapper: {
    width: '100%',
    height: 130,
    backgroundColor: COLORS.backgroundElevated,
  },
  miniImg: {
    width: '100%',
    height: '100%',
  },
  miniBody: {
    padding: SPACING[3],
    gap: SPACING[2],
    flex: 1,
    justifyContent: 'space-between',
  },
  miniNome: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
  },
  miniPreco: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 16,
  },
  miniFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING[2],
  },
  miniBtnAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 2,
  },
  miniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  miniTagText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },


  // ── CUPONS (iFood style) ──────────────────────────────────────────────────
  cupomSectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#FFD54F1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD54F33',
  },
  cupomRow: {
    paddingHorizontal: SPACING[6],
    gap: SPACING[3],
    paddingVertical: 4,
  },
  cupomQtd: {
    backgroundColor: '#FFB80015',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFB80040',
  },
  cupomQtdText: {
    color: '#B8860B',
    fontSize: 11,
    fontWeight: '700',
  },
  cupomCardShadow: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  cupomCard: {
    width: 172,
    height: 130,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundCard,
    padding: 14,
    paddingLeft: 20,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  // barra de acento à esquerda: em vez de ir de ponta a ponta (top:0/bottom:0)
  // e deixar o overflow:hidden + borderRadius:16 do card cortar ela lá no
  // fundo da curva, a barra agora já nasce e morre no MEIO da curva (inset
  // de 8 = metade do borderRadius de 16). O fade do gradiente cuida só da
  // pontinha final, bem curto, pra suavizar — quem define "onde sai" agora
  // é o tamanho/posição da barra, não o gradiente.
  cupomAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 1.5,
  },
  cupomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cupomCodigo: {
    flexShrink: 1,
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  cupomBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.3,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cupomBotaoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cupomDesconto: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
  },
  cupomDescontoValor: {
    fontWeight: '800',
  },
  cupomValidade: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // ── PRODUTO CARD (Mais Pedidos) ───────────────────────────────────────────
  prodCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginHorizontal: SPACING[6],
    marginBottom: SPACING[3],
    flexDirection: 'row',
    height: 100,
    ...SHADOWS.sm,
  },
  prodImgWrapper: {
    width: 100,
    height: '100%',
    position: 'relative',
  },
  prodImg: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundElevated,
  },
  prodOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rankBadge: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  rankBadgeTop: {
    backgroundColor: COLORS.primary,
  },
  rankBadgeText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 10,
  },
  prodInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  prodInfoLeft: {
    flex: 1,
    marginRight: SPACING[3],
    gap: SPACING[1],
  },
  prodNome: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  prodDesc: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: 16,
  },
  prodTags: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[1],
  },
  prodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  prodTagText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  prodInfoRight: {
    alignItems: 'center',
    gap: SPACING[2],
  },
  prodPreco: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── LOADER ───────────────────────────────────────────────────────────────
  loader: {
    alignItems: 'center',
    paddingVertical: SPACING[10],
  },

});
