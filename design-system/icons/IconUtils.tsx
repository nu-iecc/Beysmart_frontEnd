import React from 'react';
import { ICON_CONFIG, ICON_MAPPING } from '../Navigation/Constants';
import {
  AlertIcon, EnergyIcon, HomeIcon, LightIcon,
  LivingIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon
} from './filled';
import Dropdown from './outlined/Dropdown';
import Lock from './outlined/Lock';
import CorrectIcon from './outlined/correct';

const ICON_COMPONENTS = {
  HomeIcon, LightIcon, EnergyIcon, UserIcon, PlusIcon, AlertIcon, Dropdown,
  LivingIcon, SettingsIcon, Lock, CorrectIcon,
} as const;

export type IconKey = keyof typeof ICON_MAPPING;
export type IconSize = 'small' | 'medium' | 'large';

export interface IconProps {
  key: IconKey;
  size?: IconSize | { width: number; height: number };
  color?: string;
  isActive?: boolean;
}

export const renderIcon = (props: IconProps): React.ReactNode => {
  const { key, size = 'medium', color, isActive } = props;
  
  if (!isValidIconKey(key)) {
    console.warn(`Invalid icon key: ${key}`);
    return null;
  }

  const IconComponent = ICON_COMPONENTS[ICON_MAPPING[key]];
  if (!IconComponent) {
    console.warn(`Icon component not found for key: ${key}`);
    return null;
  }

  const iconSize = typeof size === 'string' ? getIconSize('navigation', size) : size;
  
  return (
    <IconComponent 
      width={iconSize.width} 
      height={iconSize.height} 
      color={color}
      isActive={isActive}
    />
  );
};

export const getIconSize = (
  context: 'navigation' | 'button' | 'avatar' | 'notification', 
  screenSize?: 'small' | 'medium' | 'large'
): { width: number; height: number } => {
  // Map lowercase size names to uppercase constants
  const sizeMap = {
    small: 'SMALL',
    medium: 'MEDIUM', 
    large: 'LARGE'
  } as const;
  
  const sizeKey = sizeMap[screenSize || 'medium'];
  return ICON_CONFIG.SIZES[sizeKey];
};

export const createTabItems = (tabs: Array<{ key: string; label: string; iconKey: IconKey }>) => {
  return tabs.map(tab => ({
    ...tab,
    icon: renderIcon({ key: tab.iconKey, size: 'medium' })
  }));
};

export const isValidIconKey = (key: string): key is IconKey => {
  return key in ICON_MAPPING;
};

export const getIconKeysByType = (type: keyof typeof ICON_CONFIG.TYPES): IconKey[] => {
  return ICON_CONFIG.TYPES[type].filter(key => isValidIconKey(key)) as IconKey[];
};
