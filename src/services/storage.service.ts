import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

export const uploadItemImage = async (
  localUri: string,
  itemId: string,
  index: number,
): Promise<string> => {
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 800 } }],
    { compress: 0.75, format: SaveFormat.JPEG },
  );

  const response = await fetch(compressed.uri);
  const blob = await response.blob();
  const filename = `${itemId}_${index}_${Date.now()}.jpg`;
  const storageRef = ref(storage, `items/${itemId}/${filename}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const deleteItemImage = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // ignore if already deleted
  }
};
