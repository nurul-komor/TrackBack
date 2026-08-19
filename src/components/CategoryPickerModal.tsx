import React from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES } from '../config/categories';
import { COLORS } from '../theme/theme';

interface CategoryPickerModalProps {
  visible: boolean;
  selected: string;
  onSelect: (category: string) => void;
  onClose: () => void;
  includeAllOption?: boolean;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible, selected, onSelect, onClose, includeAllOption,
}) => {
  const data = includeAllOption ? ['All', ...CATEGORIES] : [...CATEGORIES];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Category</Text>
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({ item: cat }) => (
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => onSelect(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryItemText, selected === cat && styles.categoryItemActiveText]}>
                  {cat}
                </Text>
                {selected === cat && (
                  <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.separator,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  categoryItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  categoryItemActiveText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalDivider: {
    height: 0.5,
    backgroundColor: COLORS.background,
  },
});
