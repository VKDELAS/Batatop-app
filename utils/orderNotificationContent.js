/**
 * Formata título e corpo da push de novo pedido (estilo mensagem rica).
 */
export function buildNewOrderPushContent(order, items = []) {
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
