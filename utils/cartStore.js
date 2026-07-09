import { useState, useEffect } from 'react';

let cart = [];
const listeners = new Set();

// Flag separada pra esconder o botão flutuante "ver carrinho" em telas
// específicas (ex: product detail), sem mexer no array do carrinho em si.
let floatingHidden = false;
const floatingListeners = new Set();

export const cartStore = {
  getCart() {
    return cart;
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit() {
    listeners.forEach((l) => l([...cart]));
  },
  isFloatingHidden() {
    return floatingHidden;
  },
  subscribeFloating(listener) {
    floatingListeners.add(listener);
    return () => floatingListeners.delete(listener);
  },
  setFloatingHidden(hidden) {
    if (floatingHidden === hidden) return;
    floatingHidden = hidden;
    floatingListeners.forEach((l) => l(floatingHidden));
  },
  addToCart(product) {
    const qty = product.quantidade || product.quantity || 1;
    const adIds = (product.adicionais || []).map(a => a.id).sort().join('-');
    const cartItemId = `${product.id}-${adIds}-${product.observacoes || ''}`;

    const existing = cart.find((item) => (item.cartItemId || item.id) === cartItemId);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ ...product, cartItemId, quantity: qty });
    }
    this.emit();
  },
  removeFromCart(cartItemId) {
    cart = cart.filter((item) => (item.cartItemId || item.id) !== cartItemId);
    this.emit();
  },
  updateQuantity(cartItemId, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(cartItemId);
    } else {
      const item = cart.find((item) => (item.cartItemId || item.id) === cartItemId);
      if (item) {
        item.quantity = quantity;
      }
      this.emit();
    }
  },
  clearCart() {
    cart = [];
    this.emit();
  },
  getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },
  getCartTotal() {
    return cart.reduce((sum, item) => sum + item.precoNum * item.quantity, 0);
  }
};

export function useCart() {
  const [items, setItems] = useState(cartStore.getCart());
  const [hideFloating, setHideFloatingState] = useState(cartStore.isFloatingHidden());

  useEffect(() => {
    return cartStore.subscribe(setItems);
  }, []);

  useEffect(() => {
    return cartStore.subscribeFloating(setHideFloatingState);
  }, []);

  return {
    items,
    count: cartStore.getCartCount(),
    total: cartStore.getCartTotal(),
    add: (p) => cartStore.addToCart(p),
    remove: (id) => cartStore.removeFromCart(id),
    updateQty: (id, q) => cartStore.updateQuantity(id, q),
    clear: () => cartStore.clearCart(),
    // Telas como o product detail usam isso pra esconder o botão
    // flutuante "ver carrinho" enquanto estão em foco.
    hideFloating,
    setHideFloating: (hidden) => cartStore.setFloatingHidden(hidden),
  };
}
