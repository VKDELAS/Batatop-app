import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const ADMIN_ORDERS_CHANNEL_ID = 'new-orders';

function buildNewOrderPushContent(order, items = []) {
  const orderLabel = order.order_number
    ? `#${order.order_number}`
    : `#${String(order.id).slice(-4).toUpperCase()}`;

  const itemLines = items.slice(0, 5).map((item) => {
    const name = item.product_name || item.name || 'Item';
    const qty = item.quantity || 1;
    const adicionais = (item.adicionais || [])
      .map((a) => (typeof a === 'string' ? a : a?.name))
      .filter(Boolean);
    const adicText = adicionais.length ? `\n   + ${adicionais.join(', ')}` : '';
    return `${qty}x ${name}${adicText}`;
  });

  const extra = items.length > 5 ? `\n+${items.length - 5} item(ns)` : '';
  const customer = order.customer_name || 'Cliente';

  const body = [
    customer,
    '────────────────',
    ...itemLines,
    extra,
    '────────────────',
    'Toque para gerenciar o pedido',
  ].filter(Boolean).join('\n');

  return {
    title: `Novo Pedido ${orderLabel}`,
    subtitle: customer,
    body,
    data: {
      orderId: order.id,
      screen: 'admin/pedidos',
      url: '/admin/pedidos',
    },
  };
}

async function sendExpoPush(messages) {
  if (!messages.length) return { ok: true, sent: 0 };

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  return { ok: response.ok, result };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: 'orderId obrigatorio' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items (*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ success: false, error: 'Pedido nao encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: tokens, error: tokenError } = await supabase
      .from('admin_push_tokens')
      .select('expo_push_token');

    if (tokenError) {
      return new Response(JSON.stringify({ success: false, error: tokenError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const uniqueTokens = [...new Set((tokens || []).map((t) => t.expo_push_token).filter(Boolean))];
    const content = buildNewOrderPushContent(order, order.order_items || []);

    const messages = uniqueTokens.map((to) => ({
      to,
      title: content.title,
      subtitle: content.subtitle,
      body: content.body,
      sound: 'new_order.mp3',
      priority: 'high',
      channelId: ADMIN_ORDERS_CHANNEL_ID,
      data: content.data,
      android: {
        channelId: ADMIN_ORDERS_CHANNEL_ID,
        priority: 'max',
        sound: 'new_order.mp3',
        color: '#1A1A1A',
      },
      ios: {
        sound: 'new_order.mp3',
        subtitle: content.subtitle,
      },
    }));

    const pushResult = await sendExpoPush(messages);

    return new Response(JSON.stringify({
      success: true,
      sent: messages.length,
      push: pushResult,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
