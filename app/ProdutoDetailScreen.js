import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useProdutoById } from './hooks/useProdutos';
import { useCart } from './context/CartContext';

export default function ProdutoDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { produto, loading, error } = useProdutoById(id);
  const { addToCart } = useCart();
  const [quantidade, setQuantidade] = useState(1);

  const handleAdicionar = () => {
    if (!produto) return;

    addToCart({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      quantidade,
    });

    Alert.alert('Sucesso', `${produto.nome} adicionado ao carrinho!`, [
      {
        text: 'Continuar comprando',
        onPress: () => navigation.goBack(),
      },
      {
        text: 'Ir para carrinho',
        onPress: () => navigation.navigate('cart'),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando produto...</Text>
      </View>
    );
  }

  if (error || !produto) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao carregar produto</Text>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoBotaoVoltar}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Imagem do produto */}
      <Image source={{ uri: produto.imagem }} style={styles.imagem} />

      {/* Informações do produto */}
      <View style={styles.infoContainer}>
        <Text style={styles.nome}>{produto.nome}</Text>

        {/* Avaliações */}
        <View style={styles.avaliacoes}>
          <Text style={styles.estrelas}>⭐ {produto.avaliacoes}</Text>
          <Text style={styles.avaliacoesCount}>({produto.avaliacoesCount} avaliações)</Text>
          <Text style={styles.tempo}>⏱️ {produto.tempo}min</Text>
        </View>

        {/* Descrição longa */}
        <Text style={styles.descricao}>{produto.descricaoLonga}</Text>

        {/* Preço */}
        <View style={styles.precoContainer}>
          <Text style={styles.preco}>{produto.precoFormatado}</Text>
          {!produto.disponivel && (
            <Text style={styles.indisponivel}>Indisponível</Text>
          )}
        </View>

        {/* Categoria */}
        <View style={styles.categoriaContainer}>
          <Text style={styles.categoriaTitulo}>Categoria:</Text>
          <Text style={styles.categoriaTexto}>
            {produto.categoria.charAt(0).toUpperCase() + produto.categoria.slice(1)}
          </Text>
        </View>

        {/* Seletor de quantidade */}
        <View style={styles.quantidadeContainer}>
          <Text style={styles.quantidadeTitulo}>Quantidade:</Text>
          <View style={styles.quantidadeSelector}>
            <TouchableOpacity
              style={styles.botaoQtd}
              onPress={() => setQuantidade(Math.max(1, quantidade - 1))}
            >
              <Text style={styles.textoBotaoQtd}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantidadeTexto}>{quantidade}</Text>
            <TouchableOpacity
              style={styles.botaoQtd}
              onPress={() => setQuantidade(quantidade + 1)}
            >
              <Text style={styles.textoBotaoQtd}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botão adicionar ao carrinho */}
        <TouchableOpacity
          style={[
            styles.botaoAdicionar,
            !produto.disponivel && styles.botaoAdicionarDesabilitado,
          ]}
          onPress={handleAdicionar}
          disabled={!produto.disponivel}
        >
          <Text style={styles.textoBotaoAdicionar}>
            Adicionar ao Carrinho
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  botaoVoltar: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoBotaoVoltar: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagem: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16,
  },
  nome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  avaliacoes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  estrelas: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  avaliacoesCount: {
    fontSize: 12,
    color: '#999',
  },
  tempo: {
    fontSize: 12,
    color: '#666',
  },
  descricao: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  precoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  preco: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  indisponivel: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: 'bold',
  },
  categoriaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriaTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
  },
  categoriaTexto: {
    fontSize: 12,
    color: '#999',
  },
  quantidadeContainer: {
    marginBottom: 20,
  },
  quantidadeTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  quantidadeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: 120,
  },
  botaoQtd: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  textoBotaoQtd: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  quantidadeTexto: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  botaoAdicionar: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  botaoAdicionarDesabilitado: {
    backgroundColor: '#ccc',
  },
  textoBotaoAdicionar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
