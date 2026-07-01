import { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Modal, Image, TouchableOpacity,
  Animated, ActivityIndicator, ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { checkPixStatus } from "../utils/mercadoPago";

const colors = {
  surface: "#FFFFFF",
  onSurface: "#1A1A1A",
  onSurfaceSecondary: "#666666",
  brand: "#FFB800",
  success: "#27AE60",
  border: "#EEEEEE",
  surfaceSecondary: "#F8F8F8",
  muted: "#999999",
};

type Props = {
  visible: boolean;
  qrCode?: string | null;        // código "copia e cola"
  qrCodeBase64?: string | null;  // imagem do QR em base64 (sem o prefixo data:image)
  orderId?: string | null;       // id do pedido no Mercado Pago, usado pro polling
  amount?: number;
  onPaid: () => void;            // chamado quando o pagamento é confirmado
  onClose: () => void;           // chamado quando o usuário fecha manualmente
};

export default function PixModal({ visible, qrCode, qrCodeBase64, orderId, amount, onPaid, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(true);
  const [paid, setPaid] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Polling: pergunta pro backend a cada 4s se o pagamento já caiu ─────────
  useEffect(() => {
    if (!visible || !orderId) return;

    setPaid(false);
    setChecking(true);

    const poll = async () => {
      const result = await checkPixStatus(orderId);
      if (!result.success) return;

      const isPaid =
        result.statusDetail === "accredited" ||
        result.paymentStatus === "approved" ||
        result.status === "processed";

      if (isPaid) {
        setPaid(true);
        setChecking(false);
        if (pollRef.current) clearInterval(pollRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(onPaid, 1200); // dá um respiro pra mostrar o "Pago!" antes de sair
      }
    };

    poll(); // checa imediatamente
    pollRef.current = setInterval(poll, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [visible, orderId]);

  async function handleCopy() {
    if (!qrCode) return;
    await Clipboard.setStringAsync(qrCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();

    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.handle} />

            {paid ? (
              <View style={styles.paidWrap}>
                <View style={styles.paidIconWrap}>
                  <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                </View>
                <Text style={styles.paidTitle}>Pagamento confirmado!</Text>
                <Text style={styles.paidSubtitle}>Seu pedido já está sendo preparado.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Pague com PIX</Text>
                {typeof amount === "number" && (
                  <Text style={styles.amount}>R$ {amount.toFixed(2).replace(".", ",")}</Text>
                )}

                {qrCodeBase64 ? (
                  <View style={styles.qrWrap}>
                    <Image
                      source={{ uri: `data:image/png;base64,${qrCodeBase64}` }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={[styles.qrWrap, styles.qrPlaceholder]}>
                    <ActivityIndicator color={colors.brand} />
                  </View>
                )}

                <Text style={styles.helperText}>
                  Abra o app do seu banco, escaneie o QR Code acima ou copie o código abaixo
                </Text>

                {!!qrCode && (
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText} numberOfLines={2} ellipsizeMode="middle">
                      {qrCode}
                    </Text>
                  </View>
                )}

                <Animated.View style={{ transform: [{ scale: scaleAnim }], width: "100%" }}>
                  <TouchableOpacity
                    style={[styles.copyBtn, copied && styles.copyBtnDone]}
                    onPress={handleCopy}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={copied ? "checkmark" : "copy-outline"}
                      size={18}
                      color="#FFF"
                    />
                    <Text style={styles.copyBtnText}>
                      {copied ? "Código copiado!" : "Copiar código PIX"}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.statusRow}>
                  {checking ? (
                    <>
                      <ActivityIndicator size="small" color={colors.muted} />
                      <Text style={styles.statusText}>Aguardando confirmação do pagamento...</Text>
                    </>
                  ) : (
                    <Text style={styles.statusText}>Assim que você pagar, confirmamos automaticamente.</Text>
                  )}
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeBtnText}>Fechar e ver pedido</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  scrollContent: { alignItems: "center", paddingTop: 8 },
  handle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: colors.border, marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.onSurface, marginTop: 4 },
  amount: { fontSize: 28, fontWeight: "900", color: colors.brand, marginTop: 4, marginBottom: 16 },

  qrWrap: {
    width: 220, height: 220, backgroundColor: "#FFF",
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center", padding: 12, marginBottom: 14,
  },
  qrPlaceholder: { backgroundColor: colors.surfaceSecondary },
  qrImage: { width: "100%", height: "100%" },

  helperText: {
    fontSize: 13, color: colors.onSurfaceSecondary, textAlign: "center",
    marginBottom: 14, paddingHorizontal: 8,
  },

  codeBox: {
    width: "100%", backgroundColor: colors.surfaceSecondary,
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  codeText: { fontSize: 12, color: colors.onSurfaceSecondary, fontFamily: "monospace" },

  copyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.brand, borderRadius: 999, paddingVertical: 14, width: "100%",
  },
  copyBtnDone: { backgroundColor: colors.success },
  copyBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },

  statusRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 18, marginBottom: 8,
  },
  statusText: { fontSize: 12, color: colors.muted, fontWeight: "600" },

  closeBtn: { marginTop: 8, paddingVertical: 10 },
  closeBtnText: { color: colors.onSurfaceSecondary, fontWeight: "700", fontSize: 13 },

  paidWrap: { alignItems: "center", paddingVertical: 24 },
  paidIconWrap: { marginBottom: 12 },
  paidTitle: { fontSize: 20, fontWeight: "800", color: colors.onSurface, marginBottom: 6 },
  paidSubtitle: { fontSize: 14, color: colors.onSurfaceSecondary },
});
