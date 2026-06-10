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
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATIONS } from '../constants/theme';
import { getProdutosPorCategoria, getCategorias, buscarProdutos, PRODUTOS } from '../data/produtos';

function PressableScale({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.95,
      duration: ANIMATIONS.fast,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: ANIMATIONS.normal,
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
 * Card de Produto com Imagem Real
 */
function ProdutoCard({ produto }) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <PressableScale
      style={s.card}
      onPress={() => router.push(`/produto/${produto.id}`)}
    >
      {/* Imagem com Skeleton Loading */}
      <View style={s.cardImgContainer}>
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

        {/* Badge de Avaliação */}
        <View style={s.ratingBadge}>
          <Ionicons name="star" size={12} color={COLORS.primary} />
          <Text style={s.ratingText}>{produto.avaliacoes}</Text>
        </View>
      </View>

      {/* Informações */}
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
            <View style={s.tempoContainer}>
              <Ionicons name="time" size={12} color={COLORS.textMuted} />
              <Text style={s.cardTempo}>{produto.tempo} min</Text>
            </View>
          </View>
          <PressableScale
            style={s.addBtn}
            onPress={() => router.push(`/produto/${produto.id}`)}
          >
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
          </PressableScale>
        </View>
      </View>
    </PressableScale>
  );
}

/**
 * Tela de Cardápio
 */
export default function Cardapio() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const categorias = getCategorias();

  // Filtrar produtos por categoria e busca
  let produtosFiltrados = getProdutosPorCategoria(categoriaAtiva);

  if (searchQuery.trim()) {
    produtosFiltrados = buscarProdutos(searchQuery);
  }

  return (
    <View style={s.container}>
      {/* ===== HEADER ===== */}
      <View style={s.pageHeader}>
        <View style={s.headerTop}>
          <PressableScale onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </PressableScale>
          <Text style={s.titulo}>Cardápio</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar produtos..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ===== FILTROS ===== */}
      <View style={s.filtrosContainer}>
        <View style={s.filtrosContent}>
          {categorias.map((cat) => {
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
        </View>
      </View>

      {/* ===== LISTA DE PRODUTOS ===== */}
      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProdutoCard produto={item} />}
        contentContainerStyle={s.listaContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Ionicons name="search" size={48} color={COLORS.primary} />
            <Text style={s.emptyTitle}>Nenhum produto encontrado</Text>
            <Text style={s.emptyDesc}>Tente outra busca ou categoria.</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ===== HEADER =====
  pageHeader: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[4],
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
  backBtn: {
    padding: SPACING[1],
  },
  titulo: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes['2xl'],
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
  },

  // ===== SEARCH BAR =====
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: SPACING[2],
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.text,
    paddingVertical: 0,
  },

  // ===== FILTROS =====
  filtrosContainer: {
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtrosContent: {
    paddingHorizontal: SPACING[5],
    gap: SPACING[2],
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filtroBtn: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  filtroBtnAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filtroBtnInativo: {
    backgroundColor: COLORS.backgroundCard,
    borderColor: COLORS.border,
  },
  filtroText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  filtroTextAtivo: {
    color: COLORS.text,
  },
  filtroTextInativo: {
    color: COLORS.textMuted,
  },

  // ===== LISTA =====
  listaContent: {
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
    gap: SPACING[3],
    paddingBottom: SPACING[10],
  },

  // ===== CARD DE PRODUTO =====
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
    height: 140,
    ...SHADOWS.md,
  },

  // ===== IMAGEM =====
  cardImgContainer: {
    position: 'relative',
    width: 140,
    height: '100%',
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
  ratingBadge: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
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
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.xs,
  },

  // ===== INFO =====
  cardInfo: {
    flex: 1,
    padding: SPACING[3],
    justifyContent: 'space-between',
  },
  cardHeader: {
    gap: SPACING[1],
  },
  cardNome: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
    lineHeight: 20,
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPreco: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  tempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginTop: SPACING[1],
  },
  cardTempo: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  addBtn: {
    backgroundColor: 'transparent',
    borderRadius: RADIUS.lg,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== EMPTY STATE =====
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING[16],
    gap: SPACING[3],
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sizes.base,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
