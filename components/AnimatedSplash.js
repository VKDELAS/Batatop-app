import { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const BRAND_RED = '#FF0000';

/**
 * Splash animada usando vídeo (MP4 exportado do Jitter).
 *
 * - Fundo vermelho atrás do vídeo: cobre as barras do resizeMode="contain"
 *   (o vídeo não preenche a tela toda sem cortar, então sobra espaço nas
 *   bordas — antes aparecia branco, agora aparece vermelho, combinando
 *   com o fundo do próprio vídeo).
 * - Faixas vermelhas fixas em cima e embaixo: reforço por cima do vídeo.
 *   A de baixo é mais grossa de propósito — cobre tanto a barra quanto a
 *   marca d'água "jitter.video" (export gratuito do Jitter), já que remover
 *   ela de dentro do vídeo em si só dá pra fazer exportando num plano pago.
 * - Enquanto o vídeo carrega, mostra a logo centralizada no lugar de tela preta.
 *
 * zIndex é essencial: mesmo renderizado antes do resto do app na árvore,
 * sem isso ele fica por baixo de tudo que é desenhado depois dele.
 */
export default function AnimatedSplash({ onFinish }) {
  const [videoReady, setVideoReady] = useState(false);

  const player = useVideoPlayer(require('../assets/splash-animation.mp4'), (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.play();
  });

  useEffect(() => {
    const statusSubscription = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') {
        setVideoReady(true);
      } else if (status === 'error') {
        console.warn('Erro ao tocar splash:', error);
        onFinish?.();
      }
    });

    const finishSubscription = player.addListener('playToEnd', () => {
      onFinish?.();
    });

    return () => {
      statusSubscription.remove();
      finishSubscription.remove();
    };
  }, [player, onFinish]);

  return (
    <View style={styles.container}>
      {!videoReady && (
        <View style={styles.loadingScreen}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}

      <VideoView
        player={player}
        style={[StyleSheet.absoluteFillObject, { opacity: videoReady ? 1 : 0 }]}
        contentFit="contain"
        nativeControls={false}
      />

      {/* Faixas de reforço — cobrem barras + marca d'água */}
      <View style={styles.topBar} pointerEvents="none" />
      <View style={styles.bottomBar} pointerEvents="none" />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999, // necessário no Android pra respeitar o zIndex
    backgroundColor: BRAND_RED,
  },
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4%',
    backgroundColor: BRAND_RED,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '19%', // grossa o suficiente pra cobrir a marca d'água
    backgroundColor: BRAND_RED,
  },
});
