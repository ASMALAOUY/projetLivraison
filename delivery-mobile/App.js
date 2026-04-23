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

const Stack = createStackNavigator();

export default function App() {
  const { user, initialize } = useAuthStore();  // ← Utilisez initialize
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize().finally(() => setReady(true));  // ← initialize au lieu de loadFromStorage
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!user) return 'Login';
    if (user.role === 'driver') return 'Home';
    if (user.role === 'client') return 'ClientTracking';
    return 'Login';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="ClientTracking" component={ClientTrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}