import { colors } from '@/design-system/colors/colors';
import { PlusIcon } from '@/design-system/icons/filled';
import { Typography } from '@/design-system/typography/typography';
import { scale } from '@/utils/responsive';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

export interface HomeDropdownItem {
  id: number;
  name: string;
}

interface HomeDropdownProps {
  items: HomeDropdownItem[];
  activeId?: number;
  onSelect: (id: number) => void;
  onAddHome: () => void;
  style?: any;
}

const DROPDOWN_MAX_HEIGHT = scale(220);

export const HomeDropdown: React.FC<HomeDropdownProps> = ({
  items,
  activeId,
  onSelect,
  onAddHome,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const handleSelect = (id: number) => {
    setVisible(false);
    onSelect(id);
  };

  const renderItem = ({ item }: { item: HomeDropdownItem }) => (
    <TouchableOpacity
      style={[
        styles.item,
        item.id === activeId && styles.selectedItem
      ]}
      onPress={() => handleSelect(item.id)}
      activeOpacity={0.7}
    >
      <Typography
        variant="body"
        color={item.id === activeId ? '#fff' : '#222B3A'}
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{ flex: 1, fontWeight: item.id === activeId ? 'bold' : 'normal' }}
      >
        {item.name}
      </Typography>
      {item.id === activeId && (
        <MaterialIcons name="check" size={scale(18)} color="#fff" style={{ marginLeft: 8 }} />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        style={[styles.button, style]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Typography
          variant="body"
          color={colors.text}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ flex: 1, maxWidth: scale(120), fontWeight: '500' }}
        >
          {items.find((h) => h.id === activeId)?.name || 'Select Home'}
        </Typography>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={scale(28)}
          color={colors.primary.base}
          style={{ marginLeft: scale(4), fontWeight: 'bold' }}
        />
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.dropdownContainer}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
            showsVerticalScrollIndicator={true}
          />
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.addHome}
            onPress={() => {
              setVisible(false);
              onAddHome();
            }}
            activeOpacity={0.7}
          >
            <PlusIcon width={scale(16)} height={scale(16)} color={colors.primary.base} />
            <Typography variant="body" color={colors.primary.base} style={{ marginLeft: 6, fontWeight: '600' }}>
              Add New Home
            </Typography>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(8),
    borderWidth: 2,
    borderColor: '#C6F94E',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    minWidth: scale(140),
    maxWidth: scale(240),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dropdownContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: Platform.OS === 'android' ? scale(80) : scale(100),
    minWidth: scale(220),
    maxWidth: scale(320),
    backgroundColor: '#fff',
    borderRadius: scale(14),
    padding: scale(8),
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(8),
    borderRadius: scale(8),
    marginBottom: scale(2),
    backgroundColor: '#fff',
  },
  selectedItem: {
    backgroundColor: '#222B3A',
  },
  activeDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: colors.primary.base,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: scale(6),
  },
  addHome: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(8),
    marginTop: scale(2),
    borderRadius: scale(8),
    backgroundColor: '#222B3A',
    justifyContent: 'center',
    marginBottom: scale(2),
  },
});

export default HomeDropdown;
