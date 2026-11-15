# Dynamic Navigation System

This navigation system is designed to be completely configurable and dynamic, with no hardcoded values. All text, icons, dimensions, and styling are controlled through constants.

## Features

- **Zero Hardcoding**: All values are stored in constants for easy customization
- **Dynamic Icon Rendering**: Icons are rendered dynamically based on configuration
- **Accessibility Support**: Built-in accessibility labels and hints
- **Theme Aware**: Support for light/dark theme variations
- **Responsive**: Responsive breakpoints and scaling options
- **Type Safe**: Full TypeScript support with proper type definitions

## Components

### TopNavigation
A flexible top navigation bar with:
- Welcome message (dynamic based on user name)
- Home selector dropdown
- Add home functionality
- User avatars
- Notification system
- Add member functionality

### BottomNavigation
A customizable bottom tab navigation with:
- Dynamic tab items
- Configurable icons
- Active state styling
- Profile picture support

## Constants Structure

### TOP_NAVIGATION
```typescript
TOP_NAVIGATION = {
  WELCOME_MESSAGE: { DEFAULT: 'Welcome', WITH_NAME: 'Welcome, {firstName}' },
  HOME_SELECTOR: { PLACEHOLDER: 'Select Home', ADD_NEW_HOME: 'Add New Home' },
  DIMENSIONS: { MIN_HEIGHT: 80, USER_AVATAR: { SIZE: 32 } },
  ICON_SIZES: { DROPDOWN: { width: 14, height: 14 } },
  STYLING: { BORDER_WIDTH: 2, SHADOW: { OPACITY: 0.1 } },
  ANIMATION: { ACTIVE_OPACITY: 0.8 }
}
```

### BOTTOM_NAVIGATION
```typescript
BOTTOM_NAVIGATION = {
  TABS: [
    { key: 'home', label: 'Home', iconKey: 'home' },
    { key: 'devices', label: 'Devices', iconKey: 'devices' }
  ],
  DIMENSIONS: { CONTAINER_HEIGHT: 95, ICON_CONTAINER: { SIZE: 48 } },
  STYLING: { ACTIVE_OPACITY: 0.8, TEXT: { ACTIVE_OPACITY: 1 } }
}
```

## Usage Examples

### Basic TopNavigation
```typescript
import { TopNavigation } from './design-system/Navigation';

<TopNavigation
  user={{ first_name: 'John' }}
  homes={[{ id: 1, name: 'My Home' }]}
  activeHomeId={1}
  onHomeSelect={(id) => console.log('Selected home:', id)}
  onAddHome={() => console.log('Add home')}
  onAddMember={() => console.log('Add member')}
  onNotificationPress={() => console.log('Notifications')}
/>
```

### Basic BottomNavigation
```typescript
import { BottomNavigation } from './design-system/Navigation';

const tabItems = [
  { key: 'home', label: 'Home', icon: null },
  { key: 'devices', label: 'Devices', icon: null },
  { key: 'energy', label: 'Energy', icon: null },
  { key: 'profile', label: 'Profile', icon: null }
];

<BottomNavigation
  items={tabItems}
  activeKey="home"
  profile_picture="https://example.com/avatar.jpg"
  onTabPress={(key) => console.log('Tab pressed:', key)}
/>
```

## Customization

### Changing Text
To change any text, modify the constants in `Constants.ts`:

```typescript
// Change welcome message
TOP_NAVIGATION.WELCOME_MESSAGE.DEFAULT = 'Hello there!';
TOP_NAVIGATION.WELCOME_MESSAGE.WITH_NAME = 'Hello, {firstName}!';

// Change tab labels
BOTTOM_NAVIGATION.TABS[0].label = 'Dashboard';
```

### Changing Dimensions
To change sizes and spacing:

```typescript
// Make navigation taller
TOP_NAVIGATION.DIMENSIONS.MIN_HEIGHT = 100;

// Make icons larger
BOTTOM_NAVIGATION.DIMENSIONS.ICON_CONTAINER.SIZE = 56;
```

### Adding New Icons
To add new icons:

1. Add the icon to the `ICON_MAPPING`:
```typescript
export const ICON_MAPPING = {
  // ... existing icons
  settings: 'SettingsIcon',
  analytics: 'AnalyticsIcon',
} as const;
```

2. Import and add to `ICON_COMPONENTS` in `IconUtils.tsx`:
```typescript
import { SettingsIcon, AnalyticsIcon } from '../icons/filled';

const ICON_COMPONENTS = {
  // ... existing components
  SettingsIcon,
  AnalyticsIcon,
} as const;
```

3. Use in your navigation:
```typescript
BOTTOM_NAVIGATION.TABS.push({
  key: 'settings',
  label: 'Settings',
  iconKey: 'settings'
});
```

### Theme Customization
The system supports theme-aware constants:

```typescript
// Use theme-specific values
const shadowOpacity = isDarkTheme 
  ? THEME_CONSTANTS.DARK.SHADOW_OPACITY 
  : THEME_CONSTANTS.LIGHT.SHADOW_OPACITY;
```

### Responsive Design
Use responsive breakpoints for different screen sizes:

```typescript
import { RESPONSIVE } from './design-system/Navigation';

const isSmallScreen = screenWidth < RESPONSIVE.BREAKPOINTS.MEDIUM;
const scaling = isSmallScreen ? RESPONSIVE.SCALING.SMALL_SCREEN : 1.0;
```

## Icon Utilities

The `IconUtils.tsx` file provides several helpful functions:

### renderIcon()
Dynamically renders an icon based on configuration:
```typescript
const icon = renderIcon({ 
  key: 'home', 
  size: 'LARGE', 
  color: '#007AFF', 
  isActive: true 
});
```

### createTabItems()
Creates tab configuration objects:
```typescript
const tabs = [
  { key: 'home', label: 'Home', iconKey: 'home' },
  { key: 'settings', label: 'Settings', iconKey: 'settings' }
];

const tabItems = createTabItems(tabs);
```

### getIconSize()
Gets appropriate icon size for different contexts:
```typescript
const navIconSize = getIconSize('navigation', 'large');
const buttonIconSize = getIconSize('button');
```

## Accessibility

All navigation components include built-in accessibility support:

- **Labels**: Descriptive labels for screen readers
- **Hints**: Helpful hints about component functionality
- **Focus Management**: Proper focus handling for keyboard navigation

Accessibility constants can be customized in the `ACCESSIBILITY` section of `Constants.ts`.

## Best Practices

1. **Always use constants**: Never hardcode values in components
2. **Keep constants organized**: Group related constants logically
3. **Use TypeScript**: Leverage type safety for better development experience
4. **Test accessibility**: Ensure screen readers can navigate properly
5. **Document changes**: Update constants documentation when making changes

## Migration from Hardcoded Values

If you're migrating from hardcoded navigation:

1. Identify all hardcoded values (text, numbers, colors)
2. Move them to appropriate constants in `Constants.ts`
3. Update component imports to use constants
4. Test thoroughly to ensure no regressions
5. Update documentation

## Troubleshooting

### Icon Not Rendering
- Check if icon key exists in `ICON_MAPPING`
- Verify icon component is imported in `IconUtils.tsx`
- Ensure icon key is valid TypeScript type

### Styling Issues
- Verify constant values are correct
- Check if constants are properly imported
- Ensure TypeScript types match expected values

### Performance Issues
- Constants are defined as `const` for optimal performance
- Icon components are lazy-loaded only when needed
- Use React.memo for expensive components if needed
