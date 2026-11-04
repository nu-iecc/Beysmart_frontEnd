import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
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
      fontSize: fonts.size.h1,
      lineHeight: fonts.lineHeight.h1,
      fontWeight: fonts.weight.bold as any,
      fontFamily: fonts.family.bold,
    },
    h2: {
      fontSize: fonts.size.h2,
      lineHeight: fonts.lineHeight.h2,
      fontWeight: fonts.weight.bold as any,
      fontFamily: fonts.family.bold,
    },
    h3: {
      fontSize: fonts.size.h3,
      lineHeight: fonts.lineHeight.h3,
      fontWeight: fonts.weight.medium as any,
      fontFamily: fonts.family.medium,
    },
    accent: {
      fontSize: fonts.size.accent,
      lineHeight: fonts.lineHeight.body,
      fontWeight: fonts.weight.bold as any,
      fontFamily: fonts.family.bold,
    },
    body: {
      fontSize: fonts.size.body,
      lineHeight: fonts.lineHeight.body,
      fontWeight: fonts.weight.regular as any,
      fontFamily: fonts.family.base,
    },
    caption: {
      fontSize: fonts.size.caption,
      lineHeight: fonts.lineHeight.caption,
      fontWeight: fonts.weight.regular as any,
      fontFamily: fonts.family.base,
    },
  });
