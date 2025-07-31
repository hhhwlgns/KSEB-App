import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, Platform, Animated } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
// import { Toaster } from 'sonner-native'; // SVG 에러로 인해 임시 주석 처리
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import BasicInfoScreen from './screens/BasicInfoScreen';
import ClientListScreen from './screens/ClientListScreen';
import ProductListScreen from './screens/ProductListScreen';
import ClientFormScreen from './screens/ClientFormScreen';
import ProductFormScreen from './screens/ProductFormScreen';
import WarehouseScreen from './screens/WarehouseScreen';
import WarehouseHistoryScreen from './screens/WarehouseHistoryScreen';
import WarehouseRequestScreen from './screens/WarehouseRequestScreen';
import WarehouseFormScreen from './screens/WarehouseFormScreen';
import InventoryScreen from './screens/InventoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import WarehouseHistoryDetailScreen from './screens/WarehouseHistoryDetailScreen';
import SelectionScreen from './screens/SelectionScreen';
import BarcodeScanScreen from './screens/BarcodeScanScreen';
import BarcodeTabScreen from './screens/BarcodeTabScreen';
import CustomTabBarButton from './components/CustomTabBarButton';
import ManualProcessScreen from './screens/ManualProcessScreen';
import UserManagementScreen from './screens/UserManagementScreen';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
});

interface AnimatedTabIconProps {
  focused: boolean;
  color: string;
  size: number;
  iconName: keyof typeof Ionicons.glyphMap;
}

function AnimatedTabIcon({ focused, color, size, iconName }: AnimatedTabIconProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.1 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleValue]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Ionicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'BasicInfo') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Warehouse') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'BarcodeTab') {
            // 바코드 탭은 커스텀 렌더링
            return null;
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <AnimatedTabIcon 
              focused={focused} 
              color={color} 
              size={size} 
              iconName={iconName} 
            />
          );
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 8 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        unmountOnBlur: true,
      })}
    >
      <Tab.Screen 
        name="BasicInfo" 
        component={BasicInfoScreen} 
        options={{ 
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12, fontWeight: '500' }}>기초 정보</Text>
          )
        }} 
      />
      <Tab.Screen 
        name="Warehouse" 
        component={WarehouseScreen} 
        options={{ 
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12, fontWeight: '500' }}>입출고 관리</Text>
          )
        }} 
      />
      <Tab.Screen 
        name="BarcodeTab" 
        component={BarcodeTabScreen} 
        options={({ navigation }) => ({ 
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
          tabBarLabel: () => null,
        })}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('BarcodeScreen', {
              title: '랙 바코드 스캔',
              scanMode: 'rackProcess'
            });
          },
        })}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ 
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12, fontWeight: '500' }}>재고 관리</Text>
          )
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarLabel: ({ color }) => (
            <Text style={{ color, fontSize: 12, fontWeight: '500' }}>프로필</Text>
          )
        }} 
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              animation: 'fade',
            }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{
                animation: 'fade',
              }}
            />
            <Stack.Screen name="ClientList" component={ClientListScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="ClientForm" component={ClientFormScreen} />
            <Stack.Screen name="ProductForm" component={ProductFormScreen} />
            <Stack.Screen name="WarehouseHistory" component={WarehouseHistoryScreen} />
            <Stack.Screen name="WarehouseRequest" component={WarehouseRequestScreen} />
            <Stack.Screen name="WarehouseHistoryDetail" component={WarehouseHistoryDetailScreen} />
            <Stack.Screen name="WarehouseForm" component={WarehouseFormScreen} />
            <Stack.Screen 
              name="Selection" 
              component={SelectionScreen} 
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen 
              name="BarcodeScreen" 
              component={BarcodeScanScreen} 
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen 
              name="ManualProcess" 
              component={ManualProcessScreen} 
            />
            <Stack.Screen 
              name="UserManagement" 
              component={UserManagementScreen} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider style={styles.container}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          {/* <Toaster position="top-center" duration={2000} /> */}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    userSelect: "none",
    backgroundColor: '#F8FAFC',
  }
});
