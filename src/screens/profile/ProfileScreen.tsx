import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/auth.service';
import { getUserItems } from '../../services/items.service';
import { COLORS } from '../../theme/theme';
import { Item } from '../../types';

type MenuItem = {
  key: string;
  icon: string;
  title: string;
  onPress: () => void;
  destructive?: boolean;
  hideChevron?: boolean;
};

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (user?.uid) {
      getUserItems(user.uid).then(setItems);
    }
  }, [user]);

  const lostCount = items.filter((i) => i.type === 'lost').length;
  const foundCount = items.filter((i) => i.type === 'found').length;

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      key: 'myPosts',
      icon: 'format-list-bulleted',
      title: 'My Posts',
      onPress: () => navigation.navigate('MyPosts'),
    },
    {
      key: 'editProfile',
      icon: 'account-edit',
      title: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      key: 'notifications',
      icon: 'bell-outline',
      title: 'Notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      key: 'logout',
      icon: 'logout',
      title: 'Logout',
      onPress: handleLogout,
      destructive: true,
      hideChevron: true,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 }]}
      >
        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarRing}>
            {user?.photoURL ? (
              <Avatar.Image size={88} source={{ uri: user.photoURL }} />
            ) : (
              <Avatar.Text size={88} label={initials} style={styles.avatar} />
            )}
          </View>
          <Text style={styles.name}>{user?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{lostCount}</Text>
              <Text style={styles.statLabel}>Lost Reports</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{foundCount}</Text>
              <Text style={styles.statLabel}>Found Reports</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={item.key}>
              <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={22}
                  color={item.destructive ? COLORS.error : COLORS.textSecondary}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuTitle, item.destructive && styles.menuTitleDestructive]}>
                  {item.title}
                </Text>
                {!item.hideChevron && (
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.separator} />
                )}
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
  },
  headerCard: {
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    margin: 16,
    marginTop: 8,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  avatar: {
    backgroundColor: COLORS.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 2,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 0,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    paddingTop: 18,
    paddingBottom: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
    backgroundColor: COLORS.separator,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 28,
    textAlign: 'center',
  },
  menuTitle: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: 12,
  },
  menuTitleDestructive: {
    color: COLORS.error,
  },
  separator: {
    height: 0.5,
    backgroundColor: COLORS.separator,
    marginLeft: 56,
  },
});
