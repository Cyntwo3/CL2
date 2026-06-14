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
import { useChildMode } from '@/contexts/child-mode-context';
import {
  fetchMessages,
  sendChatMessage,
  subscribeToMessages,
  type ChatMessage,
} from '@/services/chat';

const G = {
  bg: '#212121', surface: '#2f2f2f', border: '#424242',
  text: '#ececec', muted: '#8e8ea0', accent: '#10a37f',
};
const M = {
  bg: '#F0F7FF', surface: '#FFFFFF', border: '#DDE9F5',
  text: '#0D1B2A', muted: '#7A8FA6', accent: '#208AEF',
};

const CHAT_PIN = process.env.EXPO_PUBLIC_CHAT_PIN || '1234';

const FAKE_SESSIONS = [
  { id: 'f1', date: 'Today, 3:42 PM', preview: 'The mitochondria is often called the powerhouse of the cell because it generates most of the cell…' },
  { id: 'f2', date: 'Yesterday, 7:15 PM', preview: "Great question! Fractions work like slices of a pizza. If you divide a pizza into 8 slices and take…" },
  { id: 'f3', date: 'Mon, Jun 9', preview: 'The American Revolution began in 1775 when tensions between the thirteen colonies and the British…' },
  { id: 'f4', date: 'Fri, Jun 6', preview: "In Python, a loop lets you repeat a block of code. Here's a simple example using a for loop that…" },
];

function ChildLockedView() {
  return (
    <View style={cl.root}>
      {FAKE_SESSIONS.map((s) => (
        <View key={s.id} style={cl.row}>
          <View style={cl.icon}>
            <Text style={cl.iconText}>M</Text>
          </View>
          <View style={cl.info}>
            <Text style={cl.date}>{s.date}</Text>
            <Text style={cl.preview} numberOfLines={2}>{s.preview}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function AdultBubble({ msg, currentUserId }: { msg: ChatMessage; currentUserId: string }) {
  const isMe = msg.sender_id === currentUserId;
  const initial = msg.profiles?.display_name?.[0]?.toUpperCase() ?? '?';
  if (isMe) {
    return (
      <View style={ad.rowRight}>
        <View style={ad.userBubble}>
          <Text style={ad.userText}>{msg.content}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={ad.rowLeft}>
      <View style={ad.avatar}>
        <Text style={ad.avatarText}>{initial}</Text>
      </View>
      <View style={ad.aiBubble}>
        <Text style={ad.aiText}>{msg.content}</Text>
      </View>
    </View>
  );
}

function ChildBubble({ msg, currentUserId }: { msg: ChatMessage; currentUserId: string }) {
  const isMe = msg.sender_id === currentUserId;
  const initial = msg.profiles?.display_name?.[0]?.toUpperCase() ?? '?';
  return (
    <View style={[cd.row, isMe ? cd.rowRight : cd.rowLeft]}>
      {!isMe && (
        <View style={cd.avatar}>
          <Text style={cd.avatarText}>{initial}</Text>
        </View>
      )}
      <View style={[cd.bubble, isMe ? cd.bubbleUser : cd.bubbleAi]}>
        <Text style={[cd.bubbleText, isMe && cd.bubbleTextUser]}>{msg.content}</Text>
      </View>
    </View>
  );
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { childMode } = useChildMode();
  const currentUserId = session?.user?.id ?? '';

  const [unlocked, setUnlocked] = useState(false);
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const listRef = useRef<FlatList>(null);

  // Adult mode is always "unlocked" — no PIN needed
  const effectivelyUnlocked = !childMode || unlocked;

  useEffect(() => {
    if (childMode) {
      const sub = AppState.addEventListener('change', (state) => {
        if (state !== 'active') {
          setUnlocked(false);
          setFilter('');
        }
      });
      return () => sub.remove();
    }
  }, [childMode]);

  useEffect(() => {
    if (!effectivelyUnlocked || !currentUserId) return;

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
  }, [effectivelyUnlocked, currentUserId]);

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

  const ChatBody = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {loadError ? (
        <View style={sh.centerMsg}>
          <Text style={sh.errorText}>{loadError}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) =>
            childMode
              ? <ChildBubble msg={item} currentUserId={currentUserId} />
              : <AdultBubble msg={item} currentUserId={currentUserId} />
          }
          contentContainerStyle={[sh.list, { paddingBottom: insets.bottom + 90 }]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={sh.centerMsg}>
              <Text style={[sh.emptyText, { color: childMode ? M.muted : G.muted }]}>
                No messages yet. Say hi!
              </Text>
            </View>
          }
        />
      )}

      <View style={[
        sh.inputBar,
        { paddingBottom: insets.bottom + 8 },
        childMode ? sh.inputBarChild : sh.inputBarAdult,
      ]}>
        <TextInput
          style={[sh.input, childMode ? sh.inputChild : sh.inputAdult]}
          value={input}
          onChangeText={setInput}
          placeholder="Message…"
          placeholderTextColor={childMode ? M.muted : G.muted}
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
            sh.sendBtn,
            childMode ? sh.sendBtnChild : sh.sendBtnAdult,
            (!input.trim() || sending) && sh.sendBtnOff,
            pressed && { opacity: 0.8 },
          ]}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={sh.sendBtnText}>↑</Text>
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  if (childMode) {
    return (
      <View style={[sh.root, { paddingTop: insets.top, backgroundColor: M.bg }]}>
        <View style={[sh.header, sh.headerChild]}>
          <View style={sh.headerLeft}>
            <Text style={[sh.headerTitle, { color: M.text }]}>Study History</Text>
            <Text style={[sh.headerSub, { color: M.muted }]}>
              {unlocked ? 'Live chat' : 'Recent sessions'}
            </Text>
          </View>
          {unlocked && (
            <Pressable onPress={lock} style={[sh.lockBtn, sh.lockBtnChild]}>
              <Text style={[sh.lockBtnText, { color: M.muted }]}>Hide</Text>
            </Pressable>
          )}
        </View>

        {!unlocked && (
          <View style={[sh.searchBar, sh.searchBarChild]}>
            <TextInput
              style={[sh.searchInput, sh.searchInputChild]}
              value={filter}
              onChangeText={handleFilterChange}
              placeholder="Filter sessions…"
              placeholderTextColor={M.muted}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
        )}

        {unlocked ? <ChatBody /> : <ChildLockedView />}
      </View>
    );
  }

  // Adult mode — always shows real chat
  return (
    <View style={[sh.root, { paddingTop: insets.top, backgroundColor: G.bg }]}>
      <View style={[sh.header, sh.headerAdult]}>
        <Text style={[sh.headerTitle, { color: G.text }]}>Chat</Text>
      </View>
      <ChatBody />
    </View>
  );
}

// Shared structural styles
const sh = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerAdult: { backgroundColor: G.bg, borderBottomColor: G.border },
  headerChild: { backgroundColor: M.surface, borderBottomColor: M.border },
  headerLeft: { gap: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12 },
  lockBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  lockBtnChild: { backgroundColor: M.bg, borderColor: M.border },
  lockBtnText: { fontSize: 13, fontWeight: '600' },
  searchBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBarChild: { backgroundColor: M.surface, borderBottomColor: M.border },
  searchInput: { height: 38, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },
  searchInputChild: { backgroundColor: M.bg, color: M.text, borderColor: '#C8DDEF' },
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1,
  },
  inputBarAdult: { backgroundColor: G.bg, borderTopColor: G.border },
  inputBarChild: { backgroundColor: M.surface, borderTopColor: M.border },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, borderWidth: 1 },
  inputAdult: { backgroundColor: G.surface, borderRadius: 12, color: G.text, borderColor: G.border },
  inputChild: { backgroundColor: M.bg, borderRadius: 22, color: M.text, borderColor: '#C8DDEF' },
  sendBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendBtnAdult: { borderRadius: 10, backgroundColor: G.accent },
  sendBtnChild: { borderRadius: 22, backgroundColor: M.accent },
  sendBtnOff: { opacity: 0.35 },
  sendBtnText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  centerMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15 },
  errorText: { color: '#D0341B', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});

// Adult chat bubble styles
const ad = StyleSheet.create({
  rowLeft: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  rowRight: { alignItems: 'flex-end', paddingLeft: 48, marginVertical: 2 },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: G.surface, borderWidth: 1, borderColor: G.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: G.muted, fontSize: 12, fontWeight: '700' },
  aiBubble: {
    maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: G.surface, borderRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: G.border,
  },
  aiText: { fontSize: 16, lineHeight: 22, color: G.text },
  userBubble: {
    maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: G.surface, borderRadius: 18, borderBottomRightRadius: 4,
    borderWidth: 1, borderColor: G.border,
  },
  userText: { fontSize: 16, lineHeight: 22, color: G.text },
});

// Child chat bubble styles
const cd = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#7A8FA6', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleAi: {
    backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  bubbleUser: { backgroundColor: M.accent, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 16, lineHeight: 22, color: M.text },
  bubbleTextUser: { color: '#FFFFFF' },
});

// Child locked view styles
const cl = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16, paddingTop: 8, gap: 4 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: M.border,
  },
  icon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: M.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  info: { flex: 1, gap: 4 },
  date: { fontSize: 12, color: M.muted },
  preview: { fontSize: 14, color: M.text, lineHeight: 20 },
});
