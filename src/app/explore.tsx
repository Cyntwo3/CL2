import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchMessages,
  sendChatMessage,
  subscribeToMessages,
  type ChatMessage,
} from '@/services/chat';

const ACCENT = '#208AEF';
const BG = '#F0F7FF';
const BUBBLE_AI = '#FFFFFF';
const BUBBLE_USER = '#208AEF';
const TEXT = '#0D1B2A';
const MUTED = '#7A8FA6';

// Secret PIN to reveal the real chat. Set EXPO_PUBLIC_CHAT_PIN in EAS env vars.
// Default "1234" only used in local dev — change before building.
const CHAT_PIN = process.env.EXPO_PUBLIC_CHAT_PIN || '1234';

// Fake scrambled "study history" shown when locked
const FAKE_SESSIONS = [
  {
    id: 'f1',
    date: 'Today, 3:42 PM',
    preview: 'The mitochondria is often called the powerhouse of the cell because it generates most of the cell…',
  },
  {
    id: 'f2',
    date: 'Yesterday, 7:15 PM',
    preview: 'Great question! Fractions work like slices of a pizza. If you divide a pizza into 8 slices and take…',
  },
  {
    id: 'f3',
    date: 'Mon, Jun 9',
    preview: 'The American Revolution began in 1775 when tensions between the thirteen colonies and the British…',
  },
  {
    id: 'f4',
    date: 'Fri, Jun 6',
    preview: 'In Python, a loop lets you repeat a block of code. Here\'s a simple example using a for loop that…',
  },
];

function LockedView() {
  return (
    <View style={lock.root}>
      {FAKE_SESSIONS.map((s) => (
        <View key={s.id} style={lock.row}>
          <View style={lock.icon}>
            <Text style={lock.iconText}>M</Text>
          </View>
          <View style={lock.info}>
            <Text style={lock.date}>{s.date}</Text>
            <Text style={lock.preview} numberOfLines={2}>
              {s.preview}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

interface BubbleProps {
  msg: ChatMessage;
  currentUserId: string;
}

function Bubble({ msg, currentUserId }: BubbleProps) {
  const isMe = msg.sender_id === currentUserId;
  return (
    <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
      {!isMe && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {msg.profiles?.display_name?.[0] ?? 'D'}
          </Text>
        </View>
      )}
      <View style={[styles.bubble, isMe ? styles.bubbleUser : styles.bubbleAi]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextUser]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const currentUserId = session?.user?.id ?? '';

  const [unlocked, setUnlocked] = useState(false);
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const listRef = useRef<FlatList>(null);

  // Auto-lock when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        setUnlocked(false);
        setFilter('');
      }
    });
    return () => sub.remove();
  }, []);

  // Load messages and subscribe to realtime when unlocked
  useEffect(() => {
    if (!unlocked || !currentUserId) return;

    setLoadError('');
    fetchMessages()
      .then(setMessages)
      .catch(() => setLoadError('Could not load messages. Check your connection.'));

    const channel = subscribeToMessages((newMsg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => { channel.unsubscribe(); };
  }, [unlocked, currentUserId]);

  // Check PIN as user types into the filter input
  const handleFilterChange = useCallback((text: string) => {
    setFilter(text);
    if (text === CHAT_PIN) {
      setUnlocked(true);
      setFilter('');
    }
  }, []);

  const lock = useCallback(() => {
    setUnlocked(false);
    setFilter('');
    setInput('');
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !currentUserId) return;
    setInput('');
    setSending(true);
    try {
      await sendChatMessage(text, currentUserId);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, sending, currentUserId]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Study History</Text>
          <Text style={styles.headerSub}>
            {unlocked ? 'Live chat' : 'Recent sessions'}
          </Text>
        </View>
        {unlocked && (
          <Pressable onPress={lock} style={styles.lockBtn}>
            <Text style={styles.lockBtnText}>Hide</Text>
          </Pressable>
        )}
      </View>

      {/* Search / PIN input — always visible, looks like a filter */}
      {!unlocked && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={filter}
            onChangeText={handleFilterChange}
            placeholder="Filter sessions…"
            placeholderTextColor={MUTED}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {/* Body */}
      {!unlocked ? (
        <LockedView />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {loadError ? (
            <View style={styles.centerMsg}>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <Bubble msg={item} currentUserId={currentUserId} />
              )}
              contentContainerStyle={[
                styles.list,
                { paddingBottom: insets.bottom + 90 },
              ]}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: false })
              }
              ListEmptyComponent={
                <View style={styles.centerMsg}>
                  <Text style={styles.mutedText}>No messages yet. Say hi!</Text>
                </View>
              }
            />
          )}

          {/* Message input */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message…"
              placeholderTextColor={MUTED}
              multiline
              maxLength={2000}
              returnKeyType="send"
              onSubmitEditing={send}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={send}
              disabled={!input.trim() || sending}
              style={({ pressed }) => [
                styles.sendBtn,
                (!input.trim() || sending) && styles.sendBtnOff,
                pressed && { opacity: 0.8 },
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>↑</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// Locked view styles (study history look)
const lock = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE9F5',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  info: { flex: 1, gap: 4 },
  date: { fontSize: 12, color: MUTED },
  preview: { fontSize: 14, color: TEXT, lineHeight: 20 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE9F5',
  },
  headerLeft: { gap: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  headerSub: { fontSize: 12, color: MUTED },
  lockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#C8DDEF',
  },
  lockBtnText: { fontSize: 13, color: MUTED, fontWeight: '600' },

  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE9F5',
  },
  searchInput: {
    height: 38,
    borderRadius: 10,
    backgroundColor: BG,
    paddingHorizontal: 14,
    fontSize: 15,
    color: TEXT,
    borderWidth: 1,
    borderColor: '#C8DDEF',
  },

  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7A8FA6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleAi: {
    backgroundColor: BUBBLE_AI,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleUser: { backgroundColor: BUBBLE_USER, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 16, lineHeight: 22, color: TEXT },
  bubbleTextUser: { color: '#FFFFFF' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DDE9F5',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: BG,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: TEXT,
    borderWidth: 1,
    borderColor: '#C8DDEF',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#C8DDEF' },
  sendBtnText: { color: '#FFF', fontSize: 20, fontWeight: '700' },

  centerMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  mutedText: { color: MUTED, fontSize: 15 },
  errorText: { color: '#D0341B', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
