import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { registerWithEmail } from '../../services/auth.service';
import { COLORS } from '../../theme/theme';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm)
      return Alert.alert('Error', 'Please fill in all fields.');
    if (password !== confirm)
      return Alert.alert('Error', 'Passwords do not match.');
    if (password.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    try {
      setLoading(true);
      await registerWithEmail(email.trim(), password, name.trim());
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Join TrackBack today</Text>

      <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry={secure}
        right={<TextInput.Icon icon={secure ? 'eye' : 'eye-off'} onPress={() => setSecure(!secure)} />}
        style={styles.input}
      />
      <TextInput label="Confirm Password" value={confirm} onChangeText={setConfirm} mode="outlined" secureTextEntry style={styles.input} />

      <Button mode="contained" onPress={handleRegister} loading={loading} disabled={loading} style={styles.btn}>
        Create Account
      </Button>

      <View style={styles.footer}>
        <Text variant="bodyMedium">Already have an account? </Text>
        <Button mode="text" compact onPress={() => navigation.navigate('Login')}>Sign In</Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 24, alignItems: 'center' },
  logo: { width: 100, height: 100, marginTop: 32, marginBottom: 12 },
  title: { color: COLORS.primary, fontWeight: 'bold' },
  subtitle: { color: COLORS.textSecondary, marginBottom: 24 },
  input: { width: '100%', marginBottom: 12 },
  btn: { width: '100%', marginTop: 8, paddingVertical: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
});
