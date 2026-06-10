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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATIONS } from '../constants/theme';
import { getProdutosDestaque, getCategorias, PRODUTOS } from '../data/produtos';

function PressableScale({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Card de Destaque com Imagem Real
 */
function DestaqueCard({ produto }) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <PressableScale
      style={s.card}
      onPress={() => router.push(`/produto/${produto.id}`)}
    >
      {/* Imagem com Skeleton Loading */}
      <View style={s.cardImageWrapper}>
        {!imageLoaded && (
          <View style={[s.cardImg, s.skeleton]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
        <Image
          source={{ uri: produto.imagem }}
          style={[s.cardImg, { display: imageLoaded ? 'flex' : 'none' }]}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Badge de Ranking */}
        <View style={s.rankingBadge}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={s.rankingText}> Nº{produto.ranking}</Text>
        </View>

        {/* Badge de Avaliação */}
        <View style={s.ratingBadge}>
          <Text style={s.ratingText}>{produto.avaliacoes}</Text>
          <Ionicons name="star" size={12} color={COLORS.primary} />
        </View>
      </View>

      {/* Conteúdo */}
      <View style={s.cardInfo}>
        <View style={s.cardHeader}>
          <Text style={s.cardNome} numberOfLines={2}>
            {produto.nome}
          </Text>
          <Text style={s.cardDesc} numberOfLines={2}>
            {produto.descricao}
          </Text>
        </View>

        <View style={s.cardFooter}>
          <View>
            <Text style={s.cardPreco}>{produto.precoFormatado}</Text>
            <Text style={s.cardTempo}>
              <Ionicons name="time" size={12} color={COLORS.textMuted} />
              {' '}{produto.tempo} min
            </Text>
          </View>
          <PressableScale
            style={s.addBtn}
            onPress={() => router.push(`/produto/${produto.id}`)}
          >
            <Ionicons name="add" size={24} color={COLORS.text} />
          </PressableScale>
        </View>
      </View>
    </PressableScale>
  );
}

/**
 * Card de Categoria
 */
function CategoryCard({ icon, label, onPress }) {
  return (
    <PressableScale style={s.categoryCard} onPress={onPress}>
      <View style={s.categoryIconContainer}>
        <Ionicons name={icon} size={28} color={COLORS.primary} />
      </View>
      <Text style={s.categoryLabel}>{label}</Text>
    </PressableScale>
  );
}

/**
 * Tela Principal
 */
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [produtosDestaque, setProdutosDestaque] = useState([]);
  const scrollHandlerRef = useRef(null);

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setProdutosDestaque(getProdutosDestaque());
      setLoading(false);
    }, 300);
  }, []);

  const handleScroll = (event) => {
    if (scrollHandlerRef.current) {
      scrollHandlerRef.current(event);
    }
  };

  // Registrar o handler na montagem
  useEffect(() => {
    scrollHandlerRef.current = global.headerScrollHandler || null;
  }, []);

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING[10] }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ===== HERO SECTION ===== */}
        <View style={s.hero}>
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>Fome de Batata Top? 🍟</Text>
            <Text style={s.heroSub}>
              Batatas gigantes, recheios generosos e aquele sabor que só a batata top tem
            </Text>

            {/* Stats */}
            <View style={s.heroStats}>
              <View style={s.heroStat}>
                <Text style={s.heroStatValue}>35+</Text>
                <Text style={s.heroStatLabel}>Pedidos</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatValue}>15-22</Text>
                <Text style={s.heroStatLabel}>Minutos</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatValue}>Grátis</Text>
                <Text style={s.heroStatLabel}>Frete*</Text>
              </View>
            </View>

            {/* CTA Button */}
            <PressableScale
              style={s.heroCta}
              onPress={() => router.push('/cardapio')}
            >
              <Text style={s.heroCtaText}>Ver Cardápio Completo</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
            </PressableScale>
          </View>
        </View>

        {/* ===== CATEGORIAS RÁPIDAS ===== */}
        <View style={s.categoriesSection}>
          <Text style={s.sectionTitle}>Categorias Populares</Text>
          <View style={s.categoriesGrid}>
            <CategoryCard
              icon="flame"
              label="Batatas"
              onPress={() => router.push('/cardapio')}
            />
            <CategoryCard
              icon="fast-food"
              label="Macarrão"
              onPress={() => router.push('/cardapio')}
            />
            <CategoryCard
              icon="heart"
              label="Favoritas"
              onPress={() => router.push('/cardapio')}
            />
            <CategoryCard
              icon="star"
              label="Promoções"
              onPress={() => router.push('/cardapio')}
            />
          </View>
        </View>

        {/* ===== DESTAQUES ===== */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>As Mais Desejadas</Text>
            <Pressable onPress={() => router.push('/cardapio')}>
              <Text style={s.seeAllLink}>Ver todas →</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={s.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={s.loaderText}>Carregando destaques...</Text>
            </View>
          ) : (
            produtosDestaque.map((p) => (
              <DestaqueCard key={p.id} produto={p} />
            ))
          )}
        </View>

        {/* ===== BANNER PROMOCIONAL ===== */}
        <View style={s.promoBanner}>
          <View style={s.promoBannerContent}>
            <Text style={s.promoBannerTitle}>Primeira Compra? 🎁</Text>
            <Text style={s.promoBannerDesc}>Ganhe 15% de desconto no seu primeiro pedido!</Text>
            <Pressable style={s.promoBannerBtn}>
              <Text style={s.promoBannerBtnText}>Aproveitar Oferta</Text>
            </Pressable>
          </View>
          <Ionicons name="gift" size={56} color={COLORS.primary} style={s.promoBannerIcon} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },

  // ===== HERO SECTION =====
  hero: {
    backgroundColor: COLORS.backgroundElevated,
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[8],
    paddingBottom: SPACING[6],
    borderBottomLeftRadius: RADIUS['2xl'],
    borderBottomRightRadius: RADIUS['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  heroContent: {
    gap: SPACING[4],
  },
  heroTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes['5xl'],
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.lg,
    lineHeight: 26,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.xl,
  },
  heroStatLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: SPACING[1],
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  heroCta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[6],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING[4],
    flexDirection: 'row',
    gap: SPACING[2],
    ...SHADOWS.glow,
  },
  heroCtaText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
  },

  // ===== CATEGORIAS =====
  categoriesSection: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[8],
    paddingBottom: SPACING[4],
  },
  categoriesGrid: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[4],
    flexWrap: 'wrap',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING[2],
    ...SHADOWS.sm,
  },
  categoryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
  },

  // ===== SEÇÃO DE DESTAQUES =====
  section: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[8],
    gap: SPACING[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes['2xl'],
    letterSpacing: -0.5,
  },
  seeAllLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
  },

  // ===== CARDS DE DESTAQUE =====
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.md,
    marginBottom: SPACING[3],
  },
  cardImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundElevated,
  },
  skeleton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingBadge: {
    position: 'absolute',
    top: SPACING[3],
    left: SPACING[3],
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  rankingText: {
    color: '#000',
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  ratingBadge: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    backgroundColor: 'rgba(15, 20, 25, 0.8)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  ratingText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.xs,
  },

  // ===== INFO DO CARD =====
  cardInfo: {
    padding: SPACING[4],
    gap: SPACING[3],
  },
  cardHeader: {
    gap: SPACING[2],
  },
  cardNome: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPreco: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes['2xl'],
  },
  cardTempo: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: SPACING[1],
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },

  // ===== BANNER PROMOCIONAL =====
  promoBanner: {
    marginHorizontal: SPACING[6],
    marginTop: SPACING[8],
    marginBottom: SPACING[4],
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoBannerContent: {
    flex: 1,
    gap: SPACING[2],
  },
  promoBannerTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  promoBannerDesc: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
  },
  promoBannerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    alignSelf: 'flex-start',
    marginTop: SPACING[2],
  },
  promoBannerBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  promoBannerIcon: {
    marginLeft: SPACING[4],
  },

  // ===== LOADER =====
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: SPACING[12],
    gap: SPACING[3],
  },
  loaderText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
