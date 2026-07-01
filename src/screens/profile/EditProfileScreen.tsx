import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { updateProfile } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/theme';

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
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
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${user!.uid}.jpg`);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
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
      Alert.alert('Success', 'Profile updated!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarSection}>
        {photoURL ? (
          <Avatar.Image size={96} source={{ uri: photoURL }} />
        ) : (
          <Avatar.Text size={96} label={initials} style={styles.avatar} />
        )}
        <Button mode="text" onPress={handlePickPhoto} disabled={loading} style={styles.changePhoto}>
          Change Photo
        </Button>
      </View>

      <TextInput
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={user?.email || ''}
        mode="outlined"
        disabled
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        disabled={loading}
        style={styles.saveBtn}
      >
        Save Changes
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { backgroundColor: COLORS.primary },
  changePhoto: { marginTop: 8 },
  input: { marginBottom: 16, backgroundColor: COLORS.surface },
  saveBtn: { marginTop: 8, paddingVertical: 4 },
});
