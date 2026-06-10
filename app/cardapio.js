import { View, Text, FlatList, Image, ScrollView, StyleSheet, Animated, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

// Wrapper to handle cascade fade-in and slide-up entrance animation for items
function AnimatedListItem({ children, index, trigger }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(15);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: Math.min(index * 60, 400), // Cap delay for long lists
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: Math.min(index * 60, 400),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, trigger]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function ProdutoCard({ produto }) {
  const router = useRouter();

  return (
    <PressableScale
      style={s.card}
      onPress={() => router.push(`/produto/${produto.id}`)}
    >
      <Image source={{ uri: produto.imagem }} style={s.cardImg} resizeMode="cover" />
      <View style={s.cardInfo}>
        <View style={s.cardHeader}>
          <Text style={s.cardNome} numberOfLines={1}>{produto.nome}</Text>
          <Text style={s.cardDesc} numberOfLines={2}>{produto.descricao}</Text>
        </View>
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

export default function Cardapio() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [listaProdutos, setListaProdutos] = useState(produtosLocais);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchSupabaseProducts();
        if (data && data.length > 0) {
          setListaProdutos(data);
        }
      } catch (err) {
        console.warn('Erro ao carregar cardápio do Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute categories dynamically from the loaded products
  const categoriasDisponiveis = [...new Set(listaProdutos.map((p) => p.categoria))];
  const todasCategorias = ['Todas', ...categoriasDisponiveis];
  const produtosFiltrados = categoriaAtiva === 'Todas' 
    ? listaProdutos 
    : listaProdutos.filter((p) => p.categoria === categoriaAtiva);

  return (
    <View style={s.container}>
      {/* PAGE HEADER */}
      <View style={s.pageHeader}>
        <PressableScale onPress={() => router.back()} style={s.backBtn}>
          <View style={s.backBtnRow}>
            <Ionicons name="chevron-back" size={18} color="#C8321A" />
            <Text style={s.backBtnText}>início</Text>
          </View>
        </PressableScale>
        <Text style={s.titulo}>Cardápio</Text>
      </View>

      {/* FILTER PILLS */}
      {!loading && (
        <View style={s.filtrosContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtrosContent}>
            {todasCategorias.map((cat) => {
              const ativo = cat === categoriaAtiva;
              return (
                <PressableScale
                  key={cat}
                  onPress={() => setCategoriaAtiva(cat)}
                  style={[s.filtroBtn, ativo ? s.filtroBtnAtivo : s.filtroBtnInativo]}
                >
                  <Text style={[s.filtroText, ativo ? s.filtroTextAtivo : s.filtroTextInativo]}>
                    {cat}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* PRODUCTS LIST OR LOADER */}
      {loading ? (
        <View style={s.loaderContainer}>
          <ActivityIndicator size="large" color="#C8321A" />
          <Text style={s.loaderText}>Carregando cardápio...</Text>
        </View>
      ) : (
        <FlatList
          data={produtosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index} trigger={categoriaAtiva}>
              <ProdutoCard produto={item} />
            </AnimatedListItem>
          )}
          contentContainerStyle={s.listaContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Nenhum produto encontrado</Text>
              <Text style={s.emptyDesc}>Por favor, selecione outra categoria.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -4,
  },
  backBtnText: {
    color: '#C8321A',
    fontSize: 14,
    fontWeight: '700',
  },
  titulo: {
    color: '#1A1A1A',
    fontWeight: '800',
    fontSize: 28,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  filtrosContainer: {
    marginVertical: 12,
    height: 42,
  },
  filtrosContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  filtroBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  filtroBtnAtivo: {
    backgroundColor: '#C8321A',
    borderColor: '#C8321A',
  },
  filtroBtnInativo: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE6DC',
  },
  filtroText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtroTextAtivo: {
    color: '#FFFFFF',
  },
  filtroTextInativo: {
    color: '#6B6B6B',
  },
  listaContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    flexDirection: 'row',
    overflow: 'hidden',
    height: 112,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  cardImg: {
    width: 110,
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    gap: 2,
  },
  cardNome: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardDesc: {
    color: '#6B6B6B',
    fontSize: 12,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPreco: {
    color: '#C8321A',
    fontWeight: '800',
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: '#C8321A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyDesc: {
    color: '#6B6B6B',
    fontSize: 14,
    marginTop: 4,
  },
  // Loader Styles
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    gap: 12,
  },
  loaderText: {
    color: '#6B6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
});
