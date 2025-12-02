import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: '🌭 MGM Packing 🍔' }}
        />
        <Stack.Screen
          name="customers/index"
          options={{ title: 'Select Customer' }}
        />
        <Stack.Screen
          name="customers/[id]"
          options={{ title: 'Customer Details' }}
        />
        <Stack.Screen
          name="orders/new"
          options={{ title: 'New Order' }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{ title: 'Order Details' }}
        />
        <Stack.Screen
          name="history"
          options={{ title: 'Order History' }}
        />
      </Stack>
    </>
  );
}

