import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Modal, } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { format } from 'date-fns';
import { useTheme } from "@/themes/theme";

export default function DateTimePickerInput({
  date,
  setDate,
}: {
  date: Date;
  setDate: (value: Date) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState(date);

  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View>
      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={styles.inputWrapper}
      >
        <Text style={styles.inputText}>{format(date, 'dd.MM.yyyy')}</Text>
        <FontAwesome6 name="calendar-minus" size={20} color={theme.text} />
      </TouchableOpacity>

      {Platform.OS === 'ios' && showModal? (
        <Modal transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    setDate(tempDate);
                  }}
                >
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerWrapper}>
                <Text style={styles.dayLabel}>
                  {format(tempDate, 'EEEE, d MMMM yyyy')}
                </Text>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  textColor={theme.text}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setTempDate(selectedDate);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showModal && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowModal(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )
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
    borderBottomColor: '#ddd',
    marginRight: 15,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  pickerWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#999',
  },
  
});

