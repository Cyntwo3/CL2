import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithCode } from '@/services/auth';

const ACCENT = '#208AEF';
const BG = '#F0F7FF';
const TEXT = '#0D1B2A';
const MUTED = '#7A8FA6';

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed || loading) return;
    setError('');
    setLoading(true);
    try {
      await signInWithCode(trimmed);
      // AuthProvider picks up the session change automatically
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>

        <Text style={styles.title}>RagaMuffin</Text>
        <Text style={styles.subtitle}>Enter your invite code to get started.</Text>

        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(v) => { setCode(v); setError(''); }}
          placeholder="Invite code"
          placeholderTextColor={MUTED}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!loading}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={({ pressed }) => [
            styles.btn,
            (!code.trim() || loading) && styles.btnOff,
            pressed && { opacity: 0.85 },
          ]}
          onPress={submit}
          disabled={!code.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Join</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: TEXT },
  subtitle: { fontSize: 16, color: MUTED, textAlign: 'center' },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#C8DDEF',
    paddingHorizontal: 16,
    fontSize: 17,
    color: TEXT,
    marginTop: 8,
  },
  error: { color: '#D0341B', fontSize: 14, alignSelf: 'flex-start' },
  btn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff: { backgroundColor: '#C8DDEF' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
