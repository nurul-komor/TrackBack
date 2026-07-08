import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity, TextInput, ActivityIndicator, Text,
  Animated, Image, Alert, ActionSheetIOS, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import { db } from '../../config/firebase';
import { subscribeToMessages, sendMessage } from '../../services/chat.service';
import { sendPushNotification } from '../../services/notifications.service';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import { COLORS } from '../../theme/theme';

// ─── Cloudinary upload ────────────────────────────────────────────────────────
const CLOUD_NAME    = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const uploadChatImage = async (localUri: string, conversationId: string): Promise<string> => {
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1080 } }],
    { compress: 0.8, format: SaveFormat.JPEG },
  );
  const fd = new FormData();
  fd.append('file', { uri: compressed.uri, type: 'image/jpeg', name: `chat_${Date.now()}.jpg` } as any);
  fd.append('upload_preset', UPLOAD_PRESET!);
  fd.append('folder', `trackback/chats/${conversationId}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url as string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'];
const avatarColor = (id: string) => AVATAR_COLORS[(id.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const formatTime = (ts: any): string => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// ─── Animated bubble wrapper ──────────────────────────────────────────────────
const AnimatedBubble = ({ children, isMe }: { children: React.ReactNode; isMe: boolean }) => {
  const translateY = useRef(new Animated.Value(6)).current;
  const translateX = useRef(new Animated.Value(isMe ? 10 : -10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 280 }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 280 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY }, { translateX }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { conversationId, otherUserId } = route.params;
  const { user }   = useAuth();
  const insets     = useSafeAreaInsets();

  const [messages, setMessages]         = useState<Message[]>([]);
  const [text, setText]                 = useState('');
  const [sending, setSending]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [otherUserName, setOtherUserName] = useState('');
  const [otherPhotoURL, setOtherPhotoURL] = useState('');
  const [otherFcmToken, setOtherFcmToken] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const sendScale   = useRef(new Animated.Value(1)).current;
  const attachScale = useRef(new Animated.Value(1)).current;
  const inputText   = useRef('');

  // Fetch other user profile
  useEffect(() => {
    if (!otherUserId) return;
    getDoc(doc(db, 'users', otherUserId)).then((snap) => {
      if (snap.exists()) {
        setOtherUserName(snap.data().displayName || '');
        setOtherPhotoURL(snap.data().photoURL || '');
        setOtherFcmToken(snap.data().fcmToken || '');
      }
    });
  }, [otherUserId]);

  // Real-time messages
  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });
    return unsub;
  }, [conversationId]);

  const springBtn = (val: Animated.Value) =>
    Animated.sequence([
      Animated.spring(val, { toValue: 0.8, useNativeDriver: true, damping: 8, stiffness: 400 }),
      Animated.spring(val, { toValue: 1,   useNativeDriver: true, damping: 10, stiffness: 300 }),
    ]).start();

  const handleSend = async () => {
    const msgText = inputText.current.trim();
    if (!msgText || !user) return;
    inputText.current = '';
    setText('');
    springBtn(sendScale);
    setSending(true);
    try {
      await sendMessage(conversationId, user.uid, msgText);
      if (otherFcmToken) {
        sendPushNotification(otherFcmToken, otherUserName || 'New message', msgText, { conversationId }).catch(() => {});
      }
    } finally {
      setSending(false);
    }
  };

  const pickAndUpload = async (fromCamera: boolean) => {
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permission denied', 'Camera access required.');
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.9 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.9,
        });
      }
      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      const imageUrl = await uploadChatImage(result.assets[0].uri, conversationId);
      await sendMessage(conversationId, user!.uid, '', imageUrl);
      if (otherFcmToken) {
        sendPushNotification(otherFcmToken, otherUserName || 'New message', '📷 Photo', { conversationId }).catch(() => {});
      }
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAttach = () => {
    springBtn(attachScale);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) pickAndUpload(true); if (idx === 2) pickAndUpload(false); },
      );
    } else {
      Alert.alert('Add Photo', '', [
        { text: 'Camera',  onPress: () => pickAndUpload(true) },
        { text: 'Gallery', onPress: () => pickAndUpload(false) },
        { text: 'Cancel',  style: 'cancel' },
      ]);
    }
  };

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe          = item.senderId === user?.uid;
    const prevMsg       = messages[index - 1];
    const nextMsg       = messages[index + 1];
    const samePrev      = prevMsg?.senderId === item.senderId;
    const sameNext      = nextMsg?.senderId === item.senderId;
    const showAvatar    = !isMe && !sameNext;
    const showTimestamp = !sameNext;
    const showName      = !isMe && !samePrev && !!otherUserName;

    return (
      <AnimatedBubble isMe={isMe}>
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>

          {/* Avatar slot — keeps layout stable */}
          {!isMe && (
            <View style={styles.avatarSlot}>
              {showAvatar && (
                otherPhotoURL ? (
                  <Image source={{ uri: otherPhotoURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: avatarColor(otherUserId) }]}>
                    <Text style={styles.avatarText}>
                      {(otherUserName || otherUserId || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          <View style={[styles.bubbleCol, isMe ? styles.bubbleColMe : styles.bubbleColThem]}>
            {showName && <Text style={styles.senderName}>{otherUserName}</Text>}

            {item.imageUrl ? (
              /* ── Image message ── */
              <TouchableOpacity activeOpacity={0.9}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={[
                    styles.chatImage,
                    isMe ? styles.bubbleMeRadius : styles.bubbleThemRadius,
                    samePrev && (isMe ? styles.groupedMeRadius : styles.groupedThemRadius),
                  ]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              /* ── Text message ── */
              <View style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleThem,
                samePrev && (isMe ? styles.groupedMeRadius : styles.groupedThemRadius),
              ]}>
                <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
                  {item.text}
                </Text>
              </View>
            )}

            {showTimestamp && (
              <Text style={[styles.timestamp, isMe ? styles.tsMe : styles.tsThem]}>
                {formatTime(item.createdAt)}
              </Text>
            )}
          </View>
        </View>
      </AnimatedBubble>
    );
  }, [messages, user, otherUserId, otherUserName, otherPhotoURL]);

  const headerTitle   = otherUserName || (otherUserId ? `User ${otherUserId.slice(0, 6)}` : 'Chat');
  const headerInitial = (otherUserName || otherUserId || 'U')[0].toUpperCase();
  const canSend       = text.trim().length > 0 && !sending;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <BlurView intensity={60} tint="light" style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {otherPhotoURL ? (
            <Image source={{ uri: otherPhotoURL }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, { backgroundColor: avatarColor(otherUserId || '') }]}>
              <Text style={styles.headerAvatarText}>{headerInitial}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
            <Text style={styles.headerSub}>Active now</Text>
          </View>
        </View>

        <View style={styles.headerSpacer} />
      </BlurView>

      {/* ── Message list + input in a KAV so input stays above keyboard ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Say hello!</Text>
            </View>
          }
        />

        {/* ── Input bar ── */}
        <BlurView intensity={80} tint="light" style={styles.inputBar}>
          {/* Controls row — fixed height, not affected by insets */}
          <View style={styles.inputRow}>
            <Animated.View style={{ transform: [{ scale: attachScale }] }}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handleAttach}
                disabled={uploading}
                activeOpacity={0.75}
              >
                {uploading
                  ? <ActivityIndicator size={20} color={COLORS.primary} />
                  : <MaterialCommunityIcons name="paperclip" size={22} color={COLORS.primary} />
                }
              </TouchableOpacity>
            </Animated.View>

            <TextInput
              style={styles.input}
              placeholder="Message…"
              placeholderTextColor={COLORS.textSecondary}
              value={text}
              onChangeText={(val) => { inputText.current = val; setText(val); }}
              multiline
              maxLength={500}
              returnKeyType="default"
            />

            <Animated.View style={{ transform: [{ scale: sendScale }] }}>
              <TouchableOpacity
                style={[styles.sendBtn, !canSend && styles.sendBtnOff]}
                onPress={handleSend}
                disabled={!canSend}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator size={16} color="#FFFFFF" />
                  : <MaterialCommunityIcons name="arrow-up" size={20} color="#FFFFFF" />
                }
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Safe-area spacer — separate from the input controls so it doesn't
              fight the KAV animation when insets.bottom changes on keyboard show/hide */}
          <View style={{ height: insets.bottom }} />
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
// Defined here — right before StyleSheet.create — so Hermes sees the runtime
// value before it's referenced inside the style object.
const BUBBLE_MAX_W = Dimensions.get('window').width * 0.72;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(242,242,247,0.92)',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, maxWidth: 160 },
  headerSub: { fontSize: 11, color: COLORS.accent, fontWeight: '500', marginTop: 1 },
  headerSpacer: { width: 44 },

  // Messages
  msgList: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },

  avatarSlot: { width: 32, marginRight: 6, alignItems: 'center', justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  bubbleCol: {},
  bubbleColMe: { alignItems: 'flex-end' },
  bubbleColThem: { alignItems: 'flex-start' },

  senderName: {
    fontSize: 11, fontWeight: '600', color: COLORS.textSecondary,
    marginBottom: 3, marginLeft: 4,
  },

  bubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxWidth: BUBBLE_MAX_W },

  bubbleMe: { backgroundColor: '#007AFF', borderBottomRightRadius: 5 },
  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },

  // Border-radius shortcuts for grouping
  bubbleMeRadius:   { borderBottomRightRadius: 5 },
  bubbleThemRadius: { borderBottomLeftRadius: 5 },
  groupedMeRadius:  { borderTopRightRadius: 5 },
  groupedThemRadius:{ borderTopLeftRadius: 5 },

  msgText: { fontSize: 15, lineHeight: 21 },
  msgTextMe: { color: '#FFFFFF' },
  msgTextThem: { color: COLORS.textPrimary },

  // Image message
  chatImage: {
    width: Math.min(220, BUBBLE_MAX_W),
    height: 180,
    borderRadius: 20,
    backgroundColor: COLORS.inputBackground,
  },

  timestamp: { fontSize: 10, color: COLORS.textSecondary, marginTop: 3, marginBottom: 10 },
  tsMe: { textAlign: 'right', marginRight: 2 },
  tsThem: { textAlign: 'left', marginLeft: 4 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '500' },

  // Input bar
  inputBar: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(242,242,247,0.95)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },
  attachBtn: {
    width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    maxHeight: 120,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 1,
  },
  sendBtnOff: { backgroundColor: COLORS.separator },
});
