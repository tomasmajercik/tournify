import React, { useMemo, useRef, useState } from 'react';
import { Text, View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, TextInput, TouchableOpacity, Alert, FlatList } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import API_BASE_URL from "@/config/config";
import { useTheme } from "@/themes/theme";

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import LevelPicker from '@/components/create/levelPicker';
import CategoryPicker from '@/components/create/categoryPicker';
import DateTimePickerInput from '@/components/create/dateTimePicker';
import TimePickerInput from '@/components/create/timePicker';
import StartButton from '@/components/startButton';
import AnimationCreateTournament from '@/components/create/animationCreateTournament';

// API Key
import Constants from 'expo-constants';
import OfflineBanner from '@/components/offline/offlineBanner';
import { useRouter } from 'expo-router';
const apiKey = Constants?.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? 'DEFAULT_FALLBACK_KEY';

export default function CreateTournament() {

    const [tournamentName, setTournamentName] = useState('');
    const [tournamentPlace, setTournamentPlace] = useState('');
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);
    const [level, setLevel] = useState('');
    const [sport, setSport] = useState('');
    const [sportId, setSportId] = useState(0);

    const [tournamentDate, setTournamentDate] = useState(new Date());
    const [tournamentTime, setTournamentTime] = useState(new Date());

    const [teamSize, setTeamSize] = useState('');
    const gameOptions = ['indoor', 'outdoor', 'other'] as const;
    const [gameSetting, setGameSetting] = useState('');
    const [customSetting, setCustomSetting] = useState('');
    const [entryFee, setEntryFee] = useState('');
    const [prizeDescription, setPrizeDescription] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const placeRef = useRef<any>(null);
    const [tournamentId, setTournamentId] = useState<string | null>(null);

    const [showSuccess, setShowSuccess] = useState(false);


    const handleSubmit = async () => {
        const token = await AsyncStorage.getItem('token');

        if (!tournamentName || tournamentName.trim().length < 3) {
            Alert.alert('Validation Error', 'Please enter a valid tournament name (at least 3 characters).');
            return;
        }
        if (sportId <= 0) {
            Alert.alert('Validation Error', 'Please select a sport.');
            return;
        }
        if (!level) {
            Alert.alert('Validation Error', 'Please select level.');
            return;
        }
        if (!tournamentPlace || tournamentPlace.trim().length === 0) {
            Alert.alert('Validation Error', 'Please enter a location.');
            return;
        }
        if (isNaN(parseFloat(entryFee)) || parseFloat(entryFee) < 0) {
            Alert.alert('Validation Error', 'Enter valid fee value.');
            return;
        }
        if (isNaN(parseInt(teamSize)) || parseInt(teamSize) < 1) {
            Alert.alert('Validation Error', 'Team size must be at least 1.');
            return;
        }
        if (!gameSetting) {
            Alert.alert('Validation Error', 'Please select a game setting.');
            return;
        }
        const combinedDateTime = new Date(
            tournamentDate.getFullYear(),
            tournamentDate.getMonth(),
            tournamentDate.getDate(),
            tournamentTime.getHours(),
            tournamentTime.getMinutes()
        );

        if (combinedDateTime.getTime() < Date.now()) {
            Alert.alert('Validation Error', 'Tournament date and time must be in the future.');
            return;
        }

        try {
            const dateCombined = format(combinedDateTime, 'yyyy-MM-dd HH:mm:ss');

            const body = {
                tournament_name: tournamentName,
                category_id: sportId,
                location_name: tournamentPlace,
                latitude: latitude,
                longitude: longitude,
                level: level,
                max_team_size: Number(teamSize),
                game_setting: gameSetting === 'other' ? customSetting : gameSetting,
                entry_fee: parseFloat(entryFee),
                prize_description: prizeDescription,
                is_public: true, // default, future improvement
                additional_info: additionalInfo,
                status: 'Upcoming', // Default
                date: dateCombined,
            };

            const response = await fetch(`${API_BASE_URL}/tournaments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();
            const tournamentId = result.id;
            setTournamentId(tournamentId);

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create tournament');
            }

            setShowSuccess(true);
            placeRef.current?.setAddressText('');
            setTournamentName('');
            setTournamentPlace('');
            setLatitude(0);
            setLongitude(0);
            setLevel('');
            setSport('');
            setSportId(0);
            setTournamentDate(new Date());
            setTournamentTime(new Date());
            setTeamSize('');
            setGameSetting('');
            setCustomSetting('');
            setEntryFee('');
            setPrizeDescription('');
            setAdditionalInfo('');
            console.log('Tournament created successfully:', result);

        } catch (error: any) {
            const message = error.message?.toLowerCase?.() || '';

            if (message.includes('already exists')) {
                Alert.alert('Tournament Name Taken', 'A tournament with that name already exists. Please choose another name.');
            } else {
                Alert.alert('Error', 'Failed to create tournament. Please try again.');
            }
        }
    };

    // Variable to store the theme styles
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';

    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <OfflineBanner />
            <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.mainTitle}>
                    <MaterialIcons style={styles.icon} name="edit" size={24} color="black" />
                    <Text style={styles.title}>Create Tournament</Text>
                </View>
                <FlatList
                    data={[{}]} // dummy 1-item list
                    keyExtractor={() => 'form'}
                    keyboardShouldPersistTaps="handled"
                    renderItem={() => (
                        <View style={styles.formContent}>

                            {/* Tournament name */}
                            <View>
                                <Text style={styles.label}>Tournament Name</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        placeholder="Enter tournament name"
                                        placeholderTextColor={theme.placeholderText}
                                        style={styles.input}
                                        value={tournamentName}
                                        onChangeText={setTournamentName}
                                    />
                                    <FontAwesome6 name="keyboard" size={20} color={theme.text} style={styles.inputIcon} />
                                </View>
                            </View>

                            {/* Tournament category and level */}
                            <View style={styles.inputRow}>
                                <View style={{ width: Platform.OS === 'ios' ? "60%" : '50%' }}>
                                    <CategoryPicker sport={sport} setSport={setSport} categoryId={sportId} setCategoryId={setSportId} />
                                </View>
                                <View style={{ width: Platform.OS === 'ios' ? "40%" : '50%' }}>
                                    <LevelPicker level={level} setLevel={setLevel} />
                                </View>
                            </View>

                            {/* Tournament place */}
                            <View>
                                <Text style={styles.label}>Event place</Text>
                                <View>
                                    <GooglePlacesAutocomplete
                                        ref={placeRef}
                                        placeholder="Enter your city"
                                        onPress={(data, details) => {
                                            if (!details) return;
                                            const cityName = data.description;
                                            const { lat, lng } = details.geometry.location;
                                            setTournamentPlace(cityName);
                                            setLatitude(lat);
                                            setLongitude(lng);
                                        }}
                                        predefinedPlaces={[]}
                                        fetchDetails={true}
                                        query={{
                                            key: apiKey,
                                            language: 'en',
                                            types: 'address',
                                        }}
                                        textInputProps={{
                                            placeholderTextColor: theme.mutedText,
                                        }}
                                        styles={{
                                            container: {
                                                flex: 0,
                                                zIndex: 10,
                                                position: 'relative',

                                            },
                                            textInputContainer: { zIndex: 11 },
                                            textInput: {
                                                zIndex: 12,
                                                backgroundColor: theme.createInputBackground,
                                                borderColor: theme.createInputBorder,
                                                color: theme.text,
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                paddingHorizontal: 16,
                                                height: 48,
                                                fontSize: 16,
                                            },
                                            row: {
                                                backgroundColor: theme.createInputBackground,
                                            },
                                            description: {
                                                color: theme.text,
                                            },
                                            listView: {
                                                position: 'absolute',
                                                top: 48,
                                                zIndex: 50,
                                                elevation: 5,
                                                borderRadius: 10,
                                                width: '100%',
                                            },
                                            poweredContainer: {
                                                display: 'none',
                                            },
                                        }}
                                        onFail={(error) => {
                                            console.error("Google Places API error:", error);
                                        }}
                                        // All other default props explicitly defined // StackOverflow fix
                                        autoFillOnNotFound={false}
                                        currentLocation={false}
                                        currentLocationLabel="Current location"
                                        debounce={0}
                                        disableScroll={false}
                                        enableHighAccuracyLocation={true}
                                        enablePoweredByContainer={true}
                                        filterReverseGeocodingByTypes={[]}
                                        GooglePlacesDetailsQuery={{}}
                                        GooglePlacesSearchQuery={{
                                            rankby: 'distance',
                                            type: 'restaurant',
                                        }}
                                        GoogleReverseGeocodingQuery={{}}
                                        isRowScrollable={true}
                                        keyboardShouldPersistTaps="always"
                                        listUnderlayColor="#c8c7cc"
                                        listViewDisplayed="auto"
                                        keepResultsAfterBlur={false}
                                        minLength={1}
                                        nearbyPlacesAPI="GooglePlacesSearch"
                                        numberOfLines={1}
                                        onNotFound={() => { }}
                                        onTimeout={() =>
                                            console.warn('google places autocomplete: request timeout')
                                        }
                                        predefinedPlacesAlwaysVisible={false}
                                        suppressDefaultStyles={false}
                                        textInputHide={false}
                                        timeout={20000}
                                    />
                                </View>
                            </View>

                            {/* Tournament date and time */}
                            <View style={styles.inputRow}>
                                <View style={{ width: '50%' }}>
                                    <DateTimePickerInput date={tournamentDate} setDate={setTournamentDate} />
                                </View>
                                <View style={{ width: '50%' }}>
                                    <TimePickerInput time={tournamentTime} setTime={setTournamentTime} />
                                </View>
                            </View>


                            {/* Team size and entry fee */}
                            <View style={styles.inputRow}>
                                <View style={{ width: '50%', paddingRight: 5 }}>
                                    <Text style={styles.label}>Entry fee</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            placeholder="5.00"
                                            value={entryFee}
                                            onChangeText={setEntryFee}
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholderTextColor="#888"
                                        />
                                        <View style={styles.euroCircle}>
                                            <Text style={styles.euroText}>€</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ width: '50%', paddingLeft: 5 }}>
                                    <Text style={styles.label}>Team Size</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            placeholder="2"
                                            placeholderTextColor={theme.placeholderText}
                                            value={teamSize}
                                            onChangeText={setTeamSize}
                                            style={styles.numInput}
                                            keyboardType="numeric"
                                        />
                                        <FontAwesome6 name="keyboard" size={20} color={theme.text} style={styles.inputIcon} />
                                    </View>
                                </View>
                            </View>

                            {/* Game setting */}
                            <View>
                                <Text style={styles.label}>Game Setting</Text>
                                <View style={styles.gameSettingRow}>
                                    {gameOptions.map(option => {
                                        const isActive = gameSetting === option;

                                        return (
                                            <TouchableOpacity
                                                key={option}
                                                onPress={() => setGameSetting(option)}
                                                style={{ flex: 1 }}
                                            >
                                                {isActive ? (
                                                    <LinearGradient
                                                        colors={isBW ? ["#999", "#777"] : ["#64CA76", "#2E8B57"]}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 1 }}
                                                        style={styles.optionButton}
                                                    >
                                                        <Text style={[styles.optionText, styles.optionTextActive]}>
                                                            {option}
                                                        </Text>
                                                    </LinearGradient>
                                                ) : (
                                                    <View style={styles.optionButton}>
                                                        <Text style={styles.optionText}>{option}</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {gameSetting === 'other' && (
                                    <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                                        <TextInput
                                            placeholder="Enter custom setting"
                                            value={customSetting}
                                            onChangeText={setCustomSetting}
                                            style={styles.input}
                                            placeholderTextColor="#888"
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Prize description */}
                            <View style={styles.inputRow}>
                                <View style={{ width: '100%' }}>
                                    <Text style={styles.label}>Prize Description</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            placeholder="T-shirt merch"
                                            value={prizeDescription}
                                            onChangeText={setPrizeDescription}
                                            style={styles.input}
                                            placeholderTextColor="#888"
                                        />
                                        <FontAwesome6 name="keyboard" size={20} color={theme.text} style={styles.inputIcon} />
                                    </View>
                                </View>
                            </View>

                            {/* Additional info */}
                            <View>
                                <Text style={styles.label}>Additional info</Text>
                                <View style={styles.textAreaWrapper}>
                                    <TextInput
                                        placeholder="Enter additional information..."
                                        value={additionalInfo}
                                        onChangeText={setAdditionalInfo}
                                        style={styles.textArea}
                                        multiline
                                        numberOfLines={6}
                                        placeholderTextColor="#888"
                                    />
                                    <FontAwesome6 name="keyboard" size={20} color={theme.text} style={styles.inputIcon} />
                                </View>
                            </View>

                            {/*  submit  */}
                            <View style={styles.buttonWrapper}>
                                <StartButton title="Submit" onPress={handleSubmit} />
                            </View>

                            <AnimationCreateTournament
                                show={showSuccess}
                                caption="Successfully created!"
                                onHide={() => {
                                    setShowSuccess(false)
                                    router.replace(`/tournament/manage/${tournamentId}/startEdit`);
                                }
                                }
                            />


                        </View>
                    )}
                    contentContainerStyle={styles.container}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


const getStyles = (theme: ReturnType<typeof useTheme>) => {
    const isBW = theme.id === 'blackWhiteTheme';

    return StyleSheet.create({

        safeArea: {
            flex: 1,
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'ios' ? 0 : 40,
        },
        wrapper: {
            flex: 1,
            backgroundColor: theme.background,
        },
        container: {
            padding: 24,
        },
        mainTitle: {
            flexDirection: 'row',
            textAlignVertical: 'center',
            marginTop: 20,
            marginLeft: 25,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 25,
            color: theme.text,
        },
        icon: {
            marginTop: 4,
            marginRight: 10,
            color: theme.text,
        },
        row: {
            flexDirection: 'row',
            textAlignVertical: 'center',
        },
        label: {
            fontSize: 14,
            fontWeight: '500',
            marginBottom: 5,
            marginTop: 10,
            marginLeft: 15,
            color: theme.text,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.createInputBackground,
            borderColor: theme.createInputBorder,
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            height: 50,
        },
        input: {
            flex: 1,
            fontSize: 16,
            paddingVertical: 0,
            color: theme.text,
        },
        inputIcon: {
            marginRight: 7,
        },
        pickerWrapper: {
            marginVertical: 10,
        },
        inputRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
        },
        numInput: {
            backgroundColor: theme.createInputBackground,

            borderColor: theme.createInputBorder,
            borderWidth: 1,
            borderLeftWidth: 0,
            borderRightWidth: 0,

            paddingHorizontal: 20,
            paddingVertical: 10,
            height: 50,
            fontSize: 16,
            color: theme.text,
            textAlign: 'left',
            marginLeft: 5,
        },
        gameSettingRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 10,
            marginTop: 5,
        },
        optionButton: {
            paddingVertical: 12,
            backgroundColor: theme.createInputBackground,
            borderColor: theme.createInputBorder,
            borderWidth: 1,

            borderRadius: 25,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center'
        },
        optionButtonActive: {
            backgroundColor: isBW ? '#000' : '#64CA76',
        },
        optionText: {
            fontSize: 14,
            color: '#666',
        },
        optionTextActive: {
            fontWeight: '900',
            color: '#eee',
        },
        euroCircle: {
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.text,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
        },
        euroText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.text,
        },
        buttonWrapper: {
            width: '100%',
            marginTop: 30
        },
        error: {
            color: '#d9534f',
            fontSize: 14,
            marginBottom: 10,
            textAlign: 'center',
        },
        textAreaWrapper: {
            backgroundColor: theme.createInputBackground,
            borderColor: theme.createInputBorder,
            borderWidth: 1,
            borderRadius: 15,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'flex-start',
            position: 'relative',
        },
        textArea: {
            flex: 1,
            fontSize: 16,
            color: theme.text,
            textAlignVertical: 'top', // needed for android
            minHeight: 100,
        },
        formContent: {
            gap: 15,
        },
    });
};