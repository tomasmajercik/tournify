// components/profile/ChangePasswordForm.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import API_BASE_URL from '@/config/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/themes/theme';


interface ChangePasswordProps{
    token: string;
    onDone: () => void;
}

export default function ChangePasswordForm({token, onDone} :ChangePasswordProps ) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
 
  const handleChangePassword = async () => {
    setError(null);
    setSuccess(false);

    if (!newPassword || !oldPassword) {
        Alert.alert("Missing fields", "Please enter both passwords.");
        return;
    }
    if (newPassword.length < 8) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    if (!/[A-Z]/.test(newPassword)) {
        alert("New password must contain at least one uppercase letter.");
        return;
    }

    if (!/[a-z]/.test(newPassword)) {
        alert("New password must contain at least one lowercase letter.");
        return;
    }
    if (!/[0-9]/.test(newPassword)) {
        alert("New password must contain at least one number.");
        return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/changePassword`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            newPassword: newPassword,
            oldPassword: oldPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to change password');

      setSuccess(true);

      onDone(); // close form
    } catch (error: any) {
      console.log('❌ Password change error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const isBW = theme.id === 'blackWhiteTheme';

  return (
    <View style={styles.container}>
        <Text style={styles.label}>Old Password</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="gray" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder="Enter old password"
                placeholderTextColor="#888"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="gray" />
            </TouchableOpacity>
        </View>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="gray" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#888"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="gray" />
            </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttonGroup}>
            <Button title="Cancel" onPress={onDone} color={isBW ? '#ddd' : '#f00'}/>
            <Button title="Save" onPress={handleChangePassword} disabled={loading} color={isBW ? '#fff' : '#007AFF'}/>
        </View>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 10,
},
label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: theme.text,
},
input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    color: theme.text,
},
error: {
    color: 'red',
    marginTop: 8,
    fontSize: 13,
},
buttonGroup: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
},
inputIcon: {
    marginRight: 10,
},
inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    width: '100%',
    backgroundColor: theme.inputBackground,
    marginTop: 10,
  },
});
