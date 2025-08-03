import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Modal, } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { format } from 'date-fns';
import { useTheme } from "@/themes/theme";

export default function TimePickerInput({
  time,
  setTime,
}: {
  time: Date;
  setTime: (value: Date) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [tempTime, setTempTime] = useState(time);

  const handleAndroidChange = (event: any, selectedTime?: Date) => {
    setShowModal(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View>
      <Text style={styles.label}>Time</Text>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={styles.inputWrapper}
      >
        <Text style={styles.inputText}>{format(time, 'HH:mm')}</Text>
        <FontAwesome6 name="clock" size={20} color="black" style={styles.inputIcon} />
      </TouchableOpacity>

      {/* iOS modal */}
      {Platform.OS === 'ios' && showModal && (
        <Modal transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    setTime(tempTime);
                  }}
                >
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedTime) => {
                    if (selectedTime) setTempTime(selectedTime);
                  }}
                  textColor={theme.text}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android picker */}
      {Platform.OS === 'android' && showModal && (
        <DateTimePicker
          value={time}
          mode="time"
          display="spinner"
          onChange={handleAndroidChange}
        />
      )}
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    marginLeft: 15,
    marginTop: 10,
    color: theme.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.createInputBackground,
    borderColor: theme.createInputBorder,
    borderWidth: 1,

    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 50,
    marginRight: 5,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  inputIcon: {
    marginLeft: 8,
    color: theme.text,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: theme.createInputBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.createInputBorder,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    paddingRight: 15,
  },
  pickerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
