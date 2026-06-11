import { Stack, useRouter, usePathname } from 'expo-router';
import { View, Text, StatusBar, StyleSheet, Pressable, Modal, ScrollView, TextInput, Animated, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';

/* ============ CONTEXT DO CARRINHO ============ */
import { createContext, useContext } from 'react';

const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clear: () => {},
  totalItems: 0,
});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  
  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1, precoNum: parseFloat(product.preco.replace(/[^\d,]/g, '').replace(',', '.')) * 100 }];
    });
  };
  
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  
  const updateQty = (id, qty) => {
    if (qty <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };
  
  const clear = () => setItems([]);
  
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  
  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

/* ============ MODAL DE ENDEREÇO — removido ============
 * O sistema de endereços agora vive em app/addresses.js
 * e usa dados reais do Supabase.
 * O header redireciona para /addresses ao clicar.
 */


/* ============ DRAWER MENU LATERAL ============ */
function MenuDrawer({ visible, onClose, user, router }) {
  const translateX = useRef(new Animated.Value(-320)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -320, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const items = [
    { icon: 'home-outline',       label: 'Início',        route: '/' },
    { icon: 'restaurant-outline', label: 'Cardápio',      route: '/cardapio' },
    { icon: 'receipt-outline',    label: 'Meus Pedidos',  route: '/pedidos' },
    { icon: 'person-outline',     label: 'Perfil',        route: '/profile' },
    { icon: 'help-circle-outline',label: 'Ajuda',         route: '/ajuda' },
  ];

  return (
    <View style={sd.overlay}>
      {/* Backdrop */}
      <Animated.View style={[sd.backdrop, { opacity }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[sd.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {/* Header do drawer */}
          <View style={sd.drawerHeader}>
            <View style={sd.drawerLogo}>
              <Image
                source={{ uri: 'https://eucwoxjmjfqylyrqunwk.supabase.co/storage/v1/object/public/logo/logo.png' }}
                style={sd.drawerLogoImg}
                resizeMode="contain"
              />
            </View>
            <View style={sd.drawerUserInfo}>
              {user ? (
                <>
                  <Text style={sd.drawerUserName}>{user.email}</Text>
                  <Text style={sd.drawerUserSub}>Bem-vindo de volta!</Text>
                </>
              ) : (
                <>
                  <Text style={sd.drawerUserName}>Olá, visitante!</Text>
                  <Pressable onPress={() => { onClose(); router.push('/auth/login'); }}>
                    <Text style={sd.drawerLoginLink}>Entrar na conta →</Text>
                  </Pressable>
                </>
              )}
            </View>
            <Pressable onPress={onClose} style={sd.drawerCloseBtn}>
              <Ionicons name="close" size={22} color="#1A1A1A" />
            </Pressable>
          </View>

          <View style={sd.drawerDivider} />

          {/* Itens de navegação */}
          <ScrollView style={sd.drawerItems} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <Pressable
                key={item.label}
                style={sd.drawerItem}
                onPress={() => { onClose(); router.push(item.route); }}
              >
                <View style={sd.drawerItemIcon}>
                  <Ionicons name={item.icon} size={20} color="#FFB800" />
                </View>
                <Text style={sd.drawerItemLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
              </Pressable>
            ))}
          </ScrollView>

          <View style={sd.drawerDivider} />

          {/* Footer */}
          <View style={sd.drawerFooter}>
            <Text style={sd.drawerFooterText}>Batatop Delivery · Iacanga, SP</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const sd = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    width: 290,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  drawerLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  drawerLogoImg: {
    width: 48,
    height: 48,
  },
  drawerUserInfo: {
    flex: 1,
  },
  drawerUserName: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  drawerUserSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  drawerLoginLink: {
    color: '#FFB800',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  drawerItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemLabel: {
    flex: 1,
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  drawerFooterText: {
    color: '#BBBBBB',
    fontSize: 12,
  },
});

/* ============ SCROLL CONTEXT PARA HEADER ============ */
// Compartilha o Animated.Value do scrollY com todas as telas
// Cada tela usa: const onScroll = useScrollHandler()
// e passa pro ScrollView: onScroll={onScroll} scrollEventThrottle={16}
const ScrollYContext = createContext(new Animated.Value(0));

export const useScrollHandler = () => {
  const scrollY = useContext(ScrollYContext);
  // Retorna função normal compatível com onScroll do ScrollView
  return (event) => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    scrollY.setValue(y);
  };
};

import { supabase } from '../supabaseConfig';

/* ============ HEADER GLOBAL COM HIDE/SHOW SCROLL ============ */
function Header() {
  const [selectedAddress, setSelectedAddress] = useState('Selecione um endereço');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [user, setUser] = useState(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const authRowOpacity = useRef(new Animated.Value(1)).current;
  const authRowHeight = useRef(new Animated.Value(1)).current; // 1=visível 0=escondido
  const router = useRouter();
  const { totalItems } = useCart();


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchDefaultAddress(u.id);
        // Já começa escondido se logado
        authRowOpacity.setValue(0);
        authRowHeight.setValue(0);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchDefaultAddress(u.id);
        // Esconde authRow com animação ao logar
        Animated.parallel([
          Animated.timing(authRowOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
          Animated.timing(authRowHeight,  { toValue: 0, duration: 250, useNativeDriver: false }),
        ]).start();
      } else {
        setSelectedAddress('Selecione um endereço');
        // Mostra authRow com animação ao deslogar (se não estiver em /addresses)
        if (!isAddressPage) {
          Animated.parallel([
            Animated.timing(authRowOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
            Animated.timing(authRowHeight,  { toValue: 1, duration: 300, useNativeDriver: false }),
          ]).start();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchDefaultAddress(userId) {
    try {
      const { data } = await supabase
        .from('addresses')
        .select('street, number, city')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();
      if (data) {
        setSelectedAddress(`${data.street}, ${data.number}`);
      } else {
        // Pega o mais recente se não tiver padrão definido
        const { data: any } = await supabase
          .from('addresses')
          .select('street, number')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (any) setSelectedAddress(`${any.street}, ${any.number}`);
      }
    } catch {
      // sem endereço cadastrado ainda
    }
  }

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  // Pega o scrollY compartilhado via context e anima o header
  const scrollY = useContext(ScrollYContext);
  const prevScrollY = useRef(0);
  const headerVisible = useRef(true);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const delta = value - prevScrollY.current;
      prevScrollY.current = value;

      if (value <= 10) {
        // Topo da página — sempre mostra
        if (!headerVisible.current) {
          headerVisible.current = true;
          Animated.spring(headerTranslateY, {
            toValue: 0, useNativeDriver: true,
            tension: 80, friction: 12,
          }).start();
        }
      } else if (delta > 6 && headerVisible.current) {
        // Scrollando pra cima (conteúdo subindo) — esconde
        headerVisible.current = false;
        Animated.timing(headerTranslateY, {
          toValue: -160, duration: 220,
          useNativeDriver: true,
        }).start();
      } else if (delta < -6 && !headerVisible.current) {
        // Scrollando pra baixo (conteúdo descendo) — mostra
        headerVisible.current = true;
        Animated.spring(headerTranslateY, {
          toValue: 0, useNativeDriver: true,
          tension: 80, friction: 12,
        }).start();
      }
    });
    return () => scrollY.removeListener(id);
  }, []);

  const pathname = usePathname();
  const isAuthPage = pathname.includes('auth');
  const isProdutoPage = pathname.includes('produto');
  const isAddressPage = pathname.includes('addresses');

  // Anima o authRow pra sumir/aparecer quando entra/sai de /addresses
  useEffect(() => {
    if (isAddressPage || user) {
      // Esconde: dentro de /addresses OU usuário logado
      Animated.parallel([
        Animated.timing(authRowOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(authRowHeight,  { toValue: 0, duration: 250, useNativeDriver: false }),
      ]).start();
    } else {
      // Mostra: fora de /addresses E não logado
      Animated.parallel([
        Animated.timing(authRowOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(authRowHeight,  { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  }, [isAddressPage, user]);

  if (isAuthPage || isProdutoPage) return null;

  return (
    <>
      <Animated.View style={[s.headerSafeAnimated, { transform: [{ translateY: headerTranslateY }], position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }]}>
        <SafeAreaView style={s.headerSafe} edges={['top']}>
          {/* ── Linha 1: endereço ── */}
          <View style={s.addressRow}>
            <Pressable style={s.menuBtn} onPress={() => setDrawerVisible(true)}>
              <View style={s.menuBar} />
              <View style={[s.menuBar, { width: 16 }]} />
              <View style={s.menuBar} />
            </Pressable>

            <Animated.View style={[s.addressSelectorInline, { transform: [{ scale: scaleAnim }] }]}>
              <Pressable
                style={s.addressSelectorInnerRow}
                onPress={() => router.push('/addresses')}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Ionicons name="location-sharp" size={18} color="#FFB800" />
                <View style={s.addressSelectorTextInline}>
                  <Text style={s.addressSelectorLabelInline}>Entregando em</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={s.addressSelectorValueInline} numberOfLines={1}>
                      {selectedAddress}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#1A1A1A" />
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            <Pressable style={s.cartBtn} onPress={() => router.push('/cart')}>
              <Ionicons name="cart-outline" size={28} color="#1A1A1A" />
              {totalItems > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{totalItems}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* ── Linha 2: botões de auth — some animado em /addresses ou logado ── */}
          <Animated.View style={[
            s.authRow,
            {
              opacity: authRowOpacity,
              maxHeight: authRowHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 56],
              }),
              overflow: 'hidden',
            }
          ]}>
            <Pressable style={s.registerHeaderBtn} onPress={() => router.push('/auth/register')}>
              <Text style={s.registerHeaderBtnText}>Criar conta</Text>
            </Pressable>
            <Pressable style={s.loginBtn} onPress={() => router.push('/auth/login')}>
              <Text style={s.loginBtnText}>Entrar</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      <MenuDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        user={user}
        router={router}
      />
    </>
  );
}

/* ============ BOTTOM TAB BAR ============ */
function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  // Não exibe tab bar na tela de detalhe do produto
  if (pathname.includes('produto')) return null;

  const tabs = [
    { name: 'index', label: 'Início', icon: 'home', iconOutline: 'home-outline' },
    { name: 'cardapio', label: 'Cardápio', icon: 'restaurant', iconOutline: 'restaurant-outline' },
    { name: 'pedidos', label: 'Pedidos', icon: 'receipt', iconOutline: 'receipt-outline' },
    { name: 'profile', label: 'Perfil', icon: 'person', iconOutline: 'person-outline' },
  ];

  const isActive = (routeName) => {
    if (routeName === 'index') return pathname === '/' || pathname === '/index';
    return pathname.includes(routeName);
  };

  return (
    <View style={s.tabBar}>
      {tabs.map((tab) => {
        const active = isActive(tab.name);
        return (
          <Pressable
            key={tab.name}
            style={s.tabItem}
            onPress={() => router.push(tab.name === 'index' ? '/' : `/${tab.name}`)}
          >
            <Ionicons
              name={active ? tab.icon : tab.iconOutline}
              size={24}
              color={active ? '#FFB800' : '#A3A3A3'}
            />
            <Text style={[s.tabLabel, active && s.tabLabelActive]}>
              {tab.label}
            </Text>
            {active && <View style={s.tabIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ============ LAYOUT ROOT ============ */
const rootScrollY = new Animated.Value(0);

export default function RootLayout() {
  return (
    <CartProvider>
      <ScrollYContext.Provider value={rootScrollY}>
      <SafeAreaProvider>
        <StatusBar backgroundColor="#FFB800" barStyle="dark-content" />
        <View style={{ flex: 1 }}>
          <Header />
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F8F9FA' },
                animationEnabled: true,
              }}
            />
          </View>
          <BottomTabBar />
        </View>
      </SafeAreaProvider>
      </ScrollYContext.Provider>
    </CartProvider>
  );
}

/* ============ STYLES ============ */
const s = StyleSheet.create({
  /* Header */
  headerSafeAnimated: {
    overflow: 'hidden',
  },
  headerSafe: {
    backgroundColor: '#FFB800',
  },

  // Linha 1 — hambúrguer + endereço + carrinho
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },

  // Linha 2 — botões auth (some quando logado)
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },

  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    flexShrink: 0,
  },
  menuBar: {
    width: 22,
    height: 2.5,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
  },

  // Endereço inline
  addressSelectorInline: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  addressSelectorInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addressSelectorTextInline: {
    flex: 1,
    overflow: 'hidden',
  },
  addressSelectorLabelInline: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
  },
  addressSelectorValueInline: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },

  // Carrinho
  cartBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E63535',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFB800',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },

  // Botões auth
  loginBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#B8860B',
    fontWeight: '800',
    fontSize: 15,
  },
  registerHeaderBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  registerHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // Estilos antigos mantidos por compatibilidade (modal de endereço usa alguns)
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  addressSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  addressSelectorText: { flex: 1 },
  addressSelectorLabel: { color: '#6B6B6B', fontSize: 11, fontWeight: '600' },
  addressSelectorValue: { color: '#1A1A1A', fontSize: 14, fontWeight: '700', marginTop: 2 },

  /* Bottom Tab Bar */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE6DC',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A3A3A3',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#FFB800',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 40,
    height: 3,
    backgroundColor: '#FFB800',
    borderRadius: 2,
  },

  /* Address Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addressItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  addressItemText: {
    flex: 1,
  },
  addressItemLabel: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  addressItemAddress: {
    color: '#6B6B6B',
    fontSize: 12,
    marginTop: 3,
  },
  mainBadge: {
    backgroundColor: '#FFB500',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mainBadgeText: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#FFB800',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
  },
  addAddressBtnText: {
    color: '#FFB800',
    fontWeight: '700',
    fontSize: 14,
  },
  addressForm: {
    marginVertical: 16,
    gap: 12,
  },
  addressInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1A1A1A',
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    alignItems: 'center',
  },
  formBtnCancelText: {
    color: '#6B6B6B',
    fontWeight: '600',
    fontSize: 14,
  },
  formBtnSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFB800',
    alignItems: 'center',
  },
  formBtnSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});