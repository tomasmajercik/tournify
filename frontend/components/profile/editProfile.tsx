import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import API_BASE_URL from '@/config/config';
import { useTheme } from '@/themes/theme';

interface EditProfileProps {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  token: string;
  onDone: () => void;
}

export default function EditProfile({ user, token, onDone }: EditProfileProps) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);

  const handleSave = async () => {
    if(!firstName || !lastName){
        Alert.alert("Missing fields", "Please enter both passwords.");
        return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/users/editProfile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update');
      }

      onDone(); // napr. skryť formulár alebo refetch
    } catch (error) {
      console.error('❌ Failed to update user:', error);
    }
  };

    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>First Name</Text>
      <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} />

      <Text style={styles.label}>Last Name</Text>
      <TextInput value={lastName} onChangeText={setLastName} style={styles.input} />

      <Button title="Save" onPress={handleSave} color={isBW ? '#fff' : '#007AFF'}/>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => {
  return StyleSheet.create({
    container: { 
      padding: 20,
    },
    label: { 
      fontSize: 16, 
      marginLeft: 10,
      marginBottom: 5,
      marginTop: 10,
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      borderRadius: 8,
      marginTop: 5,
      color: theme.text,
    },
  });
};
