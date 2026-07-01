import { Stack, useRouter, usePathname } from 'expo-router';
import {
  View, Text, StatusBar, StyleSheet, Pressable,
  ScrollView, Animated, Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, createContext, useContext } from 'react';

import { useCart } from '../utils/cartStore';
import { supabase } from '../supabaseConfig';
import { configureNotificationAudio } from '../utils/notificationSound';

/* ============================================================
   CONTEXTO DE DIREÇÃO DE NAVEGAÇÃO
   Controla a animação do Stack e lembra a última rota antes de /addresses
   ============================================================ */
const NavContext = createContext({
  animation: 'slide_from_right',
  setAnimation: () => {},
  lastRoute: '/',
  setLastRoute: () => {},
});

export const useNavContext = () => useContext(NavContext);

/* ============================================================
   SCROLL CONTEXT PARA HEADER
   Compartilha o Animated.Value do scrollY E um resetHeader() com todas as telas.
   Cada tela usa: const { onScroll, resetHeader } = useScrollHandler()
   e passa pro ScrollView: onScroll={onScroll} scrollEventThrottle={16}
   Chame resetHeader() no useFocusEffect de cada tela para garantir que o
   header global reapareça ao navegar de volta.
   ============================================================ */
const ScrollYContext = createContext({
  scrollY: new Animated.Value(0),
  resetHeader: () => {},
});

export const useScrollHandler = () => {
  const { scrollY, resetHeader } = useContext(ScrollYContext);
  const onScroll = (event) => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    scrollY.setValue(y);
  };
  return { onScroll, resetHeader };
};

/* ============================================================
   HEADER HEIGHT CONTEXT
   Compartilha a altura real do header (medida via onLayout) com as telas.
   Cada tela usa: const headerHeight = useHeaderHeight()
   e passa pro ScrollView: contentContainerStyle={{ paddingTop: headerHeight }}
   ============================================================ */
const HeaderHeightContext = createContext(175); // fallback seguro

export const useHeaderHeight = () => useContext(HeaderHeightContext);

/* ============================================================
   DRAWER MENU LATERAL
   ============================================================ */
function MenuDrawer({ visible, onClose, user, router }) {
  const translateX = useRef(new Animated.Value(-320)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0,    duration: 280, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1,    duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -320, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,    duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const items = [
    { icon: 'home-outline',        label: 'Início',       route: '/' },
    { icon: 'restaurant-outline',  label: 'Cardápio',     route: '/cardapio' },
    { icon: 'receipt-outline',     label: 'Meus Pedidos', route: '/pedidos' },
    { icon: 'person-outline',      label: 'Perfil',       route: '/profile' },
    { icon: 'help-circle-outline', label: 'Ajuda',        route: '/ajuda' },
  ];

  return (
    <View style={sd.overlay}>
      <Animated.View style={[sd.backdrop, { opacity }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[sd.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
  drawerLogoImg: { width: 48, height: 48 },
  drawerUserInfo: { flex: 1 },
  drawerUserName: { color: '#1A1A1A', fontWeight: '700', fontSize: 14 },
  drawerUserSub:  { color: '#888', fontSize: 12, marginTop: 2 },
  drawerLoginLink:{ color: '#FFB800', fontWeight: '700', fontSize: 13, marginTop: 2 },
  drawerCloseBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  drawerDivider:  { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 20 },
  drawerItems:    { flex: 1, paddingTop: 8 },
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
  drawerItemLabel: { flex: 1, color: '#1A1A1A', fontSize: 15, fontWeight: '600' },
  drawerFooter: { paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  drawerFooterText: { color: '#BBBBBB', fontSize: 12 },
});

/* ============================================================
   HEADER GLOBAL COM HIDE/SHOW NO SCROLL
   ============================================================ */
function Header({ onHeightChange, onRegisterReset }) {
  const [selectedAddress, setSelectedAddress] = useState('Selecione um endereço');
  const [drawerVisible, setDrawerVisible]     = useState(false);
  const [user, setUser]                       = useState(null);
  const [authResolved, setAuthResolved]       = useState(false);

  const scaleAnim        = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const authRowOpacity   = useRef(new Animated.Value(1)).current;
  const authRowTranslateY = useRef(new Animated.Value(0)).current;
  const [authRowVisible, setAuthRowVisible] = useState(true);
  const addressNavLock = useRef(false);

  const router   = useRouter();
  const pathname = usePathname();
  const { count: totalItems } = useCart();
  const { setAnimation, setLastRoute } = useNavContext();
  const { scrollY } = useContext(ScrollYContext);

  const prevScrollY  = useRef(0);
  const headerVisible = useRef(true);

  /* ---- Auth & endereço ---- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setAuthResolved(true);
      if (u) fetchDefaultAddress(u.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchDefaultAddress(u.id);
        Animated.parallel([
          Animated.timing(authRowOpacity,     { toValue: 0,   duration: 220, useNativeDriver: true }),
          Animated.timing(authRowTranslateY,  { toValue: -12, duration: 220, useNativeDriver: true }),
        ]).start(() => setAuthRowVisible(false));
      } else {
        setSelectedAddress('Selecione um endereço');
        authRowTranslateY.setValue(-12);
        setAuthRowVisible(true);
        Animated.parallel([
          Animated.timing(authRowOpacity,    { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(authRowTranslateY, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]).start();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchDefaultAddress(userId) {
    try {
      const { data } = await supabase
        .from('addresses')
        .select('street, number')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();
      if (data) {
        setSelectedAddress(`${data.street}, ${data.number}`);
        return;
      }
      // fallback: mais recente
      const { data: any } = await supabase
        .from('addresses')
        .select('street, number')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (any) setSelectedAddress(`${any.street}, ${any.number}`);
    } catch { /* sem endereço ainda */ }
  }

  /* ---- Hide/show no scroll ---- */
  const showHeader = () => {
    if (!headerVisible.current) {
      headerVisible.current = true;
      Animated.spring(headerTranslateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
    }
  };

  useEffect(() => {
    if (typeof onRegisterReset === 'function') onRegisterReset(showHeader);
  }, []);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const delta = value - prevScrollY.current;
      prevScrollY.current = value;
      if (value <= 10) {
        showHeader();
      } else if (delta > 6 && headerVisible.current) {
        headerVisible.current = false;
        Animated.timing(headerTranslateY, { toValue: -160, duration: 220, useNativeDriver: true }).start();
      } else if (delta < -6 && !headerVisible.current) {
        showHeader();
      }
    });
    return () => scrollY.removeListener(id);
  }, []);

  /* ---- authRow em /addresses ---- */
  const isAuthPage    = pathname.includes('auth');
  const isProdutoPage = pathname.includes('produto');
  const isAddressPage = pathname.includes('addresses');
  const isCheckoutPage = pathname.includes('checkout');

  useEffect(() => {
    if (!authResolved) return;
    if (isAddressPage || user) {
      Animated.parallel([
        Animated.timing(authRowOpacity,    { toValue: 0,   duration: 200, useNativeDriver: true }),
        Animated.timing(authRowTranslateY, { toValue: -12, duration: 200, useNativeDriver: true }),
      ]).start(() => setAuthRowVisible(false));
    } else {
      authRowTranslateY.setValue(-12);
      setAuthRowVisible(true);
      Animated.parallel([
        Animated.timing(authRowOpacity,    { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(authRowTranslateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [isAddressPage, user, authResolved]);

  if (isAuthPage || isProdutoPage || isCheckoutPage) return null;

  return (
    <>
      <Animated.View
        style={[
          s.headerSafeAnimated,
          { transform: [{ translateY: headerTranslateY }], position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 },
        ]}
        onLayout={(e) => onHeightChange && onHeightChange(e.nativeEvent.layout.height)}
      >
        <SafeAreaView style={s.headerSafe} edges={['top']}>
          {/* ── Linha 1: hambúrguer + endereço + carrinho ── */}
          <View style={s.addressRow}>
            <Pressable style={s.menuBtn} onPress={() => setDrawerVisible(true)}>
              <View style={s.menuBar} />
              <View style={[s.menuBar, { width: 16 }]} />
              <View style={s.menuBar} />
            </Pressable>

            <Animated.View style={[s.addressSelectorInline, { transform: [{ scale: scaleAnim }] }]}>
              <Pressable
                style={s.addressSelectorInnerRow}
                onPress={() => {
                  if (addressNavLock.current || isAddressPage) return;
                  addressNavLock.current = true;
                  setLastRoute(pathname);
                  setAnimation('slide_from_right');
                  router.replace('/addresses');
                  setTimeout(() => { addressNavLock.current = false; }, 600);
                }}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start()}
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

          {/* ── Linha 2: auth — some quando logado ou em /addresses ── */}
          {authRowVisible && (
            <Animated.View style={[s.authRow, { opacity: authRowOpacity, transform: [{ translateY: authRowTranslateY }] }]}>
              <Pressable style={s.registerHeaderBtn} onPress={() => { setAnimation('slide_from_right'); router.push('/auth/register'); }}>
                <Text style={s.registerHeaderBtnText}>Criar conta</Text>
              </Pressable>
              <Pressable style={s.loginBtn} onPress={() => { setAnimation('slide_from_right'); router.push('/auth/login'); }}>
                <Text style={s.loginBtnText}>Entrar</Text>
              </Pressable>
            </Animated.View>
          )}
        </SafeAreaView>
      </Animated.View>

      <MenuDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} user={user} router={router} />
    </>
  );
}

/* ============================================================
   CART BAR — SACOLA FLUTUANTE
   Aparece com slide-up quando há itens, some quando o carrinho está vazio
   ou quando o usuário já está na tela de cart/checkout.
   ============================================================ */
function CartBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { count: totalItems, total } = useCart();
  const subtotal = total / 100;

  const translateY = useRef(new Animated.Value(120)).current;
  const wasVisible = useRef(false);

  const isCartPage = pathname.includes('cart') || pathname.includes('checkout');
  const shouldShow = totalItems > 0 && !isCartPage;

  useEffect(() => {
    if (shouldShow && !wasVisible.current) {
      wasVisible.current = true;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }).start();
    } else if (!shouldShow && wasVisible.current) {
      wasVisible.current = false;
      Animated.timing(translateY, {
        toValue: 120,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [shouldShow]);

  const opacity = translateY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[s.cartBar, { transform: [{ translateY }], opacity }]} pointerEvents={shouldShow ? 'auto' : 'none'}>
      <Pressable style={s.cartBarInner} onPress={() => router.push('/cart')}>
        <View style={s.cartBarLeft}>
          <View style={s.cartBarBadge}>
            <Text style={s.cartBarBadgeText}>{totalItems}</Text>
          </View>
          <Text style={s.cartBarLabel}>Ver sacola</Text>
        </View>
        <Text style={s.cartBarTotal}>
          R$ {subtotal.toFixed(2).replace('.', ',')}
        </Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   BOTTOM TAB BAR
   ============================================================ */
const TAB_ORDER = ['index', 'cardapio', 'pedidos', 'profile'];

function getTabIndex(pathname) {
  if (pathname === '/' || pathname === '/index') return 0;
  return TAB_ORDER.findIndex((t) => t !== 'index' && pathname.includes(t));
}

function BottomTabBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { setAnimation } = useNavContext();

  if (pathname.includes('produto')) return null;

  const tabs = [
    { name: 'index',    label: 'Início',   icon: 'home',       iconOutline: 'home-outline' },
    { name: 'cardapio', label: 'Cardápio', icon: 'restaurant', iconOutline: 'restaurant-outline' },
    { name: 'pedidos',  label: 'Pedidos',  icon: 'receipt',    iconOutline: 'receipt-outline' },
    { name: 'profile',  label: 'Perfil',   icon: 'person',     iconOutline: 'person-outline' },
  ];

  const isActive = (routeName) => {
    if (routeName === 'index') return pathname === '/' || pathname === '/index';
    return pathname.includes(routeName);
  };

  const currentIdx = getTabIndex(pathname);

  const handleTabPress = (tab) => {
    const targetIdx = TAB_ORDER.indexOf(tab.name);
    if (targetIdx === currentIdx) return;
    const direction = targetIdx > currentIdx ? 'slide_from_right' : 'slide_from_left';
    setAnimation(direction);
    router.push(tab.name === 'index' ? '/' : `/${tab.name}`);
  };

  return (
    <View style={s.tabBar}>
      {tabs.map((tab) => {
        const active = isActive(tab.name);
        return (
          <Pressable key={tab.name} style={s.tabItem} onPress={() => handleTabPress(tab)}>
            <Ionicons
              name={active ? tab.icon : tab.iconOutline}
              size={24}
              color={active ? '#FFB800' : '#A3A3A3'}
            />
            <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            {active && <View style={s.tabIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ============================================================
   ROOT LAYOUT
   ============================================================ */
const rootScrollY = new Animated.Value(0);

export default function RootLayout() {
  const [headerHeight, setHeaderHeight] = useState(175);
  const [animation, setAnimation]       = useState('slide_from_right');
  const [lastRoute, setLastRoute]       = useState('/');
  const resetHeaderRef = useRef(() => {});

  const scrollCtxValue = useRef({
    scrollY: rootScrollY,
    resetHeader: () => resetHeaderRef.current(),
  }).current;

  useEffect(() => {
    configureNotificationAudio();
  }, []);

  return (
    <NavContext.Provider value={{ animation, setAnimation, lastRoute, setLastRoute }}>
    <ScrollYContext.Provider value={scrollCtxValue}>
    <HeaderHeightContext.Provider value={headerHeight}>
    <SafeAreaProvider>
      <StatusBar backgroundColor="#FFB800" barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <Header
          onHeightChange={setHeaderHeight}
          onRegisterReset={(fn) => { resetHeaderRef.current = fn; }}
        />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F8F9FA' },
              animation,
            }}
          />
        </View>
        <CartBar />
        <BottomTabBar />
      </View>
    </SafeAreaProvider>
    </HeaderHeightContext.Provider>
    </ScrollYContext.Provider>
    </NavContext.Provider>
  );
}

/* ============================================================
   STYLES
   ============================================================ */
const s = StyleSheet.create({
  /* ── Header ── */
  headerSafeAnimated: { overflow: 'hidden' },
  headerSafe:         { backgroundColor: '#FFB800' },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  menuBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    gap: 5, flexShrink: 0,
  },
  menuBar: { width: 22, height: 2.5, backgroundColor: '#1A1A1A', borderRadius: 2 },

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
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  addressSelectorTextInline: { flex: 1, overflow: 'hidden' },
  addressSelectorLabelInline: { color: '#888', fontSize: 11, fontWeight: '500' },
  addressSelectorValueInline: { color: '#1A1A1A', fontSize: 14, fontWeight: '800', flexShrink: 1 },

  cartBtn: {
    position: 'relative',
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#E63535', borderRadius: 10,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFB800',
  },
  cartBadgeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 10 },

  loginBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  loginBtnText: { color: '#B8860B', fontWeight: '800', fontSize: 15 },
  registerHeaderBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  registerHeaderBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  /* ── Cart Bar (sacola flutuante) ── */
  cartBar: {
    position: 'absolute',
    bottom: 85, // fica logo acima da BottomTabBar (altura ~62px + margem)
    left: 16,
    right: 16,
    zIndex: 900,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 12,
  },
  cartBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB800',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  cartBarLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  cartBarBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minWidth: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartBarBadgeText: { color: '#B8860B', fontWeight: '800', fontSize: 13 },
  cartBarLabel:     { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cartBarTotal:     { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  /* ── Bottom Tab Bar ── */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#ECE6DC',
    paddingBottom: 8, paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 5,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 2, position: 'relative', paddingVertical: 4,
  },
  tabLabel:       { fontSize: 11, fontWeight: '600', color: '#A3A3A3', marginTop: 2 },
  tabLabelActive: { color: '#FFB800', fontWeight: '700' },
  tabIndicator: {
    position: 'absolute', top: -8,
    width: 40, height: 3,
    backgroundColor: '#FFB800', borderRadius: 2,
  },
});
