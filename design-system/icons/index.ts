// Icon exports
export * from './IconUtils';

// Re-export icon components with namespacing to avoid conflicts
export * as OutlinedIcons from '@/design-system/icons/outlined';
export * as FilledIcons from './filled';

// Re-export commonly used icons directly (preferring filled versions)
export {
    AlertIcon, Door, EnergyIcon,
    HomeIcon,
    LightIcon, LivingIcon, PlusIcon, Robot, SettingsIcon, UserIcon
} from './filled';

export {
    backarrow as BackArrow, checkemail, correct as CorrectIcon, Dropdown, EmailIcon,
    ImageIcon, Lock, Phone,
    screwdriver, Whatsapp
} from '@/design-system/icons/outlined';

// Add aliases for commonly used icon names
export { Dropdown as DropdownIcon, Lock as LockIcon, Whatsapp as WhatsappIcon } from '@/design-system/icons/outlined';

