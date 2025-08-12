import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // 로고 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 텍스트 애니메이션 (약간 딜레이)
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 400);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name="cube" 
              size={48} 
              color="white" 
            />
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Smart WMS</Text>
          <Text style={styles.subtitle}>창고 관리 시스템</Text>
        </Animated.View>
      </View>
      
      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Text style={styles.footerText}>© 2025 Smart WMS</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: SIZES.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.fontXXL + 4,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SIZES.sm,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.fontMD,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: SIZES.fontSM,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    textAlign: 'center',
  },
});