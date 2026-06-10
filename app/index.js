import { View, Text, ScrollView, StyleSheet, Animated, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

function PressableScale({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
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

function DestaqueCard({ produto }) {
  const router = useRouter();

  return (
    <PressableScale
      style={s.card}
      onPress={() => router.push(`/produto/${produto.id}`)}
    >
      <View style={s.cardImageWrapper}>
        <View style={s.cardImg}>
          <Text style={s.cardImgPlaceholder}>🍟</Text>
        </View>
        <View style={s.rankingBadge}>
          <Text style={s.rankingText}>⭐ Nº{produto.ranking}</Text>
        </View>
      </View>
      <View style={s.cardInfo}>
        <View style={s.cardHeader}>
          <Text style={s.cardNome} numberOfLines={2}>{produto.nome}</Text>
          <Text style={s.cardDesc} numberOfLines={2}>{produto.descricao}</Text>
        </View>
        <View style={s.cardFooter}>
          <Text style={s.cardPreco}>{produto.preco}</Text>
          <PressableScale
            style={s.addBtn}
            onPress={() => router.push(`/produto/${produto.id}`)}
          >
            <Ionicons name="add-circle" size={22} color="#FFFFFF" />
          </PressableScale>
        </View>
      </View>
    </PressableScale>
  );
}

function CategoryCard({ icon, label, onPress }) {
  return (
    <PressableScale style={s.categoryCard} onPress={onPress}>
      <View style={s.categoryIconContainer}>
        <Ionicons name={icon} size={32} color="#C8321A" />
      </View>
      <Text style={s.categoryLabel}>{label}</Text>
    </PressableScale>
  );
}

const PRODUTOS_EXEMPLO = [
  {
    id: '1',
    nome: 'Batata de Hot Dog',
    descricao: 'Batata recheada, molho especial de salsicha, requeijão cremoso, mussarela, bacon, batata palha',
    preco: 'R$ 25,99',
    ranking: 1,
  },
  {
    id: '2',
    nome: 'Brócolis com Bacon',
    descricao: 'Batata recheada, molho especial com brócolis, bacon, requeijão, mussarela e batata palha',
    preco: 'R$ 26,99',
    ranking: 2,
  },
  {
    id: '3',
    nome: 'Calabresa Especial',
    descricao: 'Batata com molho cremoso de calabresa, requeijão cremoso, bacon e batata palha',
    preco: 'R$ 25,99',
    ranking: 3,
  },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HERO SECTION */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>Fome de Batata Top? 🍟</Text>
          <Text style={s.heroSub}>
            Batatas gigantes, recheios generosos e aquele sabor que só a batata top tem
          </Text>
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
          <PressableScale
            style={s.heroCta}
            onPress={() => router.push('/cardapio')}
          >
            <Text style={s.heroCtaText}>Ver Cardápio Completo</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </PressableScale>
        </View>

        {/* QUICK CATEGORIES */}
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

        {/* HIGHLIGHTS SECTION */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>As Mais Desejadas</Text>
            <Pressable onPress={() => router.push('/cardapio')}>
              <Text style={s.seeAllLink}>Ver todas →</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={s.loaderContainer}>
              <ActivityIndicator size="large" color="#C8321A" />
              <Text style={s.loaderText}>Carregando destaques...</Text>
            </View>
          ) : (
            PRODUTOS_EXEMPLO.map((p) => (
              <DestaqueCard key={p.id} produto={p} />
            ))
          )}
        </View>

        {/* PROMOTIONAL BANNER */}
        <View style={s.promoBanner}>
          <View style={s.promoBannerContent}>
            <Text style={s.promoBannerTitle}>Primeira Compra? 🎁</Text>
            <Text style={s.promoBannerDesc}>Ganhe 15% de desconto no seu primeiro pedido!</Text>
            <Pressable style={s.promoBannerBtn}>
              <Text style={s.promoBannerBtnText}>Aproveitar Oferta</Text>
            </Pressable>
          </View>
          <Ionicons name="gift" size={60} color="#F5A623" style={s.promoBannerIcon} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  scroll: {
    flex: 1,
  },
  hero: {
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: '#A3A3A3',
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    color: '#F5A623',
    fontWeight: '800',
    fontSize: 16,
  },
  heroStatLabel: {
    color: '#A3A3A3',
    fontSize: 11,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroCta: {
    backgroundColor: '#C8321A',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#C8321A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE6DC',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  seeAllLink: {
    color: '#C8321A',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  cardImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgPlaceholder: {
    fontSize: 80,
  },
  rankingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rankingText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cardInfo: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    gap: 6,
  },
  cardNome: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardDesc: {
    color: '#6B6B6B',
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPreco: {
    color: '#C8321A',
    fontWeight: '800',
    fontSize: 20,
  },
  addBtn: {
    backgroundColor: '#C8321A',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8321A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  promoBanner: {
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF5F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F5A623',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  promoBannerContent: {
    flex: 1,
  },
  promoBannerTitle: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  promoBannerDesc: {
    color: '#6B6B6B',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  promoBannerBtn: {
    backgroundColor: '#C8321A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  promoBannerBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  promoBannerIcon: {
    marginLeft: 12,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loaderText: {
    color: '#6B6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
});
