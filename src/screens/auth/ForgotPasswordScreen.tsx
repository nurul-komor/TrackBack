import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { resetPassword } from '../../services/auth.service';
import { COLORS } from '../../theme/theme';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email.');
    try {
      setLoading(true);
      await resetPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Reset Password</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {sent ? 'Check your email for a reset link.' : "Enter your email and we'll send a reset link."}
      </Text>

      {!sent && (
        <>
          <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
          <Button mode="contained" onPress={handleReset} loading={loading} disabled={loading} style={styles.btn}>
            Send Reset Link
          </Button>
        </>
      )}

      <Button mode="text" onPress={() => navigation.goBack()} style={styles.backBtn}>
        Back to Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  title: { color: COLORS.primary, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: COLORS.textSecondary, marginBottom: 24 },
  input: { marginBottom: 16 },
  btn: { paddingVertical: 4 },
  backBtn: { marginTop: 16 },
});
