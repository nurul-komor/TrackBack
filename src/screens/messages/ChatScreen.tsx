import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, IconButton, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { subscribeToMessages, sendMessage } from '../../services/chat.service';
import { sendPushNotification } from '../../services/notifications.service';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import { COLORS } from '../../theme/theme';

const timeAgo = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { conversationId, otherUserId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [conversationId]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(conversationId, user.uid, msgText);
      // notify the other user
      try {
        const snap = await getDoc(doc(db, 'users', otherUserId));
        const fcmToken = snap.data()?.fcmToken;
        if (fcmToken) {
          await sendPushNotification(fcmToken, 'New Message', msgText, { conversationId });
        }
      } catch {
        // notification failure is non-fatal
      }
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampThem]}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={COLORS.primary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          mode="outlined"
          placeholder="Type a message..."
          value={text}
          onChangeText={setText}
          dense
          multiline
          maxLength={500}
          outlineColor={COLORS.primary}
          activeOutlineColor={COLORS.primary}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size={18} color="#fff" />
          ) : (
            <IconButton icon="send" iconColor="#fff" size={18} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, elevation: 2, paddingRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.primary },
  messageList: { padding: 12, paddingBottom: 8 },
  msgRow: { marginBottom: 10 },
  msgRowMe: { alignItems: 'flex-end' },
  msgRowThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E0E0E0' },
  msgText: { fontSize: 15 },
  msgTextMe: { color: '#fff' },
  msgTextThem: { color: COLORS.textPrimary },
  timestamp: { fontSize: 10, marginTop: 2, color: COLORS.textSecondary },
  timestampMe: { marginRight: 4 },
  timestampThem: { marginLeft: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: { flex: 1, marginRight: 8, backgroundColor: COLORS.surface, maxHeight: 100 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
});
