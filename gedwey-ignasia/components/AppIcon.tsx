import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '../lib/navigationIcons';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
};

export const AppIcon = ({ name, size = 22, color = '#2563EB' }: Props) => {
  return <Ionicons name={name} size={size} color={color} />;
};
