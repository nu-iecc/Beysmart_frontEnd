// App.tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import ButtonPlayground from  '../ButtonPlayground';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ButtonPlayground />
    </SafeAreaView>
  );
}