import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar carrinho do armazenamento local ao iniciar
  useEffect(() => {
    loadCart();
  }, []);

  // Salvar carrinho sempre que mudar
  useEffect(() => {
    if (!loading) {
      saveCart();
    }
  }, [cart]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('batatop_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('batatop_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  };

  const addToCart = (produto) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === produto.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + (produto.quantidade || 1) }
            : item
        );
      }

      return [...prevCart, { ...produto, quantidade: produto.quantidade || 1 }];
    });
  };

  const removeFromCart = (produtoId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== produtoId));
  };

  const updateQuantity = (produtoId, quantidade) => {
    if (quantidade <= 0) {
      removeFromCart(produtoId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === produtoId ? { ...item, quantidade } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.preco * item.quantidade, 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantidade, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }
  return context;
};
