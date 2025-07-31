import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

import Header from '../components/Header';
import { COLORS, SIZES } from '../constants';
import { getRackContents } from '../lib/api';

type BarcodeScanRouteParams = {
  scanMode?: 'rackProcess' | 'default';
  title?: string;
};

type RootStackParamList = {
  BarcodeScan: BarcodeScanRouteParams;
};

type BarcodeScanScreenRouteProp = RouteProp<RootStackParamList, 'BarcodeScan'>;

export default function BarcodeScanScreen() {
  const navigation = useNavigation();
  const route = useRoute<BarcodeScanScreenRouteProp>();
  const { scanMode = 'default', title = '바코드 스캔' } = route.params || {};
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (scanned || isLoading || !scanningResult.data) return;
    
    setScanned(true);
    Vibration.vibrate(100);
    
    if (scanMode === 'rackProcess') {
      try {
        setIsLoading(true);
        const rack = await getRackContents(scanningResult.data);
        navigation.goBack();
        navigation.navigate('WarehouseForm' as never, { rack } as never);
      } catch (error: any) {
        toast.error(error.message || '랙 정보를 가져오는 데 실패했습니다.');
        setScanned(false); // 다시 스캔할 수 있도록
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert(
        '스캔 완료',
        `바코드: ${scanningResult.data}`,
        [
          { text: '다시 스캔', onPress: () => setScanned(false) },
          { text: '확인', onPress: () => navigation.goBack(), style: 'default' },
        ]
      );
    }
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={title} showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.message}>카메라 권한을 확인하는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={title} showBack />
        <View style={styles.centerContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.message}>카메라 접근 권한이 필요합니다</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>권한 허용</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={title} showBack />
      
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "code128"],
          }}
          enableTorch={flashEnabled}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <View style={styles.topInfo}>
            <Text style={styles.infoText}>랙 바코드를 스캔 영역에 맞춰주세요</Text>
          </View>
          
          <View style={styles.bottomControls}>
            <TouchableOpacity style={[styles.controlButton, flashEnabled && styles.controlButtonActive]} onPress={toggleFlash}>
              <Ionicons name={flashEnabled ? "flash" : "flash-off"} size={24} color={flashEnabled ? COLORS.primary : "white"} />
              <Text style={styles.controlButtonText}>플래시</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>랙 정보 확인 중...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.lg },
  message: { fontSize: SIZES.fontLG, color: COLORS.textSecondary, textAlign: 'center', marginVertical: SIZES.lg },
  permissionButton: { backgroundColor: COLORS.primary, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, marginTop: SIZES.lg },
  permissionButtonText: { color: 'white', fontSize: SIZES.fontMD, fontWeight: '600' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, position: 'relative' },
  scanArea: { position: 'absolute', top: '30%', left: '15%', width: '70%', height: '25%' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.primary, borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  topInfo: { position: 'absolute', top: '20%', left: 0, right: 0, alignItems: 'center' },
  infoText: { color: 'white', fontSize: SIZES.fontMD, fontWeight: '500', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusMD },
  bottomControls: { position: 'absolute', bottom: SIZES.xl, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: SIZES.xl },
  controlButton: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, borderRadius: SIZES.radiusLG, minWidth: 80 },
  controlButtonActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  controlButtonText: { color: 'white', fontSize: SIZES.fontSM, fontWeight: '500', marginTop: SIZES.xs },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', fontSize: SIZES.fontMD, marginTop: SIZES.md },
});