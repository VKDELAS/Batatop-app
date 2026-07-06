import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseConfig';
import { useCart } from '../../utils/cartStore';
import { COLORS, SHADOWS, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://eucwoxjmjfqylyrqunwk.supabase.co';
const SUPABASE_STORAGE = `${SUPABASE_URL}/storage/v1/object/public/Products/`;

const CATEGORY_FALLBACKS = {
  batatas: 'https://images.unsplash.com/photo-1518013391915-e40643a1bce1?w=800',
  bebidas: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?w=800',
  macarrao: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
};

function resolveImage(imageUrl, categoria) {
  if (imageUrl) {
    if (imageUrl.startsWith('http')) return { uri: imageUrl };
    return { uri: SUPABASE_STORAGE + imageUrl.replace(/^\/products\//, '') };
  }
  const fallback = CATEGORY_FALLBACKS[categoria?.toLowerCase()] ||
    'https://images.unsplash.com/photo-1518013391915-e40643a1bce1?w=800';
  return { uri: fallback };
}

export default function ProdutoDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { add: addToCart } = useCart();

  const [produto, setProduto] = useState(null);
  const [adicionais, setAdicionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  // { [adicionalId]: quantidade (0 = não selecionado) }
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState({});
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (id) {
      fetchProduto();
      fetchAdicionais();
    }
  }, [id]);

  const fetchProduto = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setProduto({
        id: data.id,
        nome: data.name,
        descricao: data.description,
        preco: data.price,
        precoFormatado: `R$ ${data.price.toFixed(2).replace('.', ',')}`,
        categoria: data.category,
        imagem: data.image_url,
        disponivel: data.available,
      });
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      Alert.alert('Erro', 'Não foi possível carregar o produto');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdicionais = async () => {
    try {
      const { data, error } = await supabase
        .from('adicionais')
        .select('*')
        .eq('available', true);

      if (error) throw error;
      setAdicionais(data || []);
    } catch (err) {
      console.error('Erro ao buscar adicionais:', err);
    }
  };

  const incrementAdicional = (adicionalId) => {
    setAdicionaisSelecionados((prev) => ({
      ...prev,
      [adicionalId]: (prev[adicionalId] || 0) + 1,
    }));
  };

  const decrementAdicional = (adicionalId) => {
    setAdicionaisSelecionados((prev) => {
      const current = prev[adicionalId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[adicionalId];
        return next;
      }
      return { ...prev, [adicionalId]: current - 1 };
    });
  };

  const totalAdicionais = adicionais.reduce((acc, item) => {
    const qty = adicionaisSelecionados[item.id] || 0;
    return acc + item.price * qty;
  }, 0);

  const calcularPrecoTotal = () => {
    if (!produto) return 0;
    return (produto.preco + totalAdicionais) * quantidade;
  };

  const formatPreco = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAdicionarAoCarrinho = () => {
    if (!produto) return;

    // Expande adicionais com quantidade > 0, repetindo o item conforme qty
    const adicionaisList = adicionais
      .filter((a) => (adicionaisSelecionados[a.id] || 0) > 0)
      .flatMap((a) =>
        Array.from({ length: adicionaisSelecionados[a.id] }, () => a)
      );

    const precoTotalItem = produto.preco + totalAdicionais;

    addToCart({
      id: produto.id,
      nome: produto.nome,
      preco: `R$ ${precoTotalItem.toFixed(2).replace('.', ',')}`,
      precoNum: precoTotalItem * 100,
      imagem: produto.imagem,
      quantidade,
      adicionais: adicionaisList,
      observacoes,
    });

    router.back();
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!produto) {
    return (
      <View style={s.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={s.errorText}>Produto não encontrado</Text>
        <Pressable style={s.btnVoltar} onPress={() => router.back()}>
          <Text style={s.btnVoltarText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* Imagem hero */}
        <View style={s.imageContainer}>
          <Image
            source={resolveImage(produto.imagem, produto.categoria)}
            style={s.image}
            resizeMode="cover"
            onError={() => setUseFallback(true)}
          />
          <View style={s.overlay} />

          {/* Botao fechar */}
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>

          {/* Nome sobre a imagem */}
          <Text style={s.titulo}>{produto.nome}</Text>
        </View>

        {/* Conteudo */}
        <View style={s.content}>

          {/* Descricao e preco */}
          <Text style={s.descricao}>{produto.descricao}</Text>
          <Text style={s.precoPrincipal}>{produto.precoFormatado}</Text>

          {/* Adicionais */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Adicionais</Text>
            <View style={s.opcionalBadge}>
              <Text style={s.opcionalText}>OPCIONAL</Text>
            </View>
          </View>

          {adicionais.length === 0 ? (
            <Text style={s.semAdicionais}>Nenhum adicional disponível</Text>
          ) : (
            adicionais.map((item) => {
              const qty = adicionaisSelecionados[item.id] || 0;
              return (
                <View key={item.id} style={s.adicionalItem}>
                  <View style={s.adicionalInfo}>
                    <Text style={s.adicionalNome}>{item.name}</Text>
                    <Text style={s.adicionalPreco}>
                      + R$ {item.price.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                  <View style={s.adicionalQtyContainer}>
                    {qty > 0 && (
                      <TouchableOpacity
                        style={s.qtyAdicionalBtn}
                        onPress={() => decrementAdicional(item.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="remove" size={16} color="#333" />
                      </TouchableOpacity>
                    )}
                    {qty > 0 && (
                      <Text style={s.qtyAdicionalText}>{qty}</Text>
                    )}
                    <TouchableOpacity
                      style={[s.addBtn, qty > 0 && s.addBtnSelected]}
                      onPress={() => incrementAdicional(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={18} color={qty > 0 ? '#fff' : '#333'} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Observacoes */}
          <View style={[s.sectionHeader, { marginTop: 8 }]}>
            <Text style={s.sectionTitle}>Observações</Text>
          </View>
          <TextInput
            style={s.inputObs}
            placeholder="Ex: sem cebola, maionese à parte..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            value={observacoes}
            onChangeText={setObservacoes}
          />
        </View>
      </ScrollView>

      {/* Footer fixo */}
      <View style={s.footer}>
        <View style={s.quantidadeContainer}>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => setQuantidade(Math.max(1, quantidade - 1))}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={s.quantidadeText}>{quantidade}</Text>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => setQuantidade(quantidade + 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.botaoAdicionar} onPress={handleAdicionarAoCarrinho} activeOpacity={0.85}>
          <Ionicons name="cart-outline" size={20} color="#333" style={{ marginRight: 8 }} />
          <Text style={s.botaoAdicionarText}>Adicionar</Text>
          <Text style={s.botaoAdicionarPreco}>{formatPreco(calcularPrecoTotal())}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: COLORS.textSecondary },
  btnVoltar: { backgroundColor: '#FFB800', paddingHorizontal: 30, paddingVertical: 12, borderRadius: RADIUS.lg, marginTop: 8 },
  btnVoltarText: { color: '#333', fontWeight: 'bold', fontSize: 15 },

  // Imagem
  imageContainer: { width, height: 260, position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)' },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 18,
    backgroundColor: '#fff',
    borderRadius: 99,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  titulo: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 60,
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Conteudo
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: 24,
  },
  descricao: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  precoPrincipal: { color: '#FFB800', fontSize: 22, fontWeight: '800', marginBottom: 24 },

  // Secoes
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  opcionalBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  opcionalText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  semAdicionais: { color: COLORS.textMuted, fontSize: 14, marginBottom: 16 },

  // Adicionais
  adicionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...SHADOWS.sm,
  },
  adicionalInfo: { flex: 1 },
  adicionalNome: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  adicionalPreco: { fontSize: 13, color: '#FFB800', marginTop: 2 },
  adicionalQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyAdicionalBtn: {
    width: 30,
    height: 30,
    borderRadius: 99,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyAdicionalText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 18,
    textAlign: 'center',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnSelected: { backgroundColor: '#FFB800' },

  // Observacoes
  inputObs: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: RADIUS.lg,
    padding: 14,
    height: 80,
    textAlignVertical: 'top',
    color: COLORS.text,
    fontSize: 14,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quantidadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 10,
  },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  quantidadeText: { fontSize: 16, fontWeight: '700', color: COLORS.text, minWidth: 22, textAlign: 'center' },
  botaoAdicionar: {
    flex: 1,
    backgroundColor: '#FFB800',
    borderRadius: RADIUS.lg,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  botaoAdicionarText: { color: '#333', fontWeight: '700', fontSize: 15, flex: 1 },
  botaoAdicionarPreco: { color: '#333', fontWeight: '700', fontSize: 15 },
});