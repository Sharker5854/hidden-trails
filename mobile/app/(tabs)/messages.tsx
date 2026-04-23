import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppColors, Shadow } from '@/constants/app-theme';
import { getConversationMessagesRequest, sendMessageRequest } from '@/lib/api';
import { chatMessages, ChatMessage } from '@/lib/mock-data';
import { normalizeMessages } from '@/lib/normalizers';
import { useAppState } from '../../context/app-state';

export default function MessagesScreen() {
  const { conversations, token, error } = useAppState();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(
    conversations[0]?.id || null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const activeConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ||
    conversations[0];

  useEffect(() => {
    setSelectedConversationId((currentId) => currentId || conversations[0]?.id || null);
  }, [conversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    if (!token) {
      setMessages(chatMessages.filter((message) => message.conversationId === selectedConversationId));
      return;
    }

    getConversationMessagesRequest(token, selectedConversationId)
      .then((data) => setMessages(normalizeMessages(data?.messages)))
      .catch(() => setMessages([]));
  }, [selectedConversationId, token]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!token || !activeConversation?.partnerId || !text) return;

    const data = await sendMessageRequest(token, activeConversation.partnerId, text);
    const sentMessage = data?.message ? normalizeMessages([data.message])[0] : null;
    if (sentMessage) {
      setMessages((currentMessages) => [...currentMessages, sentMessage]);
    }
    setMessageText('');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Сообщения</Text>
        <Text style={styles.subtitle}>Диалоги загружаются из backend, без зашитой переписки.</Text>
      </View>

      {!token ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Нужно войти</Text>
          <Text style={styles.warningText}>После входа здесь появятся реальные диалоги.</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.conversationList}>
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <Pressable
              key={conversation.id}
              style={[
                styles.conversation,
                conversation.id === selectedConversationId && styles.conversationActive,
              ]}
              onPress={() => setSelectedConversationId(conversation.id)}>
              <Image source={{ uri: conversation.avatar }} style={styles.avatar} />
              <View style={styles.conversationBody}>
                <Text style={styles.nickname}>@{conversation.nickname}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
              </View>
              {conversation.unread > 0 ? (
                <Text style={styles.unread}>{conversation.unread}</Text>
              ) : null}
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>Диалогов пока нет.</Text>
        )}
      </View>

      {activeConversation ? (
        <View style={styles.thread}>
          <Text style={styles.threadTitle}>@{activeConversation.nickname}</Text>
          {messages.length > 0 ? (
            messages.map((message) => (
              <View key={message.id} style={[styles.bubble, message.isMine && styles.bubbleMine]}>
                <Text style={[styles.bubbleText, message.isMine && styles.bubbleTextMine]}>
                  {message.text}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Сообщений пока нет.</Text>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Сообщение"
              placeholderTextColor={AppColors.textMuted}
            />
            <Pressable style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendButtonText}>Отпр.</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    gap: 18,
    padding: 18,
    paddingTop: 58,
  },
  header: {
    gap: 8,
  },
  title: {
    color: AppColors.text,
    fontSize: 31,
    fontWeight: '900',
  },
  subtitle: {
    color: AppColors.textMuted,
    fontSize: 16,
  },
  warningBox: {
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1c27d',
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    padding: 14,
  },
  warningTitle: {
    color: AppColors.accent,
    fontSize: 17,
    fontWeight: '900',
  },
  warningText: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
  errorText: {
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    color: AppColors.danger,
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  conversationList: {
    gap: 10,
  },
  conversation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 12,
    ...Shadow,
  },
  conversationActive: {
    borderColor: AppColors.primary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  conversationBody: {
    flex: 1,
    gap: 3,
  },
  nickname: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  lastMessage: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
  unread: {
    width: 24,
    height: 24,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'center',
  },
  thread: {
    gap: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 14,
    ...Shadow,
  },
  threadTitle: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
    padding: 11,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: AppColors.primary,
  },
  bubbleText: {
    color: AppColors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#ffffff',
  },
  emptyText: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    color: AppColors.text,
    paddingHorizontal: 12,
  },
  sendButton: {
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
});
