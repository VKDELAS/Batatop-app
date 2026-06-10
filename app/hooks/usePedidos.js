import { useState } from 'react';
import { supabase } from './supabaseConfig';

export const usePedidos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const criarPedido = async (pedidoData) => {
    try {
      setLoading(true);
      setError(null);

      // Estrutura esperada:
      // {
      //   customer_name: string,
      //   customer_phone: string,
      //   customer_address: string,
      //   customer_neighborhood: string,
      //   customer_complement: string,
      //   payment_method: string,
      //   total_amount: number,
      //   discount_amount: number,
      //   coupon_code: string (opcional),
      //   notes: string (opcional),
      //   items: array,
      //   delivery_type: 'delivery' | 'pickup'
      // }

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: pedidoData.customer_name,
            customer_phone: pedidoData.customer_phone,
            customer_address: pedidoData.customer_address,
            customer_neighborhood: pedidoData.customer_neighborhood,
            customer_complement: pedidoData.customer_complement,
            payment_method: pedidoData.payment_method,
            total_amount: pedidoData.total_amount,
            discount_amount: pedidoData.discount_amount || 0,
            coupon_code: pedidoData.coupon_code || null,
            notes: pedidoData.notes || '',
            status: 'pending',
            delivery_type: pedidoData.delivery_type || 'delivery',
            metadata: {
              items: pedidoData.items,
              statusUpdatedAt: new Date().toISOString(),
            },
          },
        ])
        .select();

      if (insertError) throw insertError;

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const buscarPedidos = async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('orders').select('*');

      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros.customer_phone) {
        query = query.eq('customer_phone', filtros.customer_phone);
      }

      if (filtros.limit) {
        query = query.limit(filtros.limit);
      }

      const { data, error: fetchError } = await query.order('created_at', {
        ascending: false,
      });

      if (fetchError) throw fetchError;

      return { success: true, data };
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('orders')
        .update({
          status: novoStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pedidoId)
        .select();

      if (updateError) throw updateError;

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Erro ao atualizar pedido:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    criarPedido,
    buscarPedidos,
    atualizarStatusPedido,
  };
};
