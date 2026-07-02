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
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useProdutos } from './hooks/useProdutos';
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
    Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Cupom Card (estilo iFood) ────────────────────────────────────────────────
function CupomCard({ codigo, desconto, descricao, tipo = 'percent' }) {
  const [copiado, setCopiado] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    setCopiado(true);
    if (Platform.OS === 'android') ToastAndroid.show('Cupom copiado!', ToastAndroid.SHORT);
    setTimeout(() => setCopiado(false), 2500);
  };

  // Tema: Amarelo (#FFB800) e Vermelho (#E61E2A)
  const bgLeft  = tipo === 'frete' ? '#E61E2A' : '#FFB800';
  const bgRight = tipo === 'frete' ? '#FFF5F6' : '#FFFDF0';

  const isYellow = bgLeft === '#FFB800';
  const textColorLeft = isYellow ? '#5C3E00' : '#FFFFFF';
  const badgeBgColor = isYellow ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.22)';
  const badgeTextColor = isYellow ? '#5C3E00' : '#FFFFFF';
  const descTextColor = isYellow ? 'rgba(92,62,0,0.85)' : 'rgba(255,255,255,0.85)';

  const codeLabelColor = isYellow ? '#B8860B' : '#E61E2A';
  const codeColor = isYellow ? '#5C3E00' : '#E61E2A';
  const buttonBgColor = isYellow ? 'rgba(255,184,0,0.18)' : 'rgba(230,30,42,0.1)';
  const buttonTextColor = isYellow ? '#5C3E00' : '#E61E2A';

  return (
    <Animated.View style={[s.cupomCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={copiarCodigo} style={s.cupomInner}>
        {/* Lado esquerdo */}
        <View style={[s.cupomLeft, { backgroundColor: bgLeft }]}>
          <View style={[s.cupomBadge, { backgroundColor: badgeBgColor }]}>
            <Ionicons name="pricetag" size={10} color={badgeTextColor} />
            <Text style={[s.cupomBadgeText, { color: badgeTextColor }]}>CUPOM</Text>
          </View>
          <Text style={[s.cupomDesconto, { color: textColorLeft }]}>{desconto}</Text>
          <Text style={[s.cupomDesc, { color: descTextColor }]}>{descricao}</Text>
        </View>

        {/* Divisor */}
        <View style={[s.cupomDivider, { backgroundColor: bgLeft }]}>
          <View style={[s.cupomCircle, s.cupomCircleTop,    { backgroundColor: COLORS.background }]} />
          <View style={[s.cupomCircle, s.cupomCircleBottom, { backgroundColor: COLORS.background }]} />
        </View>

        {/* Lado direito */}
        <View style={[s.cupomRight, { backgroundColor: bgRight }]}>
          <Text style={[s.cupomCodigoLabel, { color: codeLabelColor }]}>CÓDIGO</Text>
          <Text style={[s.cupomCodigo, { color: codeColor }, copiado && s.cupomCopiado]}>
            {copiado ? 'OK!' : codigo}
          </Text>
          <View style={[s.cupomBotao, { backgroundColor: copiado ? 'rgba(0,0,0,0.25)' : buttonBgColor }]}>
            <Ionicons name={copiado ? 'checkmark' : 'copy-outline'} size={11} color={copiado ? '#fff' : buttonTextColor} />
            <Text style={[s.cupomBotaoText, { color: copiado ? '#fff' : buttonTextColor }]}>
              {copiado ? 'Copiado!' : 'Copiar'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
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
    <PressableScale onPress={() => router.push(`/produto/${produto.id}`)} style={s.miniCard}>
      <Image
        source={imageSource}
        style={s.miniImg}
        onError={() => setUseFallback(true)}
      />
      <View style={s.miniBody}>
        <Text style={s.miniNome} numberOfLines={1}>{produto.nome}</Text>

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

        <Text style={s.miniPreco}>{produto.precoFormatado}</Text>
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
  const { produtos, loading } = useProdutos();
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

  const maisPedidos = produtos.slice(0, 4);
  const destaques = produtos.slice(0, 6);

  const CUPONS = [
    { codigo: 'BATATOP15', desconto: '15% OFF', descricao: 'na primeira compra', tipo: 'percent' },
    { codigo: 'FRETE0', desconto: 'FRETE', descricao: 'grátis em qualquer pedido', tipo: 'frete' },
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
                <Ionicons name="pricetag" size={13} color={COLORS.secondary} />
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
            snapToInterval={272}
            snapToAlignment="start"
          >
            {CUPONS.map((c) => (
              <CupomCard key={c.codigo} {...c} />
            ))}
          </ScrollView>
        </View>

        {/* ══════════════════ COMO FUNCIONA ══════════════════ */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Como funciona</Text>
          </View>
          <View style={s.howRow}>
            {[
              { icon: 'search-outline',      titulo: 'Escolha',  sub: 'Navegue pelo cardápio'  },
              { icon: 'card-outline',         titulo: 'Pague',    sub: 'Rápido e seguro'        },
              { icon: 'bicycle-outline',      titulo: 'Receba',   sub: 'Em até 22 minutos'      },
            ].map((step, i) => (
              <View key={step.titulo} style={s.howStep}>
                <View style={s.howIconWrap}>
                  <Ionicons name={step.icon} size={22} color={COLORS.primary} />
                  {i < 2 && <View style={s.howLine} />}
                </View>
                <Text style={s.howTitulo}>{step.titulo}</Text>
                <Text style={s.howSub}>{step.sub}</Text>
              </View>
            ))}
          </View>
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
    width: 130,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  miniImg: {
    width: '100%',
    height: 90,
    backgroundColor: COLORS.backgroundElevated,
  },
  miniBody: {
    padding: SPACING[3],
    gap: SPACING[1],
  },
  miniNome: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 15,
  },
  miniPreco: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
    marginTop: 2,
  },
  miniTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 3,
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
    backgroundColor: '#E61E2A10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E61E2A20',
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
  cupomCard: {
    width: 260,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  cupomInner: {
    flexDirection: 'row',
    height: 114,
  },
  cupomLeft: {
    flex: 1,
    padding: 14,
    gap: 2,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  cupomNotch: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    right: -10,
    zIndex: 5,
  },
  cupomNotchTop:    { top: -10 },
  cupomNotchBottom: { bottom: -10 },
  cupomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  cupomBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  cupomDesconto: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  cupomDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  cupomDivider: {
    width: 10,
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed',
    position: 'relative',
    zIndex: 2,
  },
  cupomCircle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    right: -9,
    zIndex: 6,
  },
  cupomCircleTop:    { top: -9 },
  cupomCircleBottom: { bottom: -9 },
  cupomRight: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
  },
  cupomCodigoLabel: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cupomCodigo: {
    color: '#1A1A1A',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  cupomCopiado: {
    color: '#fff',
    fontSize: 13,
  },
  cupomBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  cupomBotaoText: {
    color: '#1A1A1A',
    fontSize: 9,
    fontWeight: '700',
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

  // ── COMO FUNCIONA ─────────────────────────────────────────────────────────
  howRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[6],
    backgroundColor: COLORS.backgroundCard,
    marginHorizontal: SPACING[6],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING[5],
    ...SHADOWS.sm,
  },
  howStep: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING[1],
  },
  howIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[2],
  },
  howLine: {
    position: 'absolute',
    right: -32,
    top: '50%',
    width: 28,
    height: 1.5,
    backgroundColor: COLORS.border,
  },
  howTitulo: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 12,
  },
  howSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
