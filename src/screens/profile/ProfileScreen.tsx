import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, Button, Divider, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/auth.service';
import { getUserItems } from '../../services/items.service';
import { COLORS } from '../../theme/theme';
import { Item } from '../../types';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {user?.photoURL ? (
          <Avatar.Image size={80} source={{ uri: user.photoURL }} />
        ) : (
          <Avatar.Text size={80} label={initials} style={styles.avatar} />
        )}
        <Text variant="titleLarge" style={styles.name}>{user?.displayName || 'User'}</Text>
        <Text variant="bodyMedium" style={styles.email}>{user?.email}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="titleMedium" style={styles.statNumber}>{lostCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Lost Reports</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="titleMedium" style={styles.statNumber}>{foundCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Found Reports</Text>
          </View>
        </View>
      </View>

      <Divider />

      <List.Section>
        <List.Item
          title="My Posts"
          left={(p) => <List.Icon {...p} icon="format-list-bulleted" color={COLORS.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => navigation.navigate('MyPosts')}
        />
        <Divider />
        <List.Item
          title="Edit Profile"
          left={(p) => <List.Icon {...p} icon="account-edit" color={COLORS.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => navigation.navigate('EditProfile')}
        />
        <Divider />
        <List.Item
          title="Notifications"
          left={(p) => <List.Icon {...p} icon="bell-outline" color={COLORS.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => navigation.navigate('Notifications')}
        />
        <Divider />
        <List.Item
          title="Logout"
          titleStyle={{ color: COLORS.error }}
          left={(p) => <List.Icon {...p} icon="logout" color={COLORS.error} />}
          onPress={handleLogout}
        />
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', padding: 24, backgroundColor: COLORS.surface },
  avatar: { backgroundColor: COLORS.primary },
  name: { marginTop: 12, color: COLORS.textPrimary, fontWeight: 'bold' },
  email: { color: COLORS.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', width: '100%', justifyContent: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { color: COLORS.primary, fontWeight: 'bold' },
  statLabel: { color: COLORS.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
});
