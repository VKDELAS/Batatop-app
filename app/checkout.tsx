import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Switch, Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { supabase } from "../supabaseConfig";
import { useCart } from "../utils/cartStore";
import { createPixPayment, createPaymentPreference, tokenizeCard, createCardPayment, guessPaymentMethodId, chargeWithSavedCard } from "../utils/mercadoPago";
import { getPreferredPaymentMethod, getPreferredCardId } from "../utils/paymentPrefs";
import { usePaymentCards, formatCardDisplay, SavedCard } from "../utils/usePaymentCards";
import { notifyAdminNewOrder } from "../utils/notifyNewOrder";

const colors = {
  surface: "#FFFFFF",
  onSurface: "#1A1A1A",
  surfaceSecondary: "#F8F8F8",
  onSurfaceSecondary: "#666666",
  brand: "#FFB800",
  brandPrimary: "#FFB800",
  onBrand: "#1A1A1A",
  brandSecondary: "#E6A800",
  brandTertiary: "#FFF8E7",
  onBrandTertiary: "#E61E2A",
  brandDark: "#E61E2A",
  success: "#27AE60",
  warning: "#F2C94C",
  error: "#EB5757",
  info: "#2D9CDB",
  border: "#EEEEEE",
  borderStrong: "#CCCCCC",
  divider: "#EEEEEE",
  muted: "#999999",
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
};

const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Address = {
  id: string; street: string; number: string;
  complement: string | null; neighborhood: string;
  city: string; cep: string; is_default: boolean;
};
type DeliveryType = "delivery" | "retirada";
type Payment =
  | "dinheiro"
  | "pix"
  | "cartão de crédito"
  | "cartão de débito"
  | "cartão de crédito (entrega)"
  | "cartão de débito (entrega)";

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatCep(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2)  return d;
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function toTitleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCardNumber(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 16);
  return d.match(/.{1,4}/g)?.join(" ") || d;
}

function formatCardExpiry(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function formatCpf(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// ─── CEP lookup ───────────────────────────────────────────────────────────────
async function lookupCep(cep: string): Promise<{ street: string; neighborhood: string; city: string; uf: string } | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const d = await r.json();
    if (d.erro) return null;
    return { street: d.logradouro, neighborhood: d.bairro, city: d.localidade, uf: d.uf };
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { couponCode } = useLocalSearchParams<{ couponCode?: string }>();
  const { items, total: totalCents, clear } = useCart();
  const subtotal = totalCents / 100;

  // Session state
  const [session, setSession] = useState<any>(null);

  // Customer
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");

  // Delivery
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");

  // Address
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr]     = useState<string | null>(null);
  const [cep, setCep]               = useState("");
  const [street, setStreet]         = useState("");
  const [number, setNumber]         = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [noKnowCep, setNoKnowCep]   = useState(false);
  const [cepError, setCepError]     = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  // Utensils
  const [wantsCutlery, setWantsCutlery] = useState<boolean | null>(null);

  // Payment / misc
  const [payment, setPayment]       = useState<Payment>("pix");

  // Saved card flow
  const { cards: savedCards, loadCards: loadSavedCards } = usePaymentCards();
  const [selectedSavedCard, setSelectedSavedCard] = useState<SavedCard | null>(null);
  const [useManualCardForm, setUseManualCardForm] = useState(false);
  const [savedCardCvv, setSavedCardCvv] = useState("");

  // Card transparent checkout states
  const [cardName, setCardName]     = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv]       = useState("");
  const [cardCpf, setCardCpf]       = useState("");

  // Cash change state
  const [changeAmount, setChangeAmount] = useState("");

  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  const [couponData, setCouponData] = useState<any>(null);
  const [couponInput, setCouponInput]     = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError]     = useState<string | null>(null);

  const cepDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Header local animado (esconde/mostra no scroll) ───────────────────────
  // Igual ao Header global do _layout.js, só que isolado aqui porque o
  // checkout usa seu próprio header de back+título em vez do header padrão.
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const prevScrollY = useRef(0);
  const headerVisible = useRef(true);
  const [headerH, setHeaderH] = useState(60);

  const showHeader = () => {
    if (!headerVisible.current) {
      headerVisible.current = true;
      Animated.spring(headerTranslateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
    }
  };

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const delta = value - prevScrollY.current;
      prevScrollY.current = value;
      if (value <= 10) {
        showHeader();
      } else if (delta > 6 && headerVisible.current) {
        headerVisible.current = false;
        Animated.timing(headerTranslateY, { toValue: -headerH, duration: 220, useNativeDriver: true }).start();
      } else if (delta < -6 && !headerVisible.current) {
        showHeader();
      }
    });
    return () => scrollY.removeListener(id);
  }, [headerH]);

  const handleScroll = (e: any) => {
    const y = e?.nativeEvent?.contentOffset?.y ?? 0;
    scrollY.setValue(y);
  };

  // ── Handle payment method tap ─────────────────────────────────────────────
  async function handleSelectPayment(p: Payment) {
    setPayment(p);
    // Cartão na maquininha (entrega): não usa Mercado Pago, não precisa de
    // cartão salvo nem formulário — cai direto pro fluxo de "pending" igual dinheiro.
    if (p === "cartão de crédito (entrega)" || p === "cartão de débito (entrega)") {
      setSelectedSavedCard(null);
      setUseManualCardForm(false);
      return;
    }
    if (p === "cartão de crédito" || p === "cartão de débito") {
      const cards = savedCards.length > 0 ? savedCards : await loadSavedCards();
      const match = cards.find((c) => c.card_type === p);
      if (match) {
        setSelectedSavedCard(match);
        setUseManualCardForm(false);
        return;
      }
    }
    setSelectedSavedCard(null);
    setUseManualCardForm(true);
  }

  // ── Load session + endereços juntos (sem cascata de 2 useEffects) ─────────
  useEffect(() => {
    (async () => {
      // 1. Pega a session
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      if (s?.user) {
        setName(s.user.user_metadata?.full_name || "");
        setPhone(s.user.phone || s.user.user_metadata?.phone || "");

        // 2. Busca endereços imediatamente (sem esperar novo render)
        const { data } = await supabase
          .from("addresses").select("*")
          .eq("user_id", s.user.id)
          .order("is_default", { ascending: false });
        const addrs = (data ?? []) as Address[];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          const def = addrs.find((a) => a.is_default) || addrs[0];
          applyAddress(def);
        }
      }

      // 3. Carrega forma de pagamento preferida
      try {
        const savedMethod = await getPreferredPaymentMethod();
        if (savedMethod) setPayment(savedMethod as Payment);
        if (savedMethod === "cartão de crédito" || savedMethod === "cartão de débito") {
          const cards = await loadSavedCards();
          const preferredCardId = await getPreferredCardId();
          const match = preferredCardId
            ? cards.find((c) => c.id === preferredCardId)
            : cards.find((c) => c.is_default) || cards[0];
          if (match) {
            setSelectedSavedCard(match);
            setUseManualCardForm(false);
          } else {
            setUseManualCardForm(true);
          }
        }
      } catch (e) {
        console.error("Erro ao ler forma de pagamento preferida:", e);
      }
    })();
  }, []);

  // ── Coupon: validate + apply ─────────────────────────────────────────────
  async function applyCoupon(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) { setCouponError("Digite um cupom"); return; }

    setCouponLoading(true);
    setCouponError(null);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", code)
        .maybeSingle();

      if (error || !data) {
        setCouponError("Cupom não encontrado");
        setCouponData(null);
        return;
      }
      if (!data.active) {
        setCouponError("Esse cupom não está mais ativo");
        setCouponData(null);
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError("Esse cupom expirou");
        setCouponData(null);
        return;
      }
      if (data.max_uses != null && (data.current_uses ?? 0) >= data.max_uses) {
        setCouponError("Esse cupom atingiu o limite de usos");
        setCouponData(null);
        return;
      }
      if (data.min_order_value && subtotal < Number(data.min_order_value)) {
        setCouponError(
          `Pedido mínimo de R$ ${Number(data.min_order_value).toFixed(2).replace(".", ",")} para usar este cupom`
        );
        setCouponData(null);
        return;
      }
      if (data.max_uses_per_user && session?.user?.id) {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("coupon_code", data.code);
        if ((count ?? 0) >= data.max_uses_per_user) {
          setCouponError("Você já usou esse cupom o máximo de vezes permitido");
          setCouponData(null);
          return;
        }
      }

      setCouponData(data);
      setCouponInput(data.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setCouponError("Erro ao validar cupom. Tente novamente.");
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponData(null);
    setCouponInput("");
    setCouponError(null);
  }

  // ── Load coupon vindo por link (ex: compartilhamento) ───────────────────
  useEffect(() => {
    if (!couponCode) return;
    setCouponInput(String(couponCode).toUpperCase());
    applyCoupon(String(couponCode));
  }, [couponCode]);

  // ── CEP auto-lookup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (noKnowCep) return;
    const digits = cep.replace(/\D/g, "");
    if (digits.length < 8) {
      setCepError(null);
      return;
    }
    if (cepDebounce.current) clearTimeout(cepDebounce.current);
    cepDebounce.current = setTimeout(async () => {
      setCepLoading(true);
      setCepError(null);
      const result = await lookupCep(cep);
      setCepLoading(false);
      if (!result) {
        setCepError("CEP não encontrado.");
        setStreet(""); setNeighborhood("");
        return;
      }
      const cityNormalized = result.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (cityNormalized !== "iacanga" || result.uf.toLowerCase() !== "sp") {
        setCepError("Entregamos apenas em Iaçanga/SP.");
        setStreet(""); setNeighborhood("");
        return;
      }
      setStreet(toTitleCase(result.street));
      setNeighborhood(toTitleCase(result.neighborhood));
    }, 600);
    return () => { if (cepDebounce.current) clearTimeout(cepDebounce.current); };
  }, [cep, noKnowCep]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function applyAddress(a: Address) {
    setSelectedAddr(a.id);
    setCep(formatCep(a.cep));
    setStreet(a.street);
    setNumber(a.number);
    setComplement(a.complement || "");
    setNeighborhood(a.neighborhood);
  }

  const discount = couponData
    ? couponData.discount_type === "percent"
      ? subtotal * (Number(couponData.discount_value) / 100)
      : Number(couponData.discount_value)
    : 0;
  const deliveryFee = deliveryType === "delivery" ? 5.00 : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!name.trim())  return "Informe seu nome";
    if (!phone.trim()) return "Informe seu telefone";
    if (wantsCutlery === null) return "Informe se deseja talheres";
    if (deliveryType === "delivery") {
      if (!noKnowCep && cep.replace(/\D/g, "").length !== 8) return "Informe o CEP";
      if (!street.trim() || !number.trim() || !neighborhood.trim()) return "Preencha o endereço completo";
      if (cepError) return cepError;
    }
    if (items.length === 0) return "Sua sacola está vazia";
    // Cartão na entrega (maquininha) não exige nenhum dado extra — é só um rótulo.
    if (payment === "cartão de crédito" || payment === "cartão de débito") {
      if (selectedSavedCard && !useManualCardForm) {
        if (savedCardCvv.length < 3) return "Digite o CVV do cartão salvo";
      } else {
        if (!cardName.trim()) return "Informe o nome no cartão";
        if (cardNumber.replace(/\D/g, "").length < 15) return "Número de cartão inválido";
        if (cardExpiry.replace(/\D/g, "").length !== 4) return "Validade do cartão inválida";
        if (cardCvv.length < 3) return "Código de segurança (CVV) inválido";
        if (cardCpf.replace(/\D/g, "").length !== 11) return "CPF do titular inválido";
      }
    }
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    const v = validate();
    if (v) { setErr(v); return; }
    setSubmitting(true); setErr(null);

    // Buscar o maior order_number do banco para sequenciamento
    let orderNumber = 1;
    try {
      const { data: maxOrderData } = await supabase
        .from("orders")
        .select("order_number")
        .order("order_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxOrderData && maxOrderData.order_number) {
        orderNumber = Number(maxOrderData.order_number) + 1;
      }
    } catch (e) {
      orderNumber = Math.floor(1000 + Math.random() * 9000);
    }

    const customerAddress = deliveryType === "delivery"
      ? `${street}, ${number}`
      : "Rua carlos roberto crepaldi, 120";

    const customerNeighborhood = deliveryType === "delivery"
      ? neighborhood.trim()
      : "Centro";

    // Arredonda para 2 casas decimais (evita float como 23.990000001 que invalida o MP)
    const totalFinal = Math.round(total * 100) / 100;

    // Mercado Pago Payment Generation
    let pixDetails = null;
    if (payment === "pix") {
      const email = session?.user?.email || "cliente@batatatop.com";
      const pixResult = await createPixPayment(totalFinal, email, name.trim(), orderNumber);
      if (pixResult.success) {
        pixDetails = {
          qr_code: pixResult.qrCode,
          qr_code_base64: pixResult.qrCodeBase64,
          payment_id: pixResult.paymentId,
          order_id: pixResult.orderId,
          simulation: pixResult.simulation,
        };
      } else {
        setSubmitting(false);
        setErr(pixResult.error || "Erro ao gerar chave PIX");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    let cardDetails = null;
    if (payment === "cartão de crédito" || payment === "cartão de débito") {
      const email = session?.user?.email || "cliente@batatatop.com";

      if (selectedSavedCard && !useManualCardForm) {
        // ── Fluxo de cartão salvo: cobra direto com card_id + CVV ──────────
        const cardResult = await chargeWithSavedCard({
          amount: totalFinal,
          cardId: selectedSavedCard.mp_card_id,
          securityCode: savedCardCvv,
          paymentMethodId: selectedSavedCard.payment_method_id,
          email,
          name: selectedSavedCard.cardholder_name || name.trim(),
          docNumber: cardCpf || "00000000000",
          orderNumber,
        });

        if (cardResult.success) {
          if (cardResult.status === "rejected") {
            setSubmitting(false);
            setErr("Pagamento recusado pelo cartão. Verifique o CVV e tente novamente.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
          }

          cardDetails = {
            payment_id: cardResult.paymentId,
            status: cardResult.status,
            status_detail: cardResult.statusDetail,
            simulation: cardResult.simulation,
            brand: selectedSavedCard.payment_method_id,
            last4: selectedSavedCard.last_four,
            saved_card: true,
          };
        } else {
          setSubmitting(false);
          setErr(cardResult.error || "Erro ao processar pagamento do cartão salvo");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
      } else {
        // ── Fluxo manual: tokeniza o cartão digitado e cobra ────────────────
        const [expMonth, expYear] = cardExpiry.split("/");
        const fullYear = `20${expYear}`; // Ex: "28" -> "2028"

        const tokenResult = await tokenizeCard({
          cardNumber,
          expirationMonth: expMonth,
          expirationYear: fullYear,
          securityCode: cardCvv,
          cardholderName: cardName.trim(),
          docNumber: cardCpf,
        });

        if (!tokenResult.success || !tokenResult.token) {
          setSubmitting(false);
          setErr(tokenResult.error || "Erro ao processar dados do cartão");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }

        const paymentMethodId = guessPaymentMethodId(cardNumber);

        const cardResult = await createCardPayment({
          amount: totalFinal,
          token: tokenResult.token,
          paymentMethodId,
          email,
          name: cardName.trim(),
          docNumber: cardCpf,
          orderNumber,
        });

        if (cardResult.success) {
          if (cardResult.status === "rejected") {
            setSubmitting(false);
            setErr("Pagamento recusado pelo cartão. Verifique o número, saldo e validade.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
          }

          cardDetails = {
            payment_id: cardResult.paymentId,
            status: cardResult.status,
            status_detail: cardResult.statusDetail,
            simulation: cardResult.simulation,
            brand: paymentMethodId,
            last4: cardNumber.replace(/\D/g, "").slice(-4),
          };
        } else {
          setSubmitting(false);
          setErr(cardResult.error || "Erro ao processar pagamento do cartão");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
      }
    }

    let finalNotes = orderNotes.trim();
    if (payment === "dinheiro" && changeAmount.trim()) {
      const changeVal = changeAmount.trim().replace(/\D/g, "");
      if (changeVal) {
        finalNotes = `${finalNotes ? finalNotes + "\n" : ""}* Precisa de troco para R$ ${changeVal},00 *`;
      }
    }

    const orderPayload = {
      user_id: session?.user?.id || null,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_address: customerAddress,
      customer_neighborhood: customerNeighborhood,
      customer_complement: deliveryType === "delivery" ? complement.trim() || null : null,
      payment_method: payment,
      total_amount: total,
      discount_amount: discount,
      coupon_code: couponData?.code || null,
      status: payment === "pix" ? "awaiting_payment" : "pending",
      notes: finalNotes || null,
      delivery_type: deliveryType,
      order_number: orderNumber,
      wants_cutlery: wantsCutlery,
      metadata: {
        cep: deliveryType === "delivery" ? cep : null,
        source: "mobile_app",
        delivery_fee: deliveryFee,
        pix: pixDetails,
        card: cardDetails,
      },
    };

    const { data: created, error } = await supabase
      .from("orders").insert(orderPayload).select("id").single();

    if (error || !created) {
      setSubmitting(false);
      setErr(error?.message || "Erro ao criar pedido");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const itemRows = items.map((i: any) => ({
      order_id: created.id,
      product_id: i.id,
      product_name: i.nome,
      product_price: i.precoNum / 100,
      quantity: i.quantity,
      notes: i.observacoes || null,
      adicionais: (i.adicionais || []).map((a: any) => a.name),
    }));
    await supabase.from("order_items").insert(itemRows);

    if (couponData) {
      await supabase.from("coupons")
        .update({ current_uses: (couponData.current_uses ?? 0) + 1 })
        .eq("id", couponData.id);
    }

    notifyAdminNewOrder(created.id);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clear();
    setSubmitting(false);

    router.replace(`/pedidos/${created.id}`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="checkout-screen">
      {/* Header (estilo iFood: back + título centralizado + ação "Limpar") */}
      <Animated.View
        style={[styles.header, styles.headerAnimated, { transform: [{ translateY: headerTranslateY }] }]}
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="checkout-back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Finalizar pedido</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            clear();
            router.back();
          }}
          style={styles.headerClearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID="checkout-clear"
        >
          <Text style={styles.headerClearText}>Limpar</Text>
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingTop: headerH + spacing.lg, paddingBottom: insets.bottom + 160 }}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >

          {/* ── Intro ── */}
          <View style={styles.introCard}>
            <View style={styles.introIconWrap}>
              <Ionicons name="bag-check-outline" size={22} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>
                {name ? `Quase lá, ${name.split(" ")[0]}!` : "Quase lá!"}
              </Text>
              <Text style={styles.introSubtitle}>
                {items.length} {items.length === 1 ? "item" : "itens"} na sacola · confira os dados abaixo
              </Text>
            </View>
          </View>

          {/* ── Itens do pedido (sacola, estilo iFood) ── */}
          <View style={styles.bagHeaderRow}>
            <SectionLabel icon="bag-handle-outline" label="Seus Itens" />
          </View>
          <View style={styles.bagCard}>
            {items.map((i: any, idx: number) => {
              const lineTotal = (i.precoNum / 100) * i.quantity;
              const extras: string[] = (i.adicionais || []).map((a: any) => a.name);
              return (
                <View
                  key={i.cartItemId ?? `${i.id}-${idx}`}
                  style={[styles.bagItemRow, idx > 0 && styles.bagItemRowDivider]}
                >
                  <Text style={styles.bagItemQty}>{i.quantity}x</Text>
                  <View style={styles.bagItemBody}>
                    <Text style={styles.bagItemName} numberOfLines={2}>{i.nome}</Text>
                    {extras.length > 0 && (
                      <Text style={styles.bagItemExtra} numberOfLines={3}>
                        {extras.join(", ")}
                      </Text>
                    )}
                    {!!i.observacoes && (
                      <Text style={styles.bagItemObs} numberOfLines={2}>
                        Obs: {i.observacoes}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.bagItemPrice}>
                    R$ {lineTotal.toFixed(2).replace(".", ",")}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ── 1. Dados pessoais ── */}
          <SectionLabel icon="person-outline" label="Seus Dados" />
          <TextInput
            value={name}
            onChangeText={(t) => setName(toTitleCase(t))}
            placeholder="Nome completo"
            placeholderTextColor={colors.muted}
            style={styles.input}
            testID="checkout-name"
          />
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(formatPhone(t))}
            placeholder="Telefone (WhatsApp)"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={styles.input}
            testID="checkout-phone"
          />

          {/* ── 2. Tipo de entrega ── */}
          <SectionLabel icon="bicycle-outline" label="Entrega" />
          <View style={styles.segment}>
            {(["delivery", "retirada"] as DeliveryType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.segBtn, deliveryType === t && styles.segBtnActive]}
                onPress={() => setDeliveryType(t)}
                testID={`delivery-${t}`}
              >
                <Ionicons
                  name={t === "delivery" ? "bicycle" : "walk"}
                  size={16}
                  color={deliveryType === t ? "#FFF" : colors.onSurface}
                />
                <Text style={[styles.segText, deliveryType === t && styles.segTextActive]}>
                  {t === "delivery" ? "Entrega" : "Retirada"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Endereço de retirada */}
          {deliveryType === "retirada" && (
            <View style={styles.cardFormContainer}>
              <Text style={styles.cardFormTitle}>Endereço para Retirada</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <Ionicons name="location" size={20} color="#EA580C" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurface }}>
                    Rua carlos roberto crepaldi, 120
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 }}>
                    Batata Top - Centro, Iaçanga - SP
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── 3. Endereço (só delivery) ── */}
          {deliveryType === "delivery" && (
            <View>
              {/* Chips de endereços salvos */}
              {savedAddresses.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
                >
                  {savedAddresses.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.addrChip, selectedAddr === a.id && styles.addrChipActive]}
                      onPress={() => applyAddress(a)}
                      testID={`saved-address-${a.id}`}
                    >
                      <Text
                        style={[styles.addrChipText, selectedAddr === a.id && { color: "#FFF" }]}
                        numberOfLines={1}
                      >
                        {a.street}, {a.number}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* CEP primeiro */}
              <View style={styles.cepRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={cep}
                    onChangeText={(t) => {
                      setCep(formatCep(t));
                      setSelectedAddr(null);
                    }}
                    placeholder="CEP"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    editable={!noKnowCep}
                    style={[styles.input, { marginBottom: 0 }, noKnowCep && styles.inputDisabled]}
                    testID="checkout-cep"
                  />
                  {cepLoading && (
                    <ActivityIndicator
                      size="small"
                      color={colors.brand}
                      style={styles.cepSpinner}
                    />
                  )}
                </View>
              </View>

              {cepError && !noKnowCep && (
                <Text style={styles.fieldErr}>{cepError}</Text>
              )}

              {/* Checkbox "Não sei meu CEP" */}
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => {
                  setNoKnowCep((v) => !v);
                  if (!noKnowCep) { setCep(""); setCepError(null); }
                }}
                testID="no-cep-toggle"
              >
                <View style={[styles.checkbox, noKnowCep && styles.checkboxChecked]}>
                  {noKnowCep && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={styles.checkLabel}>Não sei meu CEP</Text>
              </TouchableOpacity>

              {/* Rua + número */}
              <View style={styles.row2}>
                <TextInput
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Rua"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { flex: 2 }]}
                  testID="checkout-street"
                />
                <TextInput
                  value={number}
                  onChangeText={setNumber}
                  placeholder="Nº"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { flex: 1 }]}
                  testID="checkout-number"
                />
              </View>

              <TextInput
                value={complement}
                onChangeText={setComplement}
                placeholder="Complemento (opcional)"
                placeholderTextColor={colors.muted}
                style={styles.input}
                testID="checkout-complement"
              />

              <TextInput
                value={neighborhood}
                onChangeText={setNeighborhood}
                placeholder="Bairro"
                placeholderTextColor={colors.muted}
                style={styles.input}
                testID="checkout-neighborhood"
              />

              <View style={styles.cityTag}>
                <Ionicons name="location-outline" size={13} color={colors.brand} />
                <Text style={styles.cityTagText}>Entregamos apenas em Iaçanga/SP</Text>
              </View>
            </View>
          )}

          {/* ── 4. Talheres (obrigatório) ── */}
          <SectionLabel icon="restaurant-outline" label="Talheres" />
          <View style={styles.cutleryRow}>
            {[
              { val: true,  icon: "checkmark-circle" as const, label: "Sim, quero talheres" },
              { val: false, icon: "close-circle"     as const, label: "Não preciso" },
            ].map((opt) => (
              <TouchableOpacity
                key={String(opt.val)}
                style={[styles.cutleryBtn, wantsCutlery === opt.val && styles.cutleryBtnActive]}
                onPress={() => setWantsCutlery(opt.val)}
                testID={`cutlery-${opt.val}`}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={wantsCutlery === opt.val ? colors.brand : colors.muted}
                />
                <Text style={[styles.cutleryText, wantsCutlery === opt.val && { color: colors.brand, fontWeight: "700" }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 5. Pagamento (estilo iFood: lista agrupada) ── */}
          <SectionLabel icon="wallet-outline" label="Pagamento" />

          <Text style={styles.payGroupLabel}>Pague pelo app</Text>
          <View style={styles.payCard}>
            {([
              { key: "pix" as Payment, icon: "qr-code" as const, title: "Pix", subtitle: "Aprovação na hora" },
              { key: "cartão de crédito" as Payment, icon: "card" as const, title: "Cartão de crédito", subtitle: "Online, via Mercado Pago" },
              { key: "cartão de débito" as Payment, icon: "card-outline" as const, title: "Cartão de débito", subtitle: "Online, via Mercado Pago" },
            ]).map((opt, idx) => {
              const active = payment === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.payRow, idx > 0 && styles.payRowDivider]}
                  onPress={() => handleSelectPayment(opt.key)}
                  activeOpacity={0.7}
                  testID={`payment-${opt.key.replace(/\s/g, "-")}`}
                >
                  <View style={[styles.payIconWrap, active && styles.payIconWrapActive]}>
                    <Ionicons name={opt.icon} size={20} color={active ? colors.brand : colors.onSurfaceSecondary} />
                  </View>
                  <View style={styles.payRowTextWrap}>
                    <Text style={[styles.payRowTitle, active && styles.payRowTitleActive]}>{opt.title}</Text>
                    <Text style={styles.payRowSubtitle}>{opt.subtitle}</Text>
                  </View>
                  <View style={[styles.payRadioOuter, active && styles.payRadioOuterActive]}>
                    {active && <View style={styles.payRadioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.payGroupLabel}>Pague na entrega</Text>
          <View style={styles.payCard}>
            {([
              { key: "dinheiro" as Payment, icon: "cash" as const, title: "Dinheiro", subtitle: "Pague direto com o entregador" },
              { key: "cartão de crédito (entrega)" as Payment, icon: "card" as const, title: "Cartão de crédito", subtitle: "Na maquininha, na entrega" },
              { key: "cartão de débito (entrega)" as Payment, icon: "card-outline" as const, title: "Cartão de débito", subtitle: "Na maquininha, na entrega" },
            ]).map((opt, idx) => {
              const active = payment === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.payRow, idx > 0 && styles.payRowDivider]}
                  onPress={() => handleSelectPayment(opt.key)}
                  activeOpacity={0.7}
                  testID={`payment-${opt.key.replace(/[\s()]+/g, "-").replace(/-+/g, "-").replace(/-$/, "")}`}
                >
                  <View style={[styles.payIconWrap, active && styles.payIconWrapActive]}>
                    <Ionicons name={opt.icon} size={20} color={active ? colors.brand : colors.onSurfaceSecondary} />
                  </View>
                  <View style={styles.payRowTextWrap}>
                    <Text style={[styles.payRowTitle, active && styles.payRowTitleActive]}>{opt.title}</Text>
                    <Text style={styles.payRowSubtitle}>{opt.subtitle}</Text>
                  </View>
                  <View style={[styles.payRadioOuter, active && styles.payRadioOuterActive]}>
                    {active && <View style={styles.payRadioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Card transparent checkout form fields (só pagamento online via Mercado Pago) */}
          {(payment === "cartão de crédito" || payment === "cartão de débito") && (
            <View style={styles.cardFormContainer}>
              {selectedSavedCard && !useManualCardForm ? (
                <>
                  <Text style={styles.cardFormTitle}>Cartão salvo</Text>
                  <View style={styles.savedCardRow}>
                    <Ionicons name="card" size={20} color={colors.brand} />
                    <Text style={styles.savedCardLabel}>{formatCardDisplay(selectedSavedCard)}</Text>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  </View>

                  <TextInput
                    value={savedCardCvv}
                    onChangeText={(text) => setSavedCardCvv(text.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Digite o CVV para confirmar"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    style={styles.cardInput}
                    testID="saved-card-cvv"
                  />

                  <TouchableOpacity
                    onPress={() => { setUseManualCardForm(true); setSelectedSavedCard(null); }}
                    style={styles.useOtherCardBtn}
                  >
                    <Text style={styles.useOtherCardText}>Usar outro cartão</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.cardFormTitle}>Dados do Cartão (Mercado Pago)</Text>

                  {savedCards.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        const match = savedCards.find((c) => c.card_type === payment);
                        if (match) {
                          setSelectedSavedCard(match);
                          setUseManualCardForm(false);
                        }
                      }}
                      style={styles.useOtherCardBtn}
                    >
                      <Text style={styles.useOtherCardText}>Usar cartão salvo</Text>
                    </TouchableOpacity>
                  )}

                  <TextInput
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="Nome impresso no cartão"
                    placeholderTextColor={colors.muted}
                    style={styles.cardInput}
                    testID="card-holder-name"
                  />

                  <View style={styles.cardRow}>
                    <TextInput
                      value={cardNumber}
                      onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                      placeholder="Número do cartão"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      maxLength={19}
                      style={[styles.cardInput, { flex: 2 }]}
                      testID="card-number"
                    />
                    <TextInput
                      value={cardCvv}
                      onChangeText={(text) => setCardCvv(text.replace(/\D/g, "").slice(0, 4))}
                      placeholder="CVV"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      maxLength={4}
                      style={[styles.cardInput, { flex: 1, marginLeft: 8 }]}
                      testID="card-cvv"
                    />
                  </View>

                  <View style={styles.cardRow}>
                    <TextInput
                      value={cardExpiry}
                      onChangeText={(text) => setCardExpiry(formatCardExpiry(text))}
                      placeholder="Validade (MM/AA)"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      maxLength={5}
                      style={[styles.cardInput, { flex: 1 }]}
                      testID="card-expiry"
                    />
                    <TextInput
                      value={cardCpf}
                      onChangeText={(text) => setCardCpf(formatCpf(text))}
                      placeholder="CPF do titular"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      maxLength={14}
                      style={[styles.cardInput, { flex: 1.5, marginLeft: 8 }]}
                      testID="card-cpf"
                    />
                  </View>
                </>
              )}
            </View>
          )}

          {/* Troco para dinheiro */}
          {payment === "dinheiro" && (
            <View style={styles.cardFormContainer}>
              <Text style={styles.cardFormTitle}>Precisa de troco?</Text>
              <TextInput
                value={changeAmount}
                onChangeText={(text) => setChangeAmount(text.replace(/\D/g, ""))}
                placeholder="Troco para quanto? (Ex: 50, 100)"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={styles.cardInput}
                testID="cash-change-amount"
              />
            </View>
          )}

          {/* ── 6. Observações ── */}
          <SectionLabel icon="chatbubble-ellipses-outline" label="Observações" />
          <TextInput
            value={orderNotes}
            onChangeText={setOrderNotes}
            placeholder="Ex: troco para R$ 50, molho à parte..."
            placeholderTextColor={colors.muted}
            style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
            multiline
            testID="checkout-order-notes"
          />

          {/* ── 7. Cupom de desconto ── */}
          <SectionLabel icon="pricetag-outline" label="Cupom de desconto" />
          {couponData ? (
            <View style={styles.couponAppliedRow} testID="coupon-applied">
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.couponAppliedCode}>{couponData.code}</Text>
                <Text style={styles.couponAppliedDesc}>
                  {couponData.discount_type === "percent"
                    ? `${Number(couponData.discount_value)}% de desconto aplicado`
                    : `R$ ${Number(couponData.discount_value).toFixed(2).replace(".", ",")} de desconto aplicado`}
                </Text>
              </View>
              <TouchableOpacity onPress={removeCoupon} testID="coupon-remove">
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.couponRow}>
                <TextInput
                  value={couponInput}
                  onChangeText={(t) => { setCouponInput(t.toUpperCase()); setCouponError(null); }}
                  placeholder="Digite seu cupom"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  testID="coupon-input"
                />
                <TouchableOpacity
                  style={[styles.couponBtn, (couponLoading || !couponInput.trim()) && { opacity: 0.5 }]}
                  onPress={() => applyCoupon(couponInput)}
                  disabled={couponLoading || !couponInput.trim()}
                  testID="coupon-apply"
                >
                  {couponLoading
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={styles.couponBtnText}>Aplicar</Text>}
                </TouchableOpacity>
              </View>
              {couponError && <Text style={styles.fieldErr} testID="coupon-error">{couponError}</Text>}
            </View>
          )}

          {/* ── 8. Resumo ── */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Resumo do pedido</Text>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Subtotal ({items.length} {items.length === 1 ? "item" : "itens"})</Text>
              <Text style={styles.sumValue}>R$ {subtotal.toFixed(2).replace(".", ",")}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Taxa de entrega</Text>
              <Text style={styles.sumValue}>
                {deliveryType === "delivery" ? "R$ 5,00" : "Grátis (Retirada)"}
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Desconto ({couponData?.code})</Text>
                <Text style={[styles.sumValue, { color: colors.success }]}>
                  - R$ {discount.toFixed(2).replace(".", ",")}
                </Text>
              </View>
            )}
            <View style={[styles.sumRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 }]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue} testID="checkout-total">
                R$ {total.toFixed(2).replace(".", ",")}
              </Text>
            </View>
          </View>

          {err && (
            <View style={styles.errCard} testID="checkout-error">
              <Ionicons name="alert-circle" size={20} color="#B45309" style={{ marginTop: 1 }} />
              <Text style={styles.errCardText}>{err}</Text>
              <TouchableOpacity onPress={() => setErr(null)} style={styles.errClose}>
                <Ionicons name="close" size={16} color="#B45309" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.submit}
          onPress={submit}
          disabled={submitting}
          testID="checkout-place-order-button"
        >
          {submitting
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.submitText}>Confirmar pedido</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Section label helper ─────────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }) {
  return (
    <View style={slStyles.row}>
      <Ionicons name={icon} size={14} color={colors.muted} />
      <Text style={slStyles.text}>{label}</Text>
    </View>
  );
}
const slStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.lg, marginBottom: 8 },
  text: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerAnimated: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: colors.surface,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: colors.onSurface, marginHorizontal: 4 },
  headerClearBtn: { minWidth: 40, height: 40, alignItems: "flex-end", justifyContent: "center" },
  headerClearText: { fontSize: 14, fontWeight: "700", color: colors.brandDark },

  input: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.onSurface, marginBottom: 8,
  },
  inputDisabled: { opacity: 0.4 },

  row2: { flexDirection: "row", gap: 8 },

  // Segment (delivery type)
  segment: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: 999, padding: 4 },
  segBtn: { flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", alignItems: "center", paddingVertical: 10, borderRadius: 999 },
  segBtnActive: { backgroundColor: colors.brand },
  segText: { fontWeight: "700", color: colors.onSurface },
  segTextActive: { color: "#FFF" },

  // Saved address chips
  addrChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surfaceSecondary, borderRadius: 999, maxWidth: 180 },
  addrChipActive: { backgroundColor: colors.brand },
  addrChipText: { color: colors.onSurface, fontWeight: "600", fontSize: 12 },

  // CEP
  cepRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cepSpinner: { position: "absolute", right: 14, top: 14 },
  fieldErr: { color: colors.error, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: -2 },

  // No CEP checkbox
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 2 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 2,
    borderColor: colors.muted, alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },

  // City tag
  cityTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 2, marginBottom: 8,
  },
  cityTagText: { fontSize: 12, color: colors.brand, fontWeight: "600" },

  // Cutlery
  cutleryRow: { flexDirection: "row", gap: 8 },
  cutleryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    padding: 14, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.divider,
    backgroundColor: colors.surfaceSecondary,
  },
  cutleryBtnActive: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  cutleryText: { fontSize: 13, color: colors.muted, fontWeight: "600", flexShrink: 1 },

  // ── Payment (estilo iFood: lista agrupada, radio à direita) ──────────────
  payGroupLabel: {
    fontSize: 11, fontWeight: "800", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.6,
    marginTop: 14, marginBottom: 6, marginLeft: 2,
  },
  payCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  payRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
  },
  payRowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  payIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  payIconWrapActive: { backgroundColor: colors.brandTertiary },
  payRowTextWrap: { flex: 1 },
  payRowTitle: { fontSize: 14.5, fontWeight: "700", color: colors.onSurface },
  payRowTitleActive: { color: colors.brandDark },
  payRowSubtitle: { fontSize: 12, color: colors.muted, fontWeight: "500", marginTop: 2 },
  payRadioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: "center", justifyContent: "center",
  },
  payRadioOuterActive: { borderColor: colors.brand },
  payRadioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.brand },

  // ── Itens do pedido (estilo sacola iFood) ─────────────────────────────────
  bagHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bagCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 14,
  },
  bagItemRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 14 },
  bagItemRowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  bagItemQty: { fontSize: 14, fontWeight: "700", color: colors.onSurface, minWidth: 26 },
  bagItemBody: { flex: 1 },
  bagItemName: { fontSize: 14.5, fontWeight: "700", color: colors.onSurface, lineHeight: 19 },
  bagItemExtra: { fontSize: 12.5, color: colors.muted, marginTop: 3, lineHeight: 17 },
  bagItemObs: { fontSize: 12.5, color: colors.onSurfaceSecondary, fontStyle: "italic", marginTop: 3, lineHeight: 17 },
  bagItemPrice: { fontSize: 14, fontWeight: "700", color: colors.onSurface },

  // Summary
  summary: {
    marginTop: spacing.xl, padding: 16, backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.divider,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  summaryTitle: { fontSize: 13, fontWeight: "800", color: colors.onSurface, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  sumLabel: { color: colors.muted, fontSize: 13.5 },
  sumValue: { color: colors.onSurface, fontWeight: "600", fontSize: 13.5 },
  totalLabel: { fontWeight: "800", fontSize: 16, color: colors.onSurface },
  totalValue: { fontWeight: "800", fontSize: 20, color: colors.brand },

  err: { color: colors.error, marginTop: 12, fontWeight: "600" },
  errCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  errCardText: {
    flex: 1,
    color: "#92400E",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  errClose: {
    padding: 2,
    marginTop: 1,
  },

  // Intro card
  introCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.brandTertiary, borderRadius: radius.lg,
    padding: 14, marginBottom: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  introIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#FFF", alignItems: "center", justifyContent: "center",
  },
  introTitle: { fontSize: 16, fontWeight: "800", color: colors.onSurface },
  introSubtitle: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2, fontWeight: "600" },

  // Coupon
  couponRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  couponBtn: {
    backgroundColor: colors.brand, borderRadius: radius.md,
    paddingHorizontal: 18, paddingVertical: 12, alignItems: "center", justifyContent: "center",
  },
  couponBtnText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  couponAppliedRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#EFFAF3", borderRadius: radius.lg,
    borderWidth: 1, borderColor: "#CDEFD9",
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  couponAppliedCode: { fontWeight: "800", color: colors.onSurface, fontSize: 14, letterSpacing: 0.5 },
  couponAppliedDesc: { fontSize: 12, color: colors.success, fontWeight: "600", marginTop: 1 },

  // Footer
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  submit: { backgroundColor: colors.brand, paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  submitText: { color: "#FFF", fontWeight: "800", fontSize: 16 },

  // Card form transparent checkout styles
  cardFormContainer: {
    marginTop: 12,
    backgroundColor: '#FFFDF9',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    padding: 14,
    gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  cardFormTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 0,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  savedCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  savedCardLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  useOtherCardBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 4,
  },
  useOtherCardText: {
    color: colors.brand,
    fontWeight: '700',
    fontSize: 12,
  },
});
