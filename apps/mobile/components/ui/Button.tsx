import { Pressable, Text, StyleSheet, PressableProps, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'small' | 'medium' | 'large';
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        styles[size],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={disabled}
      {...props}
    >
      <Text style={[styles.text, styles[`${variant}Text`] as TextStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Variants
  primary: {
    backgroundColor: '#3b82f6',
  },
  secondary: {
    backgroundColor: '#6b7280',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  // Text
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
  },
  secondaryText: {
    color: '#fff',
    fontSize: 16,
  },
  outlineText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  destructiveText: {
    color: '#fff',
    fontSize: 16,
  },
  // States
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
