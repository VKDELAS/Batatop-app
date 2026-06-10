import { View, Text, ScrollView, Image, StyleSheet, Animated, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { fetchSupabaseProducts, produtosLocais } from '../data/produtos';

// Helper component for premium bouncy scale feedback on touch
function PressableScale({ children, onPress, style, activeOpacity = 0.95 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: activeOpacity,
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

// Card for featured ranked products
function DestaqueCard({ produto }) {
  const router = useRouter();

  const getRankingLabel = (rank) => {
    if (rank === 1) return 'Nº1 MAIS PEDIDA';
    return `Nº${rank}`;
  };

  return (
    <PressableScale
      style={s.card}
      onPress={() => router.push(`/produto/${produto.id}`)}
    >
      <View style={s.cardImageWrapper}>
        <Image source={{ uri: produto.imagem }} style={s.cardImg} resizeMode="cover" />
        <View style={s.rankingBadge}>
          <Text style={s.rankingText}>{getRankingLabel(produto.ranking)}</Text>
        </View>
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardNome}>{produto.nome}</Text>
        <Text style={s.cardDesc}>{produto.descricao}</Text>
        <View style={s.cardFooter}>
          <Text style={s.cardPreco}>{produto.preco}</Text>
          <PressableScale
            style={s.addBtn}
            onPress={() => router.push(`/produto/${produto.id}`)}
          >
            <Text style={s.addBtnText}>Adicionar</Text>
          </PressableScale>
        </View>
      </View>
    </PressableScale>
  );
}

export default function Home() {
  const router = useRouter();
  const [listaProdutos, setListaProdutos] = useState(produtosLocais);
  const [loading, setLoading] = useState(true);

  // Splash Screen animation states
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const splashFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Fade-in and scale-up the logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Async load Supabase products (running in background during splash screen)
    async function loadData() {
      try {
        const data = await fetchSupabaseProducts();
        if (data && data.length > 0) {
          setListaProdutos(data);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Phase 2: Fade-out the overlay to reveal the main screen
    const timer = setTimeout(() => {
      Animated.timing(splashFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // Filter out featured products (top 3)
  const destaques = listaProdutos
    .filter((p) => p.destaque && p.ranking !== null)
    .sort((a, b) => a.ranking - b.ranking);

  return (
    <View style={s.container}>
      {/* CUSTOM SPLASH SCREEN */}
      {showSplash && (
        <Animated.View style={[s.splashOverlay, { opacity: splashFadeAnim }]} pointerEvents="none">
          <View style={s.splashContent}>
            <Animated.Image
              source={{ uri: 'https://batatop.vercel.app/logo.png' }}
              style={[s.splashLogo, { transform: [{ scale: scaleAnim }] }]}
              resizeMode="contain"
            />
            <Animated.Text style={[s.splashTitle, { opacity: fadeAnim }]}>
              batata top
            </Animated.Text>
          </View>
        </Animated.View>
      )}

      {/* MAIN HOME CONTENT */}
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HERO */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>As Mais Desejadas</Text>
          <Text style={s.heroSub}>
            Selecionamos as combinações que fazem mais sucesso em Iacanga. Qual vai ser a sua hoje?
          </Text>
          <PressableScale
            style={s.heroCta}
            onPress={() => router.push('/cardapio')}
          >
            <Text style={s.heroCtaText}>Ver cardápio completo</Text>
          </PressableScale>
        </View>

        {/* HIGHLIGHTS SECTION */}
        <View style={s.section}>
          {loading ? (
            <View style={s.loaderContainer}>
              <ActivityIndicator size="large" color="#C8321A" />
              <Text style={s.loaderText}>Carregando destaques...</Text>
            </View>
          ) : (
            destaques.map((p) => (
              <DestaqueCard key={p.id} produto={p} />
            ))
          )}
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
  // Splash Screen Styles
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111111',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  splashTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  // Hero Styles
  hero: {
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  heroCta: {
    backgroundColor: '#C8321A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Highlights Styles
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  rankingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rankingText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  cardInfo: {
    padding: 16,
  },
  cardNome: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
  },
  cardDesc: {
    color: '#6B6B6B',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPreco: {
    color: '#C8321A',
    fontWeight: '800',
    fontSize: 18,
  },
  addBtn: {
    backgroundColor: '#C8321A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // Loader Styles
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
