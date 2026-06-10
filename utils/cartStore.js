import { useState, useEffect } from 'react';

let cart = [];
const listeners = new Set();

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
  addToCart(product) {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    this.emit();
  },
  removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    this.emit();
  },
  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      const item = cart.find((item) => item.id === productId);
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

  useEffect(() => {
    return cartStore.subscribe(setItems);
  }, []);

  return {
    items,
    count: cartStore.getCartCount(),
    total: cartStore.getCartTotal(),
    add: (p) => cartStore.addToCart(p),
    remove: (id) => cartStore.removeFromCart(id),
    updateQty: (id, q) => cartStore.updateQuantity(id, q),
    clear: () => cartStore.clearCart(),
  };
}
