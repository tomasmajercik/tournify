import React, { useMemo } from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/themes/theme';

type SportCardProps = {
  title: string;
  image: any;
  selected: boolean;
  onPress: () => void;
};

export default function SportCard({ title, image, selected, onPress }: SportCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <TouchableOpacity style={[styles.card]} onPress={onPress}>

      <View style={styles.imageWrapper}>
        <Image source={image} style={styles.image} />
        {selected && (
          <View style={styles.overlay}>
            <Ionicons name="checkmark-circle-sharp" size={50} color="#eee" />
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>

    </TouchableOpacity>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  card: {
    width: '45%',
    margin: '2.5%',
    backgroundColor: theme.background,
    borderRadius: 16,
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 10,
  },
  imageWrapper: {
    position: 'relative',
    width: 145,
    height: 145,
    borderRadius: 12,
    overflow: 'hidden',
  },
  title: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 18,
    color: theme.text,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
