export interface User {
  id: string;
  username: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  participant1?: User;
  participant2?: User;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface SendMessagePayload {
  recipientId?: string;
  conversationId?: string;
  content: string;
  attachments?: File[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface BlockUserResponse {
  success: boolean;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  timestamp: number;
}
