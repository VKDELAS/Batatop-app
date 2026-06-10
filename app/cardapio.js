import { View, Text, FlatList, StyleSheet, Animated, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
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

const PRODUTOS = [
  {
    id: '1',
    nome: 'Batata de Hot Dog',
    descricao: 'Batata recheada, molho especial de salsicha, requeijão cremoso, mussarela, bacon, batata palha',
    preco: 'R$ 25,99',
    categoria: 'Batatas',
  },
  {
    id: '2',
    nome: 'Brócolis com Bacon',
    descricao: 'Batata recheada, molho especial com brócolis, bacon, requeijão, mussarela e batata palha',
    preco: 'R$ 26,99',
    categoria: 'Batatas',
  },
  {
    id: '3',
    nome: 'Calabresa Especial',
    descricao: 'Batata com molho cremoso de calabresa, requeijão cremoso, bacon e batata palha',
    preco: 'R$ 25,99',
    categoria: 'Batatas',
  },
  {
    id: '4',
    nome: 'Bolonhesa',
    descricao: 'Macarrão, molho vermelho com carne moída e queijo ralado',
    preco: 'R$ 27,99',
    categoria: 'Macarrão',
  },
  {
    id: '5',
    nome: 'Brócolis com Bacon Macarrão',
    descricao: 'Macarrão e molho com brócolis, bacon e queijo ralado',
    preco: 'R$ 27,99',
    categoria: 'Macarrão',
  },
  {
    id: '6',
    nome: 'Filé ao Alho Macarrão',
    descricao: 'Macarrão, molho especial de filé mignon, queijo ralado e alho frito',
    preco: 'R$ 29,99',
    categoria: 'Macarrão',
  },
];

function ProdutoCard({ produto }) {
  const router = useRouter();

  return (
    <PressableScale
      style={s.card}
      onPress={() => router.push(`/produto/${produto.id}`)}
    >
      <View style={s.cardImg}>
        <Text style={s.cardImgPlaceholder}>🍟</Text>
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

export default function Cardapio() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const categoriasDisponiveis = [...new Set(PRODUTOS.map((p) => p.categoria))];
  const todasCategorias = ['Todas', ...categoriasDisponiveis];
  
  let produtosFiltrados = categoriaAtiva === 'Todas' 
    ? PRODUTOS 
    : PRODUTOS.filter((p) => p.categoria === categoriaAtiva);

  if (searchQuery.trim()) {
    produtosFiltrados = produtosFiltrados.filter((p) =>
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <View style={s.container}>
      {/* PAGE HEADER */}
      <View style={s.pageHeader}>
        <View style={s.headerTop}>
          <PressableScale onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#C8321A" />
          </PressableScale>
          <Text style={s.titulo}>Cardápio</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* SEARCH BAR */}
        <View style={s.searchContainer}>
          <Ionicons name="search" size={20} color="#A3A3A3" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar produtos..."
            placeholderTextColor="#A3A3A3"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#A3A3A3" />
            </Pressable>
          )}
        </View>
      </View>

      {/* FILTER PILLS */}
      <View style={s.filtrosContainer}>
        <View style={s.filtrosContent}>
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
        </View>
      </View>

      {/* PRODUCTS LIST */}
      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProdutoCard produto={item} />
        )}
        contentContainerStyle={s.listaContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Ionicons name="search" size={48} color="#C8321A" />
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
    backgroundColor: '#F9F5F0',
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  titulo: {
    color: '#1A1A1A',
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#F9F5F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  filtrosContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  filtrosContent: {
    paddingHorizontal: 20,
    gap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filtroBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 13,
    fontWeight: '700',
  },
  filtroTextAtivo: {
    color: '#FFFFFF',
  },
  filtroTextInativo: {
    color: '#6B6B6B',
  },
  listaContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    flexDirection: 'row',
    overflow: 'hidden',
    height: 132,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImg: {
    width: 132,
    height: '100%',
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgPlaceholder: {
    fontSize: 56,
  },
  cardInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeader: {
    gap: 4,
  },
  cardNome: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 18,
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
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: '#C8321A',
    borderRadius: 11,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8321A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyDesc: {
    color: '#6B6B6B',
    fontSize: 13,
  },
});
