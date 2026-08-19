import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Image, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateDoc, doc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryPickerModal } from '../../components/CategoryPickerModal';
import { createItem } from '../../services/items.service';
import { uploadItemImage } from '../../services/storage.service';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/theme';
import { ItemType } from '../../types';
import { db } from '../../config/firebase';

export const PostItemScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<ItemType>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission denied', 'Camera access is required to take photos.');
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickImage = () => {
    if (images.length >= 3) return Alert.alert('Limit reached', 'You can upload up to 3 images.');
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: pickFromCamera },
      { text: 'Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) return Alert.alert('Error', 'You must be logged in.');
    if (!title.trim()) return Alert.alert('Error', 'Please enter a title.');
    if (!description.trim()) return Alert.alert('Error', 'Please enter a description.');
    if (!category) return Alert.alert('Error', 'Please select a category.');
    if (!location.trim()) return Alert.alert('Error', 'Please enter a location.');

    try {
      setLoading(true);

      const itemId = await createItem({
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        images: [],
        status: 'active',
        location: location.trim(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
      });

      const uploadedUrls = await Promise.all(
        images.map((uri, i) => uploadItemImage(uri, itemId, i)),
      );

      if (uploadedUrls.length > 0) {
        await updateDoc(doc(db, 'items', itemId), { images: uploadedUrls });
      }

      const newItem = {
        id: itemId,
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        images: uploadedUrls,
        status: 'active' as const,
        location: location.trim(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        createdAt: new Date(),
      };

      setType('lost');
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('');
      setImages([]);

      navigation.navigate('FeedTab', {
        screen: 'ItemDetail',
        params: { item: newItem },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text style={[styles.pageTitle, { paddingTop: insets.top + 16 }]}>Post Item</Text>

        {/* Lost / Found Toggle */}
        <Text style={styles.sectionLabel}>ITEM TYPE</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'lost' && styles.toggleBtnLost]}
            onPress={() => setType('lost')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="map-marker-off"
              size={16}
              color={type === 'lost' ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text style={[styles.toggleText, type === 'lost' && styles.toggleActiveText]}>Lost</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'found' && styles.toggleBtnFound]}
            onPress={() => setType('found')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="map-marker-check"
              size={16}
              color={type === 'found' ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text style={[styles.toggleText, type === 'found' && styles.toggleActiveText]}>Found</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <Text style={styles.sectionLabel}>TITLE</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.fieldInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Blue Samsung Galaxy S22"
            placeholderTextColor={COLORS.separator}
            maxLength={80}
            returnKeyType="next"
          />
        </View>

        {/* Description Section */}
        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
        <View style={styles.card}>
          <TextInput
            style={[styles.fieldInput, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the item in detail — colour, brand, distinguishing features..."
            placeholderTextColor={COLORS.separator}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* Category Section */}
        <Text style={styles.sectionLabel}>CATEGORY</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsRowLabel}>Category</Text>
            <View style={styles.settingsRowRight}>
              <Text style={category ? styles.settingsRowValue : styles.settingsRowPlaceholder}>
                {category || 'Select'}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.separator} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Location Section */}
        <Text style={styles.sectionLabel}>LOCATION</Text>
        <View style={styles.card}>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.fieldInput, { flex: 1, paddingHorizontal: 0 }]}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Library 2nd Floor, Block C"
              placeholderTextColor={COLORS.separator}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Photos Section */}
        <Text style={styles.sectionLabel}>PHOTOS (UP TO 3)</Text>
        <View style={styles.card}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageScroll}
          >
            {images.map((uri, i) => (
              <View key={i} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 3 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage} activeOpacity={0.7}>
                <MaterialCommunityIcons name="plus" size={28} color={COLORS.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Submit Button */}
        <View style={[styles.submitGradient, { backgroundColor: loading ? 'rgba(0,122,255,0.4)' : '#007AFF' }]}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.submitBtnText}>Post Report</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Category Modal */}
        <CategoryPickerModal
          visible={categoryModalVisible}
          selected={category}
          onSelect={(cat) => { setCategory(cat); setCategoryModalVisible(false); }}
          onClose={() => setCategoryModalVisible(false)}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: {},

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 6,
  },

  // Lost/Found toggle
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 0,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    backgroundColor: COLORS.inputBackground,
  },
  toggleBtnLost: {
    backgroundColor: 'rgba(255, 59, 48, 0.85)',
  },
  toggleBtnFound: {
    backgroundColor: 'rgba(52, 199, 89, 0.85)',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  toggleActiveText: {
    color: '#FFFFFF',
  },

  // Glass card sections
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    marginBottom: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // Plain text inputs inside cards
  fieldInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  multilineInput: {
    minHeight: 96,
    paddingTop: 14,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#F2F2F7',
    marginLeft: 16,
  },

  // iOS Settings-style row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsRowLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsRowValue: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  settingsRowPlaceholder: {
    fontSize: 15,
    color: COLORS.separator,
  },

  // Location row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },

  // Image picker
  imageScroll: {
    padding: 14,
    gap: 10,
    flexDirection: 'row',
  },
  imageWrapper: { position: 'relative' },
  thumbnail: { width: 88, height: 88, borderRadius: 10 },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  addImageBtn: {
    width: 88,
    height: 88,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },

  // Submit button
  submitGradient: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
