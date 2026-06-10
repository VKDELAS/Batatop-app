import { Stack } from 'expo-router';
import { View, Text, StatusBar, StyleSheet, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function Header() {
  return (
    <SafeAreaView style={s.headerSafe} edges={['top']}>
      <View style={s.headerRow}>
        <View style={s.logoRow}>
          <Image
            source={{ uri: 'https://batatop.vercel.app/logo.png' }}
            style={s.logoImg}
            resizeMode="contain"
          />
          <Text style={s.logoTitle}>batata top</Text>
        </View>
        <Text style={s.locText}>Iacanga · SP</Text>
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#111111" barStyle="light-content" />
      <Header />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9F5F0' },
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  headerSafe: { backgroundColor: '#111111' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 34, height: 34 },
  logoTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  locText: {
    color: '#A3A3A3',
    fontSize: 13,
    fontWeight: '600',
  },
});
