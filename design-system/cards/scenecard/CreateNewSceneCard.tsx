import { TouchableOpacity, View } from 'react-native';
import { colors } from '../../colors/colors';
import PlusIcon from '../../icons/filled/PlusIcon';
import { Spacing } from '../../Layout/spacing';
import { Typography } from '../../typography/typography';

const CreateNewSceneCard = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity 
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
        padding: Spacing.sm,
        minWidth: 280,
        minHeight: 100,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.text,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }} 
      onPress={onPress}
    >
      <View style={{
        backgroundColor: colors.disabled,
        borderRadius: 50,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
      }}>
        <PlusIcon width={16} height={16} />
      </View>
      <Typography 
        variant="caption" 
        color={colors.disabled}
        style={{ textAlign: 'center' }}
      >
        Create New Scene
      </Typography>
    </TouchableOpacity>
  );
};

export default CreateNewSceneCard;