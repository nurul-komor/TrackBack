import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { FeedScreen } from '../screens/feed/FeedScreen';
import { ItemDetailScreen } from '../screens/feed/ItemDetailScreen';
import { PostItemScreen } from '../screens/post/PostItemScreen';
import { ConversationsScreen } from '../screens/messages/ConversationsScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MyPostsScreen } from '../screens/profile/MyPostsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';

import { COLORS } from '../theme/theme';

const Tab = createBottomTabNavigator();
const FeedStack = createStackNavigator();
const MessagesStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const FeedNavigator = () => (
  <FeedStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <FeedStack.Screen name="Feed" component={FeedScreen} options={{ title: 'TrackBack' }} />
    <FeedStack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item Details' }} />
    <FeedStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
  </FeedStack.Navigator>
);

const MessagesNavigator = () => (
  <MessagesStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <MessagesStack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Messages' }} />
    <MessagesStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
  </MessagesStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    <ProfileStack.Screen name="MyPosts" component={MyPostsScreen} options={{ title: 'My Posts' }} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    <ProfileStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
  </ProfileStack.Navigator>
);

export const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        elevation: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, string> = {
          FeedTab: 'home',
          PostTab: 'plus-circle',
          MessagesTab: 'chat',
          ProfileTab: 'account',
        };
        return (
          <MaterialCommunityIcons
            name={icons[route.name] as any}
            size={size}
            color={color}
          />
        );
      },
    })}
  >
    <Tab.Screen name="FeedTab" component={FeedNavigator} options={{ title: 'Home' }} />
    <Tab.Screen
      name="PostTab"
      component={PostItemScreen}
      options={{
        title: 'Post Item',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="plus-circle" size={size + 4} color={COLORS.accent} />
        ),
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitle: 'Post Item',
      }}
    />
    <Tab.Screen name="MessagesTab" component={MessagesNavigator} options={{ title: 'Messages' }} />
    <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);
