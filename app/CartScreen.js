import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { useCart } from './context/CartContext';
import { usePedidos } from './hooks/usePedidos';

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const { criarPedido, loading: loadingPedido } = usePedidos();

  const [cupom, setCupom] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [complemento, setComplemento] = useState('');
  const [metodo, setMetodo] = useState('dinheiro');
  const [tipoEntrega, setTipoEntrega] = useState('delivery');

  const total = getTotal();
  const totalComDesconto = Math.max(0, total - desconto);

  const aplicarCupom = () => {
    // Exemplo de cupom válido
    if (cupom.toUpperCase() === 'BIA10') {
      const descontoCalculado = total * 0.1;
      setDesconto(descontoCalculado);
      Alert.alert('Sucesso', `Cupom aplicado! Desconto de R$ ${descontoCalculado.toFixed(2)}`);
    } else {
      Alert.alert('Erro', 'Cupom inválido');
    }
  };

  const finalizarPedido = async () => {
    if (!nomeCliente.trim()) {
      Alert.alert('Erro', 'Por favor, preencha seu nome');
      return;
    }
    if (!telefone.trim()) {
      Alert.alert('Erro', 'Por favor, preencha seu telefone');
      return;
    }
    if (tipoEntrega === 'delivery' && !endereco.trim()) {
      Alert.alert('Erro', 'Por favor, preencha seu endereço');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Erro', 'Seu carrinho está vazio');
      return;
    }

    const pedidoData = {
      customer_name: nomeCliente,
      customer_phone: telefone,
      customer_address: tipoEntrega === 'delivery' ? endereco : 'Retirada na loja',
      customer_neighborhood: bairro || 'N/A',
      customer_complement: complemento,
      payment_method: metodo,
      total_amount: totalComDesconto,
      discount_amount: desconto,
      coupon_code: cupom || null,
      items: cart,
      delivery_type: tipoEntrega,
      notes: '',
    };

    const resultado = await criarPedido(pedidoData);

    if (resultado.success) {
      Alert.alert('Sucesso', `Pedido criado! Número: ${resultado.data.order_number}`, [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            navigation.navigate('pedidos');
          },
        },
      ]);
    } else {
      Alert.alert('Erro', `Falha ao criar pedido: ${resultado.error}`);
    }
  };

  const renderItemCarrinho = ({ item }) => (
    <View style={styles.itemCarrinho}>
      <Image source={{ uri: item.imagem }} style={styles.imagemItem} />
      <View style={styles.infoItem}>
        <Text style={styles.nomeItem}>{item.nome}</Text>
        <Text style={styles.precoItem}>{`R$ ${item.preco.toFixed(2).replace('.', ',')}`}</Text>
      </View>
      <View style={styles.quantidadeContainer}>
        <TouchableOpacity
          onPress={() => updateQuantity(item.id, item.quantidade - 1)}
          style={styles.botaoQtd}
        >
          <Text style={styles.textoBotaoQtd}>−</Text>
        </TouchableOpacity>
        <Text style={styles.quantidadeTexto}>{item.quantidade}</Text>
        <TouchableOpacity
          onPress={() => updateQuantity(item.id, item.quantidade + 1)}
          style={styles.botaoQtd}
        >
          <Text style={styles.textoBotaoQtd}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => removeFromCart(item.id)}
        style={styles.botaoRemover}
      >
        <Text style={styles.textoRemover}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={styles.containerVazio}>
        <Text style={styles.textoVazio}>Seu carrinho está vazio</Text>
        <TouchableOpacity
          style={styles.botaoContinuar}
          onPress={() => navigation.navigate('cardapio')}
        >
          <Text style={styles.textoBotaoContinuar}>Continuar comprando</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={cart}
      renderItem={renderItemCarrinho}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.headerCarrinho}>
          <Text style={styles.tituloCarrinho}>Seu Carrinho</Text>
        </View>
      }
      ListFooterComponent={
        <View style={styles.footerCarrinho}>
          {/* Cupom */}
          <View style={styles.secaoCupom}>
            <Text style={styles.tituloSecao}>Cupom de Desconto</Text>
            <View style={styles.inputCupomContainer}>
              <TextInput
                style={styles.inputCupom}
                placeholder="Digite seu cupom"
                placeholderTextColor="#999"
                value={cupom}
                onChangeText={setCupom}
              />
              <TouchableOpacity style={styles.botaoAplicarCupom} onPress={aplicarCupom}>
                <Text style={styles.textoAplicarCupom}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dados do cliente */}
          <View style={styles.secaoDados}>
            <Text style={styles.tituloSecao}>Dados de Entrega</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor="#999"
              value={nomeCliente}
              onChangeText={setNomeCliente}
            />

            <TextInput
              style={styles.input}
              placeholder="Telefone"
              placeholderTextColor="#999"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />

            {/* Tipo de entrega */}
            <View style={styles.tipoEntregaContainer}>
              <TouchableOpacity
                style={[
                  styles.botaoTipoEntrega,
                  tipoEntrega === 'delivery' && styles.botaoTipoEntregaAtivo,
                ]}
                onPress={() => setTipoEntrega('delivery')}
              >
                <Text
                  style={[
                    styles.textoTipoEntrega,
                    tipoEntrega === 'delivery' && styles.textoTipoEntregaAtivo,
                  ]}
                >
                  Delivery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.botaoTipoEntrega,
                  tipoEntrega === 'pickup' && styles.botaoTipoEntregaAtivo,
                ]}
                onPress={() => setTipoEntrega('pickup')}
              >
                <Text
                  style={[
                    styles.textoTipoEntrega,
                    tipoEntrega === 'pickup' && styles.textoTipoEntregaAtivo,
                  ]}
                >
                  Retirada
                </Text>
              </TouchableOpacity>
            </View>

            {tipoEntrega === 'delivery' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Endereço"
                  placeholderTextColor="#999"
                  value={endereco}
                  onChangeText={setEndereco}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Bairro"
                  placeholderTextColor="#999"
                  value={bairro}
                  onChangeText={setBairro}
                />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Complemento (opcional)"
              placeholderTextColor="#999"
              value={complemento}
              onChangeText={setComplemento}
            />
          </View>

          {/* Método de pagamento */}
          <View style={styles.secaoPagamento}>
            <Text style={styles.tituloSecao}>Método de Pagamento</Text>
            <View style={styles.metodosContainer}>
              {['dinheiro', 'cartao', 'pix'].map((metodoOpcao) => (
                <TouchableOpacity
                  key={metodoOpcao}
                  style={[
                    styles.botaoMetodo,
                    metodo === metodoOpcao && styles.botaoMetodoAtivo,
                  ]}
                  onPress={() => setMetodo(metodoOpcao)}
                >
                  <Text
                    style={[
                      styles.textoMetodo,
                      metodo === metodoOpcao && styles.textoMetodoAtivo,
                    ]}
                  >
                    {metodoOpcao.charAt(0).toUpperCase() + metodoOpcao.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Resumo do pedido */}
          <View style={styles.resumoPedido}>
            <View style={styles.linhaResumo}>
              <Text style={styles.textoResumo}>Subtotal:</Text>
              <Text style={styles.valorResumo}>{`R$ ${total.toFixed(2).replace('.', ',')}`}</Text>
            </View>
            {desconto > 0 && (
              <View style={styles.linhaResumo}>
                <Text style={styles.textoResumo}>Desconto:</Text>
                <Text style={styles.valorDesconto}>{`-R$ ${desconto.toFixed(2).replace('.', ',')}`}</Text>
              </View>
            )}
            <View style={[styles.linhaResumo, styles.linhaTotal]}>
              <Text style={styles.textoTotal}>Total:</Text>
              <Text style={styles.valorTotal}>{`R$ ${totalComDesconto.toFixed(2).replace('.', ',')}`}</Text>
            </View>
          </View>

          {/* Botão finalizar */}
          <TouchableOpacity
            style={[styles.botaoFinalizar, loadingPedido && styles.botaoFinalizarDesabilitado]}
            onPress={finalizarPedido}
            disabled={loadingPedido}
          >
            <Text style={styles.textoFinalizar}>
              {loadingPedido ? 'Processando...' : 'Finalizar Pedido'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoContinuarCompras}
            onPress={() => navigation.navigate('cardapio')}
          >
            <Text style={styles.textoContinuarCompras}>Continuar Comprando</Text>
          </TouchableOpacity>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  containerVazio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  textoVazio: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  botaoContinuar: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoBotaoContinuar: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  headerCarrinho: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  tituloCarrinho: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCarrinho: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imagemItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  infoItem: {
    flex: 1,
  },
  nomeItem: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  precoItem: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  quantidadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginRight: 8,
  },
  botaoQtd: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  textoBotaoQtd: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  quantidadeTexto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 6,
  },
  botaoRemover: {
    padding: 4,
  },
  textoRemover: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: 'bold',
  },
  footerCarrinho: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  secaoCupom: {
    marginBottom: 20,
  },
  tituloSecao: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inputCupomContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  inputCupom: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#333',
  },
  botaoAplicarCupom: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center',
  },
  textoAplicarCupom: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  secaoDados: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
  },
  tipoEntregaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  botaoTipoEntrega: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  botaoTipoEntregaAtivo: {
    backgroundColor: '#FF6B35',
  },
  textoTipoEntrega: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  textoTipoEntregaAtivo: {
    color: '#fff',
  },
  secaoPagamento: {
    marginBottom: 20,
  },
  metodosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoMetodo: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  botaoMetodoAtivo: {
    backgroundColor: '#FF6B35',
  },
  textoMetodo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  textoMetodoAtivo: {
    color: '#fff',
  },
  resumoPedido: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  linhaResumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  textoResumo: {
    fontSize: 12,
    color: '#666',
  },
  valorResumo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  valorDesconto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  linhaTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTopMargin: 8,
    marginTop: 8,
    paddingTop: 8,
  },
  textoTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  valorTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  botaoFinalizar: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  botaoFinalizarDesabilitado: {
    backgroundColor: '#ccc',
  },
  textoFinalizar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botaoContinuarCompras: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  textoContinuarCompras: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
