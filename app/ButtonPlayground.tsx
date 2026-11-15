// screens/ButtonPlayground.tsx
import { ScrollView, View } from 'react-native';
import { buttonData } from '../constans/constantfile';
import { AppButton } from '../design-system/Buttons/Buttons';
import { colors } from '../design-system/colors/colors';
import { Spacing } from '../design-system/Layout/spacing';
import { Typography } from '../design-system/typography/typography';

export default function ButtonPlayground() {
  return (
    <ScrollView 
      contentContainerStyle={{ 
        padding: Spacing.sm, 
        gap: Spacing.sm, 
        backgroundColor: colors.surface 
      }}
    >
      {buttonData.map((section) => (
        <View key={section.id}>
          <Typography variant="h3" color={colors.text} style={{ marginVertical: Spacing.xs }}>
            {section.section}
          </Typography>
          <View style={{ gap: Spacing.sm }}>
            {section.buttons.map((button, index) => {
              const buttonProps: any = {
                variant: button.variant,
                onPress: button.onPress,
              };
              
              if ('title' in button) buttonProps.title = button.title;
              if ('icon' in button) buttonProps.icon = button.icon;
              if ('disabled' in button) buttonProps.disabled = button.disabled;
              
              return <AppButton key={index} {...buttonProps} />;
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
