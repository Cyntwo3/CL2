import { useCallback, useRef, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendMessage, type Message } from "@/src/services/ai";

const SYSTEM_COLOR = "#208AEF";
const BG = "#F0F7FF";
const BUBBLE_AI = "#FFFFFF";
const BUBBLE_USER = "#208AEF";
const TEXT_PRIMARY = "#0D1B2A";
const TEXT_MUTED = "#7A8FA6";

const GREETING: Message = {
  role: "assistant",
  content:
    "Hey! I'm Muffin 👋 — your study buddy. Ask me anything: homework help, definitions, math, science, history — whatever you're working on.",
};

type DisplayMessage = Message & { id: string };

function Bubble({ msg }: { msg: DisplayMessage }) {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAi,
        ]}
      >
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { ...GREETING, id: "greeting" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList>(null);

  const history = useCallback((): Message[] => {
    return messages
      .filter((m) => m.id !== "greeting")
      .map(({ role, content }) => ({ role, content }));
  }, [messages]);

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");

    const userMsg: DisplayMessage = {
      id: String(Date.now()),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const reply = await sendMessage([
        ...history(),
        { role: "user", content: text },
      ]);
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          content: "Hmm, I had trouble with that one. Try again?",
        },
      ]);
    } finally {
      setThinking(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, thinking, history]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDot} />
        <Text style={styles.headerTitle}>Muffin</Text>
        <Text style={styles.headerSub}>Study Assistant</Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Bubble msg={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 80 },
          ]}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />

        {thinking && (
          <View style={styles.thinkingRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>M</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleAi, styles.thinkingBubble]}>
              <ActivityIndicator size="small" color={TEXT_MUTED} />
            </View>
          </View>
        )}

        {/* Input bar */}
        <View
          style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything…"
            placeholderTextColor={TEXT_MUTED}
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
              styles.sendBtn,
              (!input.trim() || thinking) && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
            ]}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DDE9F5",
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SYSTEM_COLOR,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  headerSub: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginLeft: 2,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },

  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginVertical: 2,
  },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SYSTEM_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleAi: {
    backgroundColor: BUBBLE_AI,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: BUBBLE_USER,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 16, lineHeight: 22, color: TEXT_PRIMARY },
  bubbleTextUser: { color: "#FFFFFF" },

  thinkingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  thinkingBubble: { paddingVertical: 12, paddingHorizontal: 16 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DDE9F5",
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
    color: TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: "#C8DDEF",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SYSTEM_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#C8DDEF" },
  sendBtnPressed: { opacity: 0.8 },
  sendBtnText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
});
