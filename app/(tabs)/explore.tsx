import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import TextField from '../../design-system/inputs/TextField';

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function ExploreTab() {
  const [email, setEmail] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [successValue, setSuccessValue] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const emailError = email.length > 0 && !isValidEmail(email) ? 'Invalid email' : undefined;
  const emailSuccess = email.length > 0 && isValidEmail(email) ? 'Looks good!' : undefined;

  const successFieldSuccess = successValue.length > 0 ? 'Looks good!' : undefined;
  const successFieldError = successValue.length === 0 ? 'Field cannot be empty' : undefined;

  const errorFieldError = errorValue.length > 0 ? 'This field is required' : undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.exampleBlock}>
        <TextField
          label="Email (Dynamic)"
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          error={emailError}
          success={emailSuccess}
          helperText="Enter a valid email address."
        />
        <TextField
          label="Error (Dynamic)"
          value={errorValue}
          onChangeText={setErrorValue}
          placeholder="Type to trigger error"
          error={errorFieldError}
        />
        <TextField
          label="Success (Dynamic)"
          value={successValue}
          onChangeText={setSuccessValue}
          placeholder="Type to trigger success"
          success={successFieldSuccess}
          error={successFieldError}
        />
        <TextField
          label="Disabled"
          value="Unavailable input"
          onChangeText={() => {}}
          placeholder="Unavailable input"
          disabled
        />
        <TextField
          label="With Icon"
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder="Search devices..."
          leftIcon={<Ionicons name="search-outline" size={20} color="#6E6E6E" />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  exampleBlock: {
    gap: 16,
  },
});
