import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendMessage, type Message } from '@/services/ai';
import { useChildMode } from '@/contexts/child-mode-context';

// Adult (GPT-dark) palette
const G = {
  bg: '#212121', surface: '#2f2f2f', border: '#424242',
  text: '#ececec', muted: '#8e8ea0', accent: '#10a37f',
};

// Child (Muffin) palette
const M = {
  bg: '#F0F7FF', surface: '#FFFFFF', border: '#DDE9F5',
  text: '#0D1B2A', muted: '#7A8FA6', accent: '#208AEF',
};

type DisplayMessage = Message & { id: string };

function AdultBubble({ msg }: { msg: DisplayMessage }) {
  const isUser = msg.role === 'user';
  if (isUser) {
    return (
      <View style={ga.rowRight}>
        <View style={ga.userBubble}>
          <Text style={ga.userText}>{msg.content}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={ga.rowLeft}>
      <Text style={ga.logoMark}>✦</Text>
      <Text style={ga.aiText}>{msg.content}</Text>
    </View>
  );
}

function ChildBubble({ msg }: { msg: DisplayMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[gc.row, isUser ? gc.rowRight : gc.rowLeft]}>
      {!isUser && (
        <View style={gc.avatar}>
          <Text style={gc.avatarText}>M</Text>
        </View>
      )}
      <View style={[gc.bubble, isUser ? gc.bubbleUser : gc.bubbleAi]}>
        <Text style={[gc.bubbleText, isUser && gc.bubbleTextUser]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

const ADULT_GREETING: Message = {
  role: 'assistant',
  content: "What do you need?",
};

const CHILD_GREETING: Message = {
  role: 'assistant',
  content: "Hey! I'm Muffin 👋 — your study buddy. Ask me anything: homework help, definitions, math, science, history — whatever you're working on.",
};

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { childMode, toggle } = useChildMode();

  const [adultMessages, setAdultMessages] = useState<DisplayMessage[]>([
    { ...ADULT_GREETING, id: 'greeting-adult' },
  ]);
  const [childMessages, setChildMessages] = useState<DisplayMessage[]>([
    { ...CHILD_GREETING, id: 'greeting-child' },
  ]);

  const messages = childMode ? childMessages : adultMessages;
  const setMessages = childMode ? setChildMessages : setAdultMessages;

  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList>(null);

  const getHistory = useCallback(
    (msgs: DisplayMessage[]): Message[] =>
      msgs
        .filter((m) => !m.id.startsWith('greeting'))
        .map(({ role, content }) => ({ role, content })),
    [],
  );

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');

    const userMsg: DisplayMessage = { id: String(Date.now()), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const currentMsgs = messages;
      const reply = await sendMessage(
        [...getHistory(currentMsgs), { role: 'user', content: text }],
        childMode ? 'child' : 'adult',
      );
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: 'assistant', content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: childMode ? "Hmm, I had trouble with that one. Try again?" : "Connection error. Try again.",
        },
      ]);
    } finally {
      setThinking(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, thinking, messages, childMode, getHistory, setMessages]);

  if (childMode) {
    return (
      <View style={[cs.root, { paddingTop: insets.top }]}>
        <View style={cs.header}>
          <View style={cs.dot} />
          <Text style={cs.headerTitle}>Muffin</Text>
          <Text style={cs.headerSub}>Study Assistant</Text>
          <Pressable onPress={toggle} style={cs.modeBtn}>
            <Text style={cs.modeBtnText}>Adult</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={cs.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <ChildBubble msg={item} />}
            contentContainerStyle={[gc.list, { paddingBottom: insets.bottom + 90 }]}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          {thinking && (
            <View style={[gc.row, gc.rowLeft, gc.thinkingRow]}>
              <View style={gc.avatar}>
                <Text style={gc.avatarText}>M</Text>
              </View>
              <View style={[gc.bubble, gc.bubbleAi]}>
                <ActivityIndicator size="small" color={M.muted} />
              </View>
            </View>
          )}

          <View style={[cs.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={cs.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything…"
              placeholderTextColor={M.muted}
              multiline
              maxLength={2000}
              returnKeyType="send"
              onSubmitEditing={submit}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={submit}
              disabled={!input.trim() || thinking}
              style={({ pressed }) => [
                cs.sendBtn,
                (!input.trim() || thinking) && cs.sendBtnOff,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={cs.sendBtnText}>↑</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Adult mode
  return (
    <View style={[as.root, { paddingTop: insets.top }]}>
      <View style={as.header}>
        <Text style={as.headerTitle}>AskAI</Text>
        <Pressable onPress={toggle} style={as.modeBtn}>
          <Text style={as.modeBtnText}>Kids</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={as.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <AdultBubble msg={item} />}
          contentContainerStyle={[ga.list, { paddingBottom: insets.bottom + 90 }]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {thinking && (
          <View style={ga.rowLeft}>
            <Text style={ga.logoMark}>✦</Text>
            <ActivityIndicator size="small" color={G.accent} style={{ marginTop: 4 }} />
          </View>
        )}

        <View style={[as.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={as.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message AskAI…"
            placeholderTextColor={G.muted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={submit}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={submit}
            disabled={!input.trim() || thinking}
            style={({ pressed }) => [
              as.sendBtn,
              (!input.trim() || thinking) && as.sendBtnOff,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={as.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Adult styles
const as = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: G.bg,
    borderBottomWidth: 1, borderBottomColor: G.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: G.text },
  modeBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6,
    backgroundColor: G.surface, borderWidth: 1, borderColor: G.border,
  },
  modeBtnText: { fontSize: 13, color: G.muted, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: G.bg,
    borderTopWidth: 1, borderTopColor: G.border,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: G.surface, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 16, color: G.text,
    borderWidth: 1, borderColor: G.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: G.accent, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: G.surface },
  sendBtnText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
});

// Adult message styles
const ga = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingRight: 40 },
  rowRight: { alignItems: 'flex-end', paddingLeft: 40 },
  logoMark: { fontSize: 14, color: G.accent, marginTop: 2, flexShrink: 0 },
  aiText: { flex: 1, fontSize: 16, lineHeight: 24, color: G.text },
  userBubble: {
    backgroundColor: G.surface, borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: G.border,
  },
  userText: { fontSize: 16, lineHeight: 22, color: G.text },
});

// Child styles
const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: M.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: M.surface,
    borderBottomWidth: 1, borderBottomColor: M.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: M.accent },
  headerTitle: { fontSize: 17, fontWeight: '700', color: M.text, flex: 1 },
  headerSub: { fontSize: 13, color: M.muted },
  modeBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6,
    backgroundColor: M.bg, borderWidth: 1, borderColor: M.border,
  },
  modeBtnText: { fontSize: 13, color: M.muted, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: M.surface,
    borderTopWidth: 1, borderTopColor: M.border,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: M.bg, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 16, color: M.text,
    borderWidth: 1, borderColor: '#C8DDEF',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: M.accent, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#C8DDEF' },
  sendBtnText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
});

// Child message styles
const gc = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  thinkingRow: { paddingHorizontal: 16, marginBottom: 8 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: M.accent, alignItems: 'center', justifyContent: 'center',
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
