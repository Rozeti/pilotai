import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar'; // <--- Importamos a biblioteca

export default function Layout() {
  
  useEffect(() => {
    // Verifica se é Android para aplicar a mudança
    if (Platform.OS === 'android') {
      // Pinta o fundo da barra de PRETO
      NavigationBar.setBackgroundColorAsync("#000000");
      
      // Pinta os ícones (triângulo, bolinha, quadrado) de BRANCO/CLARO
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> 
      <Stack.Screen name="PassengerHomeScreen" />
      <Stack.Screen name="DriverHomeScreen" />
      <Stack.Screen name="PassengerProfileScreen" />
      <Stack.Screen name="DriverProfileScreen" />
    </Stack>
  );
}