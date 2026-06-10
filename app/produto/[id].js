import { View, Text, ScrollView, Image, Linking, Alert, StyleSheet, Animated, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getProdutoById } from '../../data/produtos';

// Helper component for premium bouncy scale feedback
function PressableScale({ children, onPress, style, activeOpacity = 0.95 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: activeOpacity,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

async function abrirWhatsApp(produto) {
  const mensagem = `Olá, batata top! Gostaria de pedir: *${produto.nome}* - ${produto.preco}`;
  const url = `https://wa.me/5514997361015?text=${encodeURIComponent(mensagem)}`;
  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Erro', 'Não foi possível abrir o WhatsApp. Instale o aplicativo ou tente novamente.');
  }
}

export default function Produto() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const produto = getProdutoById(id);

  if (!produto) {
    return (
      <View style={s.notFound}>
        <Text style={s.notFoundTitle}>Produto não encontrado</Text>
        <PressableScale style={s.notFoundBtn} onPress={() => router.back()}>
          <Text style={s.notFoundBtnText}>Voltar ao cardápio</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* HERO IMAGE */}
        <View style={s.imageContainer}>
          <Image source={{ uri: produto.imagem }} style={s.heroImg} resizeMode="cover" />
          <PressableScale onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" style={s.backIcon} />
          </PressableScale>
        </View>

        {/* CONTENT */}
        <View style={s.content}>
          <View style={s.titleRow}>
            <Text style={s.nome}>{produto.nome}</Text>
            <Text style={s.preco}>{produto.preco}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.section}>
            <Text style={s.sectionTitle}>Ingredientes</Text>
            <Text style={s.desc}>{produto.descricao}</Text>
          </View>
        </View>
      </ScrollView>

      {/* FIXED FOOTER BUTTON */}
      <View style={s.footer}>
        <PressableScale style={s.whatsBtn} onPress={() => abrirWhatsApp(produto)}>
          <Text style={s.whatsBtnText}>Pedir pelo WhatsApp</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  scrollContent: {
    paddingBottom: 130, // Extra padding to clear the fixed bottom footer
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 260,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  backIcon: {
    // Text shadow for high readability on any Unsplash image background
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  content: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20, // Overlays the image slightly for a premium card effect
    minHeight: 300,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  nome: {
    color: '#1A1A1A',
    fontWeight: '800',
    fontSize: 24,
    flex: 1,
    letterSpacing: -0.5,
  },
  preco: {
    color: '#C8321A',
    fontWeight: '800',
    fontSize: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#ECE6DC',
    marginVertical: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  desc: {
    color: '#6B6B6B',
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#ECE6DC',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  whatsBtn: {
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notFound: {
    flex: 1,
    backgroundColor: '#F9F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  notFoundBtn: {
    backgroundColor: '#C8321A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  notFoundBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
