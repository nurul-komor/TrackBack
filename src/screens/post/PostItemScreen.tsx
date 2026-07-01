import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Image, TouchableOpacity,
  Alert, Modal, FlatList,
} from 'react-native';
import { Text, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { updateDoc, doc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { CATEGORIES } from '../../config/categories';
import { createItem } from '../../services/items.service';
import { uploadItemImage } from '../../services/storage.service';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/theme';
import { ItemType } from '../../types';
import { db } from '../../config/firebase';

export const PostItemScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [type, setType] = useState<ItemType>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const pickImage = async () => {
    if (images.length >= 3) return Alert.alert('Limit reached', 'You can upload up to 3 images.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
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

      const uploadedUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const url = await uploadItemImage(images[i], itemId, i);
        uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        await updateDoc(doc(db, 'items', itemId), { images: uploadedUrls });
      }

      Alert.alert('Success!', 'Your report has been posted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text variant="headlineSmall" style={styles.heading}>Report an Item</Text>

      {/* Lost / Found Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'lost' && styles.toggleActive]}
          onPress={() => setType('lost')}
        >
          <Text style={[styles.toggleText, type === 'lost' && styles.toggleActiveText]}>Lost</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'found' && styles.toggleActiveFound]}
          onPress={() => setType('found')}
        >
          <Text style={[styles.toggleText, type === 'found' && styles.toggleActiveText]}>Found</Text>
        </TouchableOpacity>
      </View>

      {/* Category Picker */}
      <TouchableOpacity style={styles.categoryPicker} onPress={() => setCategoryModalVisible(true)}>
        <Text style={category ? styles.categorySelected : styles.categoryPlaceholder}>
          {category || 'Select Category *'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* Title */}
      <TextInput
        label="Title *"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
        placeholder="e.g. Blue Samsung Galaxy S22"
        maxLength={80}
      />

      {/* Description */}
      <TextInput
        label="Description *"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
        placeholder="Describe the item in detail..."
        maxLength={500}
      />

      {/* Location */}
      <TextInput
        label="Location *"
        value={location}
        onChangeText={setLocation}
        mode="outlined"
        style={styles.input}
        placeholder="e.g. Library 2nd Floor, Block C"
      />

      {/* Image Picker */}
      <Text variant="titleSmall" style={styles.imageLabel}>Photos (up to 3)</Text>
      <View style={styles.imageRow}>
        {images.map((uri, i) => (
          <View key={i} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.thumbnail} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 3 && (
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
            <Text style={styles.addImageIcon}>+</Text>
            <Text style={styles.addImageText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Submit */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={loading}
        style={styles.submitBtn}
        contentStyle={styles.submitContent}
      >
        {loading ? <ActivityIndicator color="#FFF" size={20} /> : 'Post Report'}
      </Button>

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide" onRequestClose={() => setCategoryModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalSheet}>
            <Text variant="titleMedium" style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={CATEGORIES as unknown as string[]}
              keyExtractor={(item) => item}
              renderItem={({ item: cat }) => (
                <TouchableOpacity
                  style={[styles.categoryItem, category === cat && styles.categoryItemActive]}
                  onPress={() => { setCategory(cat); setCategoryModalVisible(false); }}
                >
                  <Text style={[styles.categoryItemText, category === cat && styles.categoryItemActiveText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontWeight: '700', color: COLORS.primary, marginBottom: 20 },
  toggleRow: { flexDirection: 'row', marginBottom: 16, borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.primary },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.surface },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleActiveFound: { backgroundColor: COLORS.accent },
  toggleText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  toggleActiveText: { color: '#FFFFFF' },
  categoryPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: '#AAAAAA', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12 },
  categorySelected: { fontSize: 16, color: COLORS.textPrimary },
  categoryPlaceholder: { fontSize: 16, color: '#888' },
  dropdownArrow: { color: COLORS.textSecondary, fontSize: 12 },
  input: { marginBottom: 12, backgroundColor: COLORS.surface },
  imageLabel: { fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  imageWrapper: { position: 'relative' },
  thumbnail: { width: 90, height: 90, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: COLORS.error, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  addImageBtn: { width: 90, height: 90, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  addImageIcon: { fontSize: 28, color: COLORS.primary, lineHeight: 32 },
  addImageText: { fontSize: 11, color: COLORS.primary, fontWeight: '500' },
  submitBtn: { marginTop: 8, borderRadius: 8 },
  submitContent: { paddingVertical: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  categoryItem: { paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  categoryItemActive: { backgroundColor: '#EEF0FF' },
  categoryItemText: { fontSize: 16, color: COLORS.textPrimary },
  categoryItemActiveText: { color: COLORS.primary, fontWeight: '600' },
});
