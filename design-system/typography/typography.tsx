import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { scaleFont } from '../../utils/responsive';
import { colors } from '../colors/colors';
import { fonts } from './fonts';

type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'accent'
  | 'body'
  | 'caption';

  interface TypographyProps extends TextProps {
    variant?: Variant;
    color?: string;
    children: React.ReactNode;
  }

  export const Typography = ({
    variant = 'body',
    color = colors.text,
    children,
    style,
    ...props
  }: TypographyProps) => {
    return (
      <Text style={[styles[variant], { color }, style]} {...props}>
        {children}
      </Text>
    );
  };

  const styles = StyleSheet.create({
    h1: {
      fontSize: scaleFont(fonts.size.h1),
      lineHeight: scaleFont(fonts.lineHeight.h1),
      fontWeight: fonts.weight.bold as any,
      fontFamily: fonts.family.base,
    },
    h2: {
      fontSize: scaleFont(fonts.size.h2),
      lineHeight: scaleFont(fonts.lineHeight.h2),
      fontWeight: fonts.weight.bold as any,
      fontFamily: fonts.family.base,
    },
    h3: {
      fontSize: scaleFont(fonts.size.h3),
      lineHeight: scaleFont(fonts.lineHeight.h3),
      fontWeight: fonts.weight.medium as any,
      fontFamily: fonts.family.base,
    },
    accent: {
      fontSize: scaleFont(fonts.size.accent),
      lineHeight: scaleFont(fonts.lineHeight.body),
      fontWeight: fonts.weight.bold as any,
      fontFamily: fonts.family.base,
    },
    body: {
      fontSize: scaleFont(fonts.size.body),
      lineHeight: scaleFont(fonts.lineHeight.body),
      fontWeight: fonts.weight.regular as any,
      fontFamily: fonts.family.base,
    },
    caption: {
      fontSize: scaleFont(fonts.size.caption),
      lineHeight: scaleFont(fonts.lineHeight.caption),
      fontWeight: fonts.weight.regular as any,
      fontFamily: fonts.family.base,
    },
  });
  