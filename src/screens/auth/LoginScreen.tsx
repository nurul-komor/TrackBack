import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { loginWithEmail, signInWithGoogle } from '../../services/auth.service';
import { COLORS } from '../../theme/theme';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      handleGoogleSignIn(id_token);
    }
  }, [googleResponse]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setLoading(true);
      await signInWithGoogle(idToken);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields.');
    try {
      setLoading(true);
      await loginWithEmail(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry={secure}
        right={<TextInput.Icon icon={secure ? 'eye' : 'eye-off'} onPress={() => setSecure(!secure)} />}
        style={styles.input}
      />

      <Button mode="text" onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
        Forgot Password?
      </Button>

      <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading} style={styles.btn}>
        Sign In
      </Button>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        icon="google"
        onPress={() => promptGoogleAsync()}
        disabled={loading}
        style={styles.googleBtn}
        textColor={COLORS.primary}
      >
        Continue with Google
      </Button>

      <View style={styles.footer}>
        <Text variant="bodyMedium">Don't have an account? </Text>
        <Button mode="text" compact onPress={() => navigation.navigate('Register')}>
          Sign Up
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 24, alignItems: 'center' },
  logo: { width: 120, height: 120, marginTop: 40, marginBottom: 16 },
  title: { color: COLORS.primary, fontWeight: 'bold' },
  subtitle: { color: COLORS.textSecondary, marginBottom: 24 },
  input: { width: '100%', marginBottom: 12 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 8 },
  btn: { width: '100%', marginBottom: 16, paddingVertical: 4 },
  divider: { width: '100%', marginVertical: 16 },
  googleBtn: { width: '100%', borderColor: COLORS.primary },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
});
