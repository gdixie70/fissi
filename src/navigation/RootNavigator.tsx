import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { SubscriptionsProvider } from '../context/SubscriptionsContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SubscriptionsListScreen } from '../screens/SubscriptionsListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SubscriptionFormScreen } from '../screens/SubscriptionFormScreen';
import { SubscriptionDetailScreen } from '../screens/SubscriptionDetailScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { RecapScreen } from '../screens/RecapScreen';
import { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function AppTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Panoramica',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsListScreen}
        options={{
          title: 'Pagamenti',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-sync-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Impostazioni',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <SubscriptionsProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="SubscriptionForm"
            component={SubscriptionFormScreen}
            options={{ presentation: 'modal', title: 'Pagamento' }}
          />
          <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} options={{ title: '' }} />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal', title: 'Premium' }}
          />
          <Stack.Screen name="Recap" component={RecapScreen} options={{ title: 'Recap annuale' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SubscriptionsProvider>
  );
}
