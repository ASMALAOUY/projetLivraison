import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import useAuthStore from './src/store/authStore';
import LoginScreen    from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen     from './src/screens/HomeScreen';
import MapScreen      from './src/screens/MapScreen';
import ClientTrackingScreen from './src/screens/ClientTrackingScreen';
import LandingPage    from './src/screens/LandingPage';
import { LogBox } from 'react-native';

// Tout en haut de App(), avant le return
LogBox.ignoreLogs(['Encountered two children']);

// ET ajoutez ceci pour tracer l'origine exacte
const originalWarn = console.error;
console.error = (...args) => {
  if (args[0]?.includes('same key')) {
    console.log(' DUPLICATE KEY STACK TRACE:');
    console.trace();
  }
  originalWarn(...args);
};
const Stack = createStackNavigator();

// Stack déclaré STATIQUEMENT — jamais recréé quand user change
function RootNavigator({ initialRoute }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animationEnabled: true }}
    >
      <Stack.Screen name="Landing"        component={LandingPage} />
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="Home"           component={HomeScreen} />
      <Stack.Screen name="Map"            component={MapScreen} />
      <Stack.Screen name="ClientTracking" component={ClientTrackingScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { user, initialize } = useAuthStore();
  const [ready, setReady]   = useState(false);

  // useRef = valeur stable, ne déclenche PAS de re-render
  // initialRoute est calculé une seule fois et ne change plus jamais
  const initialRouteRef = useRef(null);

  useEffect(() => {
    initialize().finally(() => setReady(true));
  }, []);

  if (ready && initialRouteRef.current === null) {
    if (user?.role === 'driver')      initialRouteRef.current = 'Home';
    else if (user?.role === 'client') initialRouteRef.current = 'ClientTracking';
    else                              initialRouteRef.current = 'Landing';
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8' }}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator initialRoute={initialRouteRef.current} />
    </NavigationContainer>
  );
}