import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import useAuthStore from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import ClientTrackingScreen from './src/screens/ClientTrackingScreen';
import LandingPage from './src/screens/LandingPage';

const Stack = createStackNavigator();

export default function App() {
  const { user, initialize } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Utilisateur connecté
  if (user) {
    const initialRoute = user.role === 'driver' ? 'Home' : 'ClientTracking';
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="ClientTracking" component={ClientTrackingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Landing" component={LandingPage} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Utilisateur non connecté - Page d'accueil publique
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="ClientTracking" component={ClientTrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}