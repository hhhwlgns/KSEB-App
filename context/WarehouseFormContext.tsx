import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Product, Client } from '../types';

// 컨텍스트가 관리할 데이터의 타입 정의
interface WarehouseFormState {
  selectedProduct?: Product | null;
  selectedClient?: Client | null;
  setFieldValue: (field: 'selectedProduct' | 'selectedClient', value: Product | Client | null) => void;
}

// 컨텍스트 생성
const WarehouseFormContext = createContext<WarehouseFormState | undefined>(undefined);

// 컨텍스트를 사용하기 위한 커스텀 훅
export const useWarehouseForm = () => {
  const context = useContext(WarehouseFormContext);
  if (!context) {
    throw new Error('useWarehouseForm must be used within a WarehouseFormProvider');
  }
  return context;
};

// 컨텍스트를 제공하는 컴포넌트
interface WarehouseFormProviderProps {
  children: ReactNode;
}

export const WarehouseFormProvider = ({ children }: WarehouseFormProviderProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // setFieldValue 함수를 useCallback으로 메모이제이션하여 불필요한 리렌더링 방지
  const setFieldValue = useCallback((field: 'selectedProduct' | 'selectedClient', value: Product | Client | null) => {
    if (field === 'selectedProduct') {
      setSelectedProduct(value as Product | null);
    } else if (field === 'selectedClient') {
      setSelectedClient(value as Client | null);
    }
  }, []);

  // 컨텍스트 value를 useMemo로 메모이제이션하여,
  // selectedProduct 또는 selectedClient가 변경될 때만 새로운 객체 생성
  const value = useMemo(() => ({
    selectedProduct,
    selectedClient,
    setFieldValue,
  }), [selectedProduct, selectedClient, setFieldValue]);

  return (
    <WarehouseFormContext.Provider value={value}>
      {children}
    </WarehouseFormContext.Provider>
  );
};
