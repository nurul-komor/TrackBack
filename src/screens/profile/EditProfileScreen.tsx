import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateProfile } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import { auth, db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { updateUserItemsProfile } from '../../services/items.service';
import { COLORS } from '../../theme/theme';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const uploadAvatar = async (localUri: string, userId: string): Promise<string> => {
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 400 } }],
    { compress: 0.8, format: SaveFormat.JPEG },
  );
  const formData = new FormData();
  formData.append('file', { uri: compressed.uri, type: 'image/jpeg', name: `${userId}_avatar.jpg` } as any);
  formData.append('upload_preset', UPLOAD_PRESET!);
  formData.append('folder', `trackback/avatars`);
  formData.append('public_id', `${userId}_avatar`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Avatar upload failed');
  return data.secure_url as string;
};

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        setLoading(true);
        const url = await uploadAvatar(result.assets[0].uri, user!.uid);
        setPhotoURL(url);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) return Alert.alert('Error', 'Name cannot be empty.');
    try {
      setLoading(true);
      await updateProfile(auth.currentUser!, { displayName: displayName.trim(), photoURL });
      await updateDoc(doc(db, 'users', user!.uid), {
        displayName: displayName.trim(),
        photoURL,
      });
      await updateUserItemsProfile(user!.uid, {
        userName: displayName.trim(),
        userPhoto: photoURL,
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { paddingTop: insets.top + 16 }]}>Edit Profile</Text>

        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickPhoto} activeOpacity={0.8}>
            <View style={styles.avatarRing}>
              {photoURL ? (
                <Avatar.Image size={96} source={{ uri: photoURL }} />
              ) : (
                <Avatar.Text size={96} label={initials} style={styles.avatar} />
              )}
            </View>
            <View style={styles.cameraOverlay}>
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoLabel}>Change Photo</Text>
        </View>

        <Text style={styles.sectionHeader}>YOUR NAME</Text>
        <View style={styles.formCard}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor={COLORS.separator}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
        </View>

        <Text style={styles.sectionHeader}>EMAIL</Text>
        <View style={styles.formCard}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ''}
              editable={false}
              placeholder="Email"
              placeholderTextColor={COLORS.separator}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtnWrapper, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          <View style={styles.saveBtn}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: {},
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatarWrapper: { position: 'relative' },
  avatarRing: {
    padding: 3,
    borderRadius: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  avatar: { backgroundColor: COLORS.primary },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  inputRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  input: {
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 0,
  },
  inputDisabled: { color: COLORS.textSecondary },
  saveBtnWrapper: {
    marginHorizontal: 16,
    marginTop: 28,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtn: {
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    paddingVertical: 16,
  },
});
