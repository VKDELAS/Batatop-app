import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { useProdutos, useProdutosPorCategoria, useBuscarProdutos } from './hooks/useProdutos';

const CATEGORIAS = ['Todas', 'batata', 'macarrao'];

export default function CardapioScreen({ navigation }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarBusca, setMostrarBusca] = useState(false);

  // Usar hook apropriado baseado na situação
  const { produtos: todosProdutos, loading: loadingTodos } = useProdutos();
  const { produtos: produtosPorCategoria, loading: loadingCategoria } =
    useProdutosPorCategoria(categoriaAtiva);
  const { produtos: produtosBuscados, loading: loadingBusca } = useBuscarProdutos(termoBusca);

  // Determinar qual lista mostrar
  let produtosExibir = [];
  let loading = false;

  if (termoBusca.trim().length > 0) {
    produtosExibir = produtosBuscados;
    loading = loadingBusca;
  } else if (categoriaAtiva === 'Todas') {
    produtosExibir = todosProdutos;
    loading = loadingTodos;
  } else {
    produtosExibir = produtosPorCategoria;
    loading = loadingCategoria;
  }

  const handleProdutoPress = useCallback(
    (produto) => {
      navigation.navigate('produto', { id: produto.id });
    },
    [navigation]
  );

  const renderProdutoCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleProdutoPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.imagem }} style={styles.imagem} />
      <View style={styles.cardContent}>
        <Text style={styles.nomeProduto} numberOfLines={2}>
          {item.nome}
        </Text>
        <Text style={styles.descricao} numberOfLines={2}>
          {item.descricao}
        </Text>
        <View style={styles.rodapeCard}>
          <Text style={styles.preco}>{item.precoFormatado}</Text>
          <View style={styles.avaliacoes}>
            <Text style={styles.estrelas}>⭐ {item.avaliacoes}</Text>
            <Text style={styles.tempo}>{item.tempo}min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoria = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.botaoCategoria,
        categoriaAtiva === item && styles.botaoCategoriaAtiva,
      ]}
      onPress={() => {
        setCategoriaAtiva(item);
        setTermoBusca('');
      }}
    >
      <Text
        style={[
          styles.textoCategoria,
          categoriaAtiva === item && styles.textoCategoriaAtiva,
        ]}
      >
        {item.charAt(0).toUpperCase() + item.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barra de busca */}
      <View style={styles.buscaContainer}>
        <TextInput
          style={styles.inputBusca}
          placeholder="Buscar produtos..."
          placeholderTextColor="#999"
          value={termoBusca}
          onChangeText={setTermoBusca}
        />
      </View>

      {/* Categorias - só mostrar se não estiver buscando */}
      {termoBusca.trim().length === 0 && (
        <FlatList
          horizontal
          data={CATEGORIAS}
          renderItem={renderCategoria}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={styles.categoriasList}
          contentContainerStyle={styles.categoriasContent}
        />
      )}

      {/* Lista de produtos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : produtosExibir.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={produtosExibir}
          renderItem={renderProdutoCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  buscaContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inputBusca: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  categoriasList: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriasContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  botaoCategoria: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  botaoCategoriaAtiva: {
    backgroundColor: '#FF6B35',
  },
  textoCategoria: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  textoCategoriaAtiva: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imagem: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  nomeProduto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  descricao: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  rodapeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preco: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  avaliacoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  estrelas: {
    fontSize: 12,
    color: '#666',
  },
  tempo: {
    fontSize: 12,
    color: '#999',
  },
});
