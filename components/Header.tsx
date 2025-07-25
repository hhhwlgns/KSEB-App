import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
}

export default function Header({ title, subtitle, showBack = false, rightComponent }: HeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent && (
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: SIZES.headerHeight,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: SIZES.sm,
    padding: SIZES.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.fontXL,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: SIZES.md,
  },
});