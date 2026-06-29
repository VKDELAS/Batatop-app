import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  Image,
  ImageBackground,
  FlatList,
  ToastAndroid,
  Platform,
  Alert,
  Clipboard,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useProdutos } from './hooks/useProdutos';
import { useScrollHandler, useHeaderHeight } from './_layout';

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

// ─── Cupom Card ────────────────────────────────────────────────────────────────
function CupomCard({ codigo, desconto, descricao }) {
  const [copiado, setCopiado] = useState(false);

  const copiarCodigo = () => {
    // Clipboard (expo-clipboard ou react-native nativo)
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(codigo);
    } else {
      try {
        const { default: ExpoClipboard } = require('expo-clipboard');
        ExpoClipboard.setStringAsync(codigo);
      } catch (_) {}
    }

    setCopiado(true);

    if (Platform.OS === 'android') {
      ToastAndroid.show('Cupom copiado!', ToastAndroid.SHORT);
    }

    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <PressableScale onPress={copiarCodigo} style={s.cupomCard}>
      {/* Esquerda — info */}
      <View style={s.cupomLeft}>
        <View style={s.cupomBadge}>
          <Text style={s.cupomBadgeText}>CUPOM</Text>
        </View>
        <Text style={s.cupomDesconto}>{desconto}</Text>
        <Text style={s.cupomDesc}>{descricao}</Text>
      </View>

      {/* Separador pontilhado */}
      <View style={s.cupomDivider} />

      {/* Direita — código + feedback */}
      <View style={s.cupomRight}>
        <Text style={[s.cupomCodigo, copiado && s.cupomCopiado]}>{copiado ? 'COPIADO!' : codigo}</Text>
        <View style={s.cupomBotao}>
          <Ionicons
            name={copiado ? 'checkmark-circle' : 'copy-outline'}
            size={14}
            color={copiado ? '#22C55E' : COLORS.primary}
          />
          <Text style={[s.cupomBotaoText, copiado && { color: '#22C55E' }]}>
            {copiado ? 'Copiado' : 'Copiar'}
          </Text>
        </View>
      </View>
    </PressableScale>
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
                <Text style={s.prodTagText}>4.8</Text>
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
        <Text style={s.miniNome} numberOfLines={2}>{produto.nome}</Text>
        <Text style={s.miniPreco}>{produto.precoFormatado}</Text>
      </View>
    </PressableScale>
  );
}

// ─── Tela Principal ────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { produtos, loading } = useProdutos();
  const { onScroll, resetHeader } = useScrollHandler();
  const headerHeight = useHeaderHeight();
  const scrollRef = useRef(null);

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
    { codigo: 'BATATOP15', desconto: '15% OFF', descricao: 'na primeira compra' },
    { codigo: 'FRETE0', desconto: 'FRETE', descricao: 'grátis em qualquer pedido' },
  ];

  return (
    <View style={s.container}>
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING[10], paddingTop: headerHeight }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >

        {/* ══════════════════ HERO ══════════════════ */}
        <ImageBackground
          source={{ uri: 'https://eucwoxjmjfqylyrqunwk.supabase.co/storage/v1/object/public/logo/banner.png' }}
          style={s.heroBg}
          imageStyle={{ resizeMode: 'cover' }}
        >
          {/* Overlay escuro */}
          <View style={s.heroOverlay} />

          <View style={s.hero}>
            {/* Status */}
            <View style={s.heroStatus}>
              <View style={s.statusDot} />
              <Text style={[s.statusText, { color: '#86EFAC' }]}>Aberto agora · fecha às 22h</Text>
            </View>

            {/* Linha principal: título + cards de stats */}
            <View style={s.heroMain}>
              <View style={s.heroLeft}>
                <Text style={[s.heroTitle, { color: '#FFFFFF' }]}>A batata{"\n"}que você{"\n"}merecia.</Text>
                <Text style={[s.heroSub, { color: 'rgba(255,255,255,0.75)' }]}>Recheios generosos{"\n"}até 22 min na sua porta</Text>
              </View>
              <View style={s.heroRight}>
                <View style={[s.heroStatCard, { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                  <Text style={[s.heroStatNum, { color: '#FFF' }]}>35+</Text>
                  <Text style={[s.heroStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>pedidos{"\n"}hoje</Text>
                </View>
                <View style={[s.heroStatCard, { backgroundColor: COLORS.primary + 'CC', borderColor: COLORS.primary }]}>
                  <Ionicons name="star" size={14} color="#1A1A1A" />
                  <Text style={[s.heroStatNum, { color: '#1A1A1A' }]}>4.9</Text>
                  <Text style={[s.heroStatLabel, { color: 'rgba(0,0,0,0.6)' }]}>avaliação</Text>
                </View>
              </View>
            </View>

            {/* Chips de info */}
            <View style={s.heroChips}>
              <View style={[s.chip, { backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="bicycle-outline" size={13} color={COLORS.primary} />
                <Text style={[s.chipText, { color: '#FFF' }]}>Frete grátis</Text>
              </View>
              <View style={[s.chip, { backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                <Text style={[s.chipText, { color: '#FFF' }]}>15–22 min</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* CTA fora da imagem */}
        <View style={s.heroCtaWrap}>
          <Pressable style={s.heroCta} onPress={() => router.push('/cardapio')}>
            <Text style={s.heroCtaText}>Ver Cardápio</Text>
            <Ionicons name="arrow-forward" size={16} color="#1A1A1A" />
          </Pressable>
        </View>

        {/* ══════════════════ CATEGORIAS ══════════════════ */}
        <View style={s.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catRow}
          >
            {[
              { label: 'Batatas',   icon: 'flame-outline',      cat: 'Batatas'  },
              { label: 'Macarrão', icon: 'restaurant-outline',  cat: 'Macarrão' },
              { label: 'Bebidas',  icon: 'wine-outline',        cat: 'Bebidas'  },
              { label: 'Promoções',icon: 'pricetag-outline',    cat: 'Todas'    },
            ].map((cat) => (
              <Pressable
                key={cat.label}
                style={s.catPill}
                onPress={() => router.push({ pathname: '/cardapio', params: { categoria: cat.cat } })}
              >
                <Ionicons name={cat.icon} size={15} color="#EA580C" />
                <Text style={s.catPillText}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ══════════════════ DESTAQUES (scroll horizontal) ══════════════════ */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Em alta 🔥</Text>
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
            <Text style={s.sectionTitle}>Cupons disponíveis</Text>
            <View style={s.cupomQtd}>
              <Text style={s.cupomQtdText}>{CUPONS.length} cupons</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.cupomRow}
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
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },

  // ── HERO COM FUNDO ────────────────────────────────────────────────────────
  heroBg: {
    width: '100%',
    height: 250,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  hero: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[6],
    paddingBottom: SPACING[6],
    gap: SPACING[3],
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroCtaWrap: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[2],
    backgroundColor: COLORS.background,
  },
  heroStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Layout duas colunas
  heroMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING[3],
  },
  heroLeft: {
    flex: 1,
    gap: SPACING[2],
  },
  heroTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  heroRight: {
    gap: SPACING[2],
    alignItems: 'center',
  },
  heroStatCard: {
    width: 72,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING[3],
    alignItems: 'center',
    gap: 2,
  },
  heroStatCardAlt: {
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '10',
  },
  heroStatNum: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 22,
  },
  heroStatLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
    fontWeight: '600',
  },

  // Chips de info
  heroChips: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.full ?? 999,
    paddingHorizontal: SPACING[3],
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  // CTA
  heroCta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    marginTop: SPACING[2],
    ...SHADOWS.glow,
  },
  heroCtaText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.base,
    letterSpacing: 0.2,
  },

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

  // ── CATEGORIAS ────────────────────────────────────────────────────────────
  catRow: {
    paddingHorizontal: SPACING[6],
    gap: SPACING[2],
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
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
    fontSize: 12,
  },

  // ── CUPONS ────────────────────────────────────────────────────────────────
  cupomRow: {
    paddingHorizontal: SPACING[6],
    gap: SPACING[3],
  },
  cupomQtd: {
    backgroundColor: COLORS.primary + '22',
    borderRadius: RADIUS.full ?? 999,
    paddingHorizontal: SPACING[3],
    paddingVertical: 3,
  },
  cupomQtdText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  cupomCard: {
    width: 240,
    backgroundColor: '#1C1C1C',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cupomLeft: {
    flex: 1,
    padding: SPACING[4],
    gap: SPACING[1],
    justifyContent: 'center',
  },
  cupomBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: SPACING[1],
  },
  cupomBadgeText: {
    color: '#1A1A1A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cupomDesconto: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: 26,
  },
  cupomDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    lineHeight: 14,
  },
  cupomDivider: {
    width: 1,
    marginVertical: SPACING[4],
    backgroundColor: 'transparent',
    borderLeftWidth: 1,
    borderLeftColor: '#333',
    borderStyle: 'dashed',
  },
  cupomRight: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
  },
  cupomCodigo: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  cupomCopiado: {
    color: '#22C55E',
  },
  cupomBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.25)',
  },
  cupomBotaoText: {
    color: COLORS.primary,
    fontSize: 10,
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