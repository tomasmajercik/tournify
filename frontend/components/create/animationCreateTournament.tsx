import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/themes/theme';

type AnimationProps = {
  show: boolean;
  onHide: (value: boolean) => void;
  caption: string;
};

export default function AnimationCreateTournament({ show, onHide, caption }: AnimationProps) {
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    if (show) {
      setAnimationDone(false);
    }
  }, [show]);

  useEffect(() => {
    if (animationDone) {
      const timer = setTimeout(() => {
        onHide(false);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [animationDone]);

  const theme = useTheme();
  const isBW = theme.id === 'blackWhiteTheme';

  return (
    <Modal visible={show} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <LottieView
            source={
              isBW
                ? require('@/assets/animations/successAnimationBW.json')
                : require('@/assets/animations/successAnimation.json')
            }
            autoPlay
            loop={false}
            style={styles.animation}
            onAnimationFinish={() => setAnimationDone(true)}
          />
          <Text style={styles.successText}>{caption}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '60%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  animation: {
    width: 150,
    height: 150,
  },
  successText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
  },
});
