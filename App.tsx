import React, { useEffect, useState } from 'react';
import { PaperProvider, Snackbar } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { theme } from './src/theme/theme';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getMissingEnvVars } from './src/utils/envCheck';

export default function App() {
  const [envWarning, setEnvWarning] = useState('');

  useEffect(() => {
    const missing = getMissingEnvVars();
    if (missing.length > 0) {
      setEnvWarning(`Missing config: ${missing.join(', ')}`);
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
        <Snackbar
          visible={!!envWarning}
          onDismiss={() => setEnvWarning('')}
          duration={3000}
        >
          {envWarning}
        </Snackbar>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
