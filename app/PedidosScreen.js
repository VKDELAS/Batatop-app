import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { usePedidos } from './hooks/usePedidos';

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const STATUS_COLORS = {
  pending: '#FF9800',
  confirmed: '#2196F3',
  preparing: '#9C27B0',
  ready: '#4CAF50',
  delivered: '#4CAF50',
  cancelled: '#f44336',
};

export default function PedidosScreen() {
  const { buscarPedidos, loading, error } = usePedidos();
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [telefone, setTelefone] = useState('');
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    setBuscando(true);
    const resultado = await buscarPedidos({
      limit: 50,
    });

    if (resultado.success) {
      setPedidos(resultado.data);
    } else {
      Alert.alert('Erro', 'Falha ao carregar pedidos');
    }
    setBuscando(false);
  };

  const buscarPorTelefone = async () => {
    if (!telefone.trim()) {
      Alert.alert('Erro', 'Digite um telefone para buscar');
      return;
    }

    setBuscando(true);
    const resultado = await buscarPedidos({
      customer_phone: telefone,
    });

    if (resultado.success) {
      setPedidos(resultado.data);
    } else {
      Alert.alert('Erro', 'Falha ao buscar pedidos');
    }
    setBuscando(false);
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtroStatus === 'todos') return true;
    return pedido.status === filtroStatus;
  });

  const renderPedido = ({ item }) => (
    <View style={styles.cardPedido}>
      <View style={styles.headerPedido}>
        <View>
          <Text style={styles.numeroPedido}>Pedido #{item.order_number}</Text>
          <Text style={styles.dataPedido}>
            {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] },
          ]}
        >
          <Text style={styles.statusTexto}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>

      <View style={styles.infoPedido}>
        <Text style={styles.labelInfo}>Cliente:</Text>
        <Text style={styles.valorInfo}>{item.customer_name}</Text>

        <Text style={styles.labelInfo}>Telefone:</Text>
        <Text style={styles.valorInfo}>{item.customer_phone}</Text>

        <Text style={styles.labelInfo}>Endereço:</Text>
        <Text style={styles.valorInfo}>{item.customer_address}</Text>

        {item.customer_neighborhood && (
          <>
            <Text style={styles.labelInfo}>Bairro:</Text>
            <Text style={styles.valorInfo}>{item.customer_neighborhood}</Text>
          </>
        )}

        <Text style={styles.labelInfo}>Método de Pagamento:</Text>
        <Text style={styles.valorInfo}>
          {item.payment_method.charAt(0).toUpperCase() + item.payment_method.slice(1)}
        </Text>

        <Text style={styles.labelInfo}>Tipo de Entrega:</Text>
        <Text style={styles.valorInfo}>
          {item.delivery_type === 'delivery' ? 'Delivery' : 'Retirada'}
        </Text>
      </View>

      {item.metadata?.items && item.metadata.items.length > 0 && (
        <View style={styles.itensContainer}>
          <Text style={styles.tituloItens}>Itens do Pedido:</Text>
          {item.metadata.items.map((itemPedido, index) => (
            <View key={index} style={styles.itemPedido}>
              <Text style={styles.nomeItemPedido}>{itemPedido.nome}</Text>
              <Text style={styles.qtdItemPedido}>
                Qtd: {itemPedido.quantidade}
              </Text>
              <Text style={styles.precoItemPedido}>
                R$ {(itemPedido.preco * itemPedido.quantidade).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.totalContainer}>
        {item.discount_amount > 0 && (
          <View style={styles.linhaTotal}>
            <Text style={styles.labelTotal}>Desconto:</Text>
            <Text style={styles.valorDesconto}>
              -R$ {item.discount_amount.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        )}
        <View style={styles.linhaTotal}>
          <Text style={styles.labelTotal}>Total:</Text>
          <Text style={styles.valorTotal}>
            R$ {item.total_amount.toFixed(2).replace('.', ',')}
          </Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notasContainer}>
          <Text style={styles.labelNotas}>Observações:</Text>
          <Text style={styles.notasTexto}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Busca por telefone */}
      <View style={styles.buscaContainer}>
        <Text style={styles.tituloBusca}>Buscar Pedidos</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite seu telefone"
            placeholderTextColor="#999"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={styles.botaoBuscar}
            onPress={buscarPorTelefone}
            disabled={buscando}
          >
            <Text style={styles.textoBotaoBuscar}>
              {buscando ? '...' : 'Buscar'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.botaoLimpar}
          onPress={() => {
            setTelefone('');
            carregarPedidos();
          }}
        >
          <Text style={styles.textoLimpar}>Limpar filtro</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de status */}
      <FlatList
        horizontal
        data={['todos', 'pending', 'confirmed', 'preparing', 'ready', 'delivered']}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.botaoFiltro,
              filtroStatus === item && styles.botaoFiltroAtivo,
            ]}
            onPress={() => setFiltroStatus(item)}
          >
            <Text
              style={[
                styles.textoFiltro,
                filtroStatus === item && styles.textoFiltroAtivo,
              ]}
            >
              {item === 'todos' ? 'Todos' : STATUS_LABELS[item]}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrosContent}
        style={styles.filtrosContainer}
      />

      {/* Lista de pedidos */}
      {buscando || loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando pedidos...</Text>
        </View>
      ) : pedidosFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={pedidosFiltrados}
          renderItem={renderPedido}
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tituloBusca: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#333',
  },
  botaoBuscar: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center',
  },
  textoBotaoBuscar: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  botaoLimpar: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  textoLimpar: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  filtrosContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtrosContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botaoFiltro: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  botaoFiltroAtivo: {
    backgroundColor: '#FF6B35',
  },
  textoFiltro: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  textoFiltroAtivo: {
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
  cardPedido: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerPedido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  numeroPedido: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dataPedido: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoPedido: {
    marginBottom: 12,
  },
  labelInfo: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 8,
  },
  valorInfo: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  itensContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tituloItens: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemPedido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nomeItemPedido: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  qtdItemPedido: {
    fontSize: 11,
    color: '#999',
    marginHorizontal: 8,
  },
  precoItemPedido: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  totalContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  linhaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  valorTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  valorDesconto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  notasContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
  },
  labelNotas: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  notasTexto: {
    fontSize: 12,
    color: '#666',
  },
});
