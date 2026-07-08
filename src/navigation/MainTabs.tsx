import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { FeedScreen } from '../screens/feed/FeedScreen';
import { ItemDetailScreen } from '../screens/feed/ItemDetailScreen';
import { PostItemScreen } from '../screens/post/PostItemScreen';
import { ConversationsScreen } from '../screens/messages/ConversationsScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MyPostsScreen } from '../screens/profile/MyPostsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen'; // still used in ProfileNavigator

const Tab = createBottomTabNavigator();
const FeedStack = createStackNavigator();
const MessagesStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const noHeader = { headerShown: false };

// ─── Layout constants ─────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const BAR_MARGIN  = 14;                            // left/right from screen edge
const BAR_PAD     = 6;                             // paddingHorizontal on the row
const BAR_H       = 66;
const SLOTS       = 4;                             // FeedTab | PostTab | MessagesTab | ProfileTab
const BAR_W       = SCREEN_W - BAR_MARGIN * 2;
const SLOT_W      = (BAR_W - BAR_PAD * 2) / SLOTS;
const PILL_W      = SLOT_W - 10;                   // 5 px inset each side
const PILL_H      = BAR_H - 14;                    // 7 px inset top/bottom
const PILL_TOP    = (BAR_H - PILL_H) / 2;

// Map route name → column index
const SLOT_IDX: Record<string, number> = {
  FeedTab:     0,
  PostTab:     1,
  MessagesTab: 2,
  ProfileTab:  3,
};

// X of the glass pill when centred over column slotIdx
const pillX = (slotIdx: number) =>
  BAR_PAD + slotIdx * SLOT_W + (SLOT_W - PILL_W) / 2;

// Liquid spring — smooth glide with a tiny overshoot
const SPRING = { damping: 22, stiffness: 260, mass: 0.75 };

// ─── Tab config — every tab identical layout ──────────────────────────────────
const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  FeedTab:     { icon: 'home-variant', label: 'Home' },
  PostTab:     { icon: 'plus',         label: 'Post' },
  MessagesTab: { icon: 'message-text', label: 'Chat' },
  ProfileTab:  { icon: 'account',      label: 'Me'   },
};

// ─── Custom tab bar ───────────────────────────────────────────────────────────
const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  const focusedTab = state.routes[state.index];
  const nestedState = focusedTab.state as any;
  const activeScreen = nestedState
    ? nestedState.routes[nestedState.index ?? 0]?.name
    : focusedTab.name;
  const isChatActive = activeScreen === 'Chat';

  // All hooks before any early returns
  const initSlot   = SLOT_IDX[state.routes[state.index]?.name] ?? 0;
  const indicatorX = useSharedValue(pillX(initSlot));
  const translateY = useSharedValue(0);

  // Slide bar off the bottom when Chat opens, back up when it closes
  useEffect(() => {
    translateY.value = withSpring(isChatActive ? BAR_H + 100 : 0, SPRING);
  }, [isChatActive]);

  // Slide pill to the newly focused tab on every tab switch
  useEffect(() => {
    const name = state.routes[state.index]?.name;
    const slot = name !== undefined ? SLOT_IDX[name] : undefined;
    if (slot !== undefined) {
      indicatorX.value = withSpring(pillX(slot), SPRING);
    }
  }, [state.index]);

  const pillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const barAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    // Shadow wrapper — BlurView with overflow:hidden clips box-shadow on iOS
    <Animated.View style={[styles.shadowWrap, { bottom: Math.max(insets.bottom, 8) + 10 }, barAnimStyle]}>
      <BlurView intensity={72} tint="light" style={styles.bar}>

        {/* Liquid glass pill — sits BEHIND all icons */}
        <Animated.View
          pointerEvents="none"
          style={[styles.pill, pillAnimStyle]}
        />

        {/* Tab row — rendered ON TOP of the pill */}
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const cfg = TAB_CONFIG[route.name];
            if (!cfg) return null;

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.slot}
                onPress={() => navigation.navigate(route.name)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={cfg.icon as any}
                  size={22}
                  color={focused ? '#1C1C1E' : '#9B9BA0'}
                />
                <Text style={[styles.label, focused && styles.labelActive]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </BlurView>
    </Animated.View>
  );
};

// ─── Stack navigators ─────────────────────────────────────────────────────────
const FeedNavigator = () => (
  <FeedStack.Navigator screenOptions={noHeader}>
    <FeedStack.Screen name="Feed" component={FeedScreen} />
    <FeedStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    <FeedStack.Screen name="Chat" component={ChatScreen} />
  </FeedStack.Navigator>
);

const MessagesNavigator = () => (
  <MessagesStack.Navigator screenOptions={noHeader}>
    <MessagesStack.Screen name="Conversations" component={ConversationsScreen} />
    <MessagesStack.Screen name="Chat" component={ChatScreen} />
  </MessagesStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={noHeader}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    <ProfileStack.Screen name="MyPosts" component={MyPostsScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
  </ProfileStack.Navigator>
);

// ─── Root navigator ───────────────────────────────────────────────────────────
export const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="FeedTab"      component={FeedNavigator} />
    <Tab.Screen name="PostTab"      component={PostItemScreen}    options={{ headerShown: false }} />
    <Tab.Screen name="MessagesTab"  component={MessagesNavigator} />
    <Tab.Screen name="ProfileTab"   component={ProfileNavigator} />
  </Tab.Navigator>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Carries the drop-shadow (BlurView + overflow:hidden would clip it)
  shadowWrap: {
    position: 'absolute',
    left: BAR_MARGIN,
    right: BAR_MARGIN,
    borderRadius: 36,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    backgroundColor: 'rgba(255,255,255,0.82)', // Android fallback + shadow base
  },

  // Frosted-glass pill bar
  bar: {
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },

  // Tab slots row — lays on top of the pill
  row: {
    flexDirection: 'row',
    height: BAR_H,
    paddingHorizontal: BAR_PAD,
  },

  // Every tab slot — identical layout
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9B9BA0',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },

  // Liquid glass sliding indicator
  pill: {
    position: 'absolute',
    top: PILL_TOP,
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    // White glass surface
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    // Glass shimmer edge
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 1)',
    // Lifted drop-shadow for depth
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
