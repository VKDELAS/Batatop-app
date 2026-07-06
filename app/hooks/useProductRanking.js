import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseConfig';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://eucwoxjmjfqylyrqunwk.supabase.co';

export const useProductRanking = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Busca todos os produtos cadastrados
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // 2. Busca TODOS os itens vendidos da tabela order_items
      // Sem o filtro de 30 dias (created_at) para evitar o bug de coluna inexistente
      const { data: salesData, error: salesError } = await supabase
        .from('order_items')
        .select('product_id, product_name, quantity');

      if (salesError) throw salesError;

      // 3. Agrupa e soma as quantidades vendidas por produto
      const salesCounts = {};
      
      // Inicializa a contagem para todos os produtos com 0
      productsData.forEach(p => {
        salesCounts[p.id] = 0;
      });

      // Conta as vendas dos itens de pedido
      if (salesData && salesData.length > 0) {
        salesData.forEach(item => {
          const qty = Number(item.quantity) || 1;
          
          if (item.product_id && salesCounts[item.product_id] !== undefined) {
            salesCounts[item.product_id] += qty;
          } else if (item.product_name) {
            // Fallback robusto por nome caso o product_id não exista/esteja nulo
            const matched = productsData.find(
              p => p.name.trim().toLowerCase() === item.product_name.trim().toLowerCase()
            );
            if (matched) {
              salesCounts[matched.id] += qty;
            }
          }
        });
      }

      // 4. Ordena os produtos pela quantidade total de vendas (descrescente)
      // Mantém ordenação secundária por data de criação para desempate
      const sortedProducts = [...productsData].sort((a, b) => {
        const salesA = salesCounts[a.id] || 0;
        const salesB = salesCounts[b.id] || 0;

        if (salesB !== salesA) {
          return salesB - salesA;
        }

        // Desempate: mais recente criado primeiro
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      // 5. Mapeia no formato esperado pelas telas do aplicativo React Native
      const produtosRankeados = sortedProducts.map((produto, index) => ({
        id: produto.id,
        nome: produto.name,
        descricao: produto.description,
        descricaoLonga: produto.description,
        preco: produto.price,
        precoFormatado: `R$ ${produto.price.toFixed(2).replace('.', ',')}`,
        categoria: produto.category ? produto.category.charAt(0).toUpperCase() + produto.category.slice(1) : 'Outros',
        imagem: produto.image_url ? (produto.image_url.startsWith('http') ? produto.image_url : `${SUPABASE_URL}/storage/v1/object/public/Products/${produto.image_url.replace(/^\/products\//, '')}`) : null,
        vendas: salesCounts[produto.id] || 0,
        avaliacoes: 4.5,
        avaliacoesCount: 0,
        tempo: '15-20',
        destaque: produto.available,
        disponivel: produto.available,
      }));

      setProdutos(produtosRankeados);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar ranking de produtos:', err);
      setError(err.message || 'Erro ao carregar o ranking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { produtos, loading, error, refetch: fetchRanking };
};
