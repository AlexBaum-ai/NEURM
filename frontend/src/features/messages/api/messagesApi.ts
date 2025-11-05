import { apiClient } from '@/lib/api';
import type {
  ConversationsResponse,
  MessagesResponse,
  SendMessagePayload,
  UnreadCountResponse,
  BlockUserResponse,
  Message,
  Conversation,
} from '../types';

export const messagesApi = {
  /**
   * Get all conversations for the current user
   */
  getConversations: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ConversationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get<ConversationsResponse>(
      `/conversations${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get messages for a specific conversation
   */
  getMessages: async (
    conversationId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<MessagesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get<MessagesResponse>(
      `/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Send a new message
   */
  sendMessage: async (payload: SendMessagePayload): Promise<Message> => {
    // If there are attachments, use FormData
    if (payload.attachments && payload.attachments.length > 0) {
      const formData = new FormData();
      formData.append('content', payload.content);

      if (payload.recipientId) {
        formData.append('recipientId', payload.recipientId);
      }
      if (payload.conversationId) {
        formData.append('conversationId', payload.conversationId);
      }

      payload.attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      return apiClient.post<Message>('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    // Otherwise, send as JSON
    return apiClient.post<Message>('/messages', {
      recipientId: payload.recipientId,
      conversationId: payload.conversationId,
      content: payload.content,
    });
  },

  /**
   * Mark message as read
   */
  markAsRead: async (messageId: string): Promise<{ success: boolean }> => {
    return apiClient.put<{ success: boolean }>(`/messages/${messageId}/read`);
  },

  /**
   * Mark all messages in a conversation as read
   */
  markConversationAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const messages = await apiClient.get<MessagesResponse>(
      `/conversations/${conversationId}/messages?limit=100`
    );

    // Mark all unread messages as read
    const unreadMessages = messages.messages.filter(msg => !msg.readAt);
    await Promise.all(
      unreadMessages.map(msg => apiClient.put(`/messages/${msg.id}/read`))
    );

    return { success: true };
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/conversations/${conversationId}`);
  },

  /**
   * Block a user
   */
  blockUser: async (userId: string): Promise<BlockUserResponse> => {
    return apiClient.post<BlockUserResponse>(`/users/${userId}/block`);
  },

  /**
   * Unblock a user
   */
  unblockUser: async (userId: string): Promise<BlockUserResponse> => {
    return apiClient.delete<BlockUserResponse>(`/users/${userId}/block`);
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    return apiClient.get<UnreadCountResponse>('/messages/unread-count');
  },

  /**
   * Get or create conversation with a user
   */
  getOrCreateConversation: async (userId: string): Promise<Conversation> => {
    // Try to find existing conversation
    const conversations = await apiClient.get<ConversationsResponse>('/conversations');
    const existingConversation = conversations.conversations.find(
      (conv) =>
        conv.participant1Id === userId || conv.participant2Id === userId
    );

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation by sending first message
    const message = await apiClient.post<Message>('/messages', {
      recipientId: userId,
      content: '',
    });

    // Fetch the conversation
    const updatedConversations = await apiClient.get<ConversationsResponse>('/conversations');
    const newConversation = updatedConversations.conversations.find(
      (conv) => conv.id === message.conversationId
    );

    if (!newConversation) {
      throw new Error('Failed to create conversation');
    }

    return newConversation;
  },
};
