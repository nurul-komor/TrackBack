import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

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

  const formData = new FormData();
  formData.append('file', {
    uri: compressed.uri,
    type: 'image/jpeg',
    name: `${itemId}_${index}_${Date.now()}.jpg`,
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET!);
  formData.append('folder', `trackback/items/${itemId}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Image upload failed');
  }

  const data = await response.json();
  return data.secure_url as string;
};

// Deletion from a mobile client requires a signed server request.
// Unused images can be managed from the Cloudinary console.
export const deleteItemImage = async (_url: string): Promise<void> => {};
