import React, { useState } from 'react';
import { Image, Text, View, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/hooks/useTheme';
import { AppIcon } from './AppIcon';

type Props = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  showBorder?: boolean;
  isOwnAvatar?: boolean;
};

export const ProfileAvatar = ({ uri, name, size = 44, className = '', showBorder = true, isOwnAvatar = false }: Props) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const initial = (name || 'G').slice(0, 1).toUpperCase();

  const handlePress = () => {
    if (isOwnAvatar) {
      router.push('/settings');
    } else if (uri) {
      setModalVisible(true);
    }
  };

  const avatarComponent = (
    <View
      className={`rounded-full overflow-hidden items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: theme.accentLight,
        borderWidth: showBorder ? 2 : 0,
        borderColor: theme.accent + '40',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: theme.accent, fontSize: size * 0.38, fontWeight: '700' }}>{initial}</Text>
      )}
    </View>
  );

  const renderAvatar = (isOwnAvatar || uri) ? (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      {avatarComponent}
    </TouchableOpacity>
  ) : (
    avatarComponent
  );

  return (
    <>
      {renderAvatar}

      {uri && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View className="flex-1 bg-black/90 justify-center items-center relative">
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="absolute top-12 right-6 w-10 h-10 bg-white/10 rounded-full items-center justify-center active:bg-white/20 z-50"
              >
                <AppIcon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Big Expanded Image */}
              <View className="w-[90%] aspect-square bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
              </View>

              {name && (
                <Text className="text-white font-extrabold text-lg mt-4 capitalize">
                  {name}
                </Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
};
