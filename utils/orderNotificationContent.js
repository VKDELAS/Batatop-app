/**
 * Formata título e corpo da push de novo pedido (estilo mensagem rica).
 *
 * Formato visual (dentro do limite ~400 chars do Android):
 *
 *   Novo Pedido #123
 *   Maria Silva — R$ 45,90
 *   ──────────────────────
 *   2x Batata Calabresa .. R$ 35,80
 *      + Bacon, Cheddar
 *   1x Refrigerante ...... R$ 10,10
 *   ──────────────────────
 *   Toque para gerenciar
 */
export function buildNewOrderPushContent(order, items = []) {
  const orderLabel = order.order_number
    ? `#${order.order_number}`
    : `#${String(order.id).slice(-4).toUpperCase()}`;

  const customer = order.customer_name || 'Cliente';

  // Calcula total dos itens pra mostrar no subtitle (se disponível no
  // objeto order; senão, soma a partir dos items).
  const totalFromOrder = order.total_amount ?? order.total ?? order.total_price;
  const totalFromItems = items.reduce((sum, item) => {
    const price = item.product_price ?? item.price ?? 0;
    const qty = item.quantity ?? 1;
    return sum + price * qty;
  }, 0);
  const total = totalFromOrder ?? totalFromItems;
  const totalFmt = total
    ? ` — R$ ${total.toFixed(2).replace('.', ',')}`
    : '';

  // Monta linhas de itens (máximo 5; se tiver mais, mostra "+N itens")
  const maxItems = 5;
  const itemLines = items.slice(0, maxItems).map((item) => {
    const name = item.product_name || item.name || 'Item';
    const qty = item.quantity || 1;
    const price = item.product_price ?? item.price;
    const priceFmt = price != null
      ? ` .. R$ ${(price * qty).toFixed(2).replace('.', ',')}`
      : '';
    const adicionais = (item.adicionais || [])
      .map((a) => (typeof a === 'string' ? a : a?.name))
      .filter(Boolean);
    const adicText = adicionais.length ? `\n   + ${adicionais.join(', ')}` : '';
    return `${qty}x ${name}${priceFmt}${adicText}`;
  });

  const extra = items.length > maxItems
    ? `\n+${items.length - maxItems} item(ns)`
    : '';

  const body = [
    `${customer}${totalFmt}`,
    '─────────────────',
    ...itemLines,
    extra,
    '─────────────────',
    'Toque para gerenciar',
  ].filter(Boolean).join('\n');

  return {
    title: `Novo Pedido ${orderLabel}`,
    subtitle: `${customer}${totalFmt}`,
    body,
    data: {
      orderId: order.id,
      screen: 'admin/pedidos',
      url: '/admin/pedidos',
    },
  };
}
