import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * ProfileAccordionItem
 *
 * Réplica do accordion de "Configurações / Conta / Ajuda e Termos" do
 * perfil deslogado do iFood — usado só na tela de perfil (profile.js).
 *
 * Bug do iFood que corrigimos aqui: lá o `subtitle` (texto exibido fechado)
 * lista coisas que não existem quando você abre (ex: mostra "Segurança,
 * notificações, dispositivos e mais" fechado, mas só tem 1 item dentro
 * quando abre). Aqui o `subtitle` tem que ser SEMPRE igual ao que
 * realmente existe em `items` — é assim que profile.js está chamando esse
 * componente, não precisa mexer em nada aqui pra manter isso certo.
 *
 * Props:
 * - icon: nome do ícone Ionicons (string)
 * - title: string
 * - subtitle: string
 * - items: [{ label: string, onPress: () => void }]
 */
export default function ProfileAccordionItem({ icon, title, subtitle, items = [] }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded((prev) => !prev);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View>
      <Pressable style={styles.header} onPress={toggleExpand}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={22} color={COLORS.text} />
        </View>

        <View style={styles.textBox}>
          <Text style={styles.title}>{title}</Text>
          {!expanded && subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color={COLORS.text} />
        </Animated.View>
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          {items.map((item, index) => (
            <Pressable
              key={item.label + index}
              style={styles.itemRow}
              onPress={item.onPress}
            >
              <Text style={styles.itemLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[4] ?? 16,
  },
  iconBox: {
    width: 26,
    alignItems: 'center',
    marginRight: SPACING[3] ?? 12,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '500',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  content: {
    paddingLeft: 38,
    paddingBottom: SPACING[1] ?? 6,
  },
  itemRow: {
    paddingVertical: SPACING[3] ?? 12,
  },
  itemLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
