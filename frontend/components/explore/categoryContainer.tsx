import { Text, View, StyleSheet, ImageBackground, TouchableOpacity } from "react-native";
import { useMemo } from "react";
import { useTheme } from "@/themes/theme";
import API_BASE_URL from "@/config/config";


interface Props {
    categoryName: string;
    imageFilename: string;
    onPress: () => void;
}

export default function CategoryContainer({ categoryName, imageFilename, onPress }: Props) {
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';


    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <View style={styles.container}>
                <View style={styles.imgContainer}>
                    <ImageBackground
                        style={styles.image}
                        source={{
                            uri: `${API_BASE_URL}/category/images/${imageFilename}?grayscale=${isBW}`,
                        }}
                        onError={(error) => {
                            console.log("Image failed to load:", error.nativeEvent.error);
                        }}
                    >
                        <View style={styles.overlay}>
                            <Text style={styles.sportText}>{categoryName}</Text>
                        </View>
                    </ImageBackground>
                </View>
            </View>
        </TouchableOpacity>
    );
}


const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    imgContainer: {
        width: '90%',
        borderRadius: 10,
        overflow: 'hidden',
    },
    image: {
        height: 150,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    sportText: {
        fontFamily: 'Koulen',
        fontSize: 28,
        color: '#fff',
        zIndex: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
