import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messagesApi';
import type { SendMessagePayload, Message, MessagesResponse } from '../types';

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => messagesApi.sendMessage(payload),
    onSuccess: (newMessage: Message) => {
      // Update messages cache
      queryClient.setQueryData(
        ['messages', newMessage.conversationId],
        (old: any) => {
          if (!old) return old;

          // Add new message to the first page
          const updatedPages = [...old.pages];
          if (updatedPages.length > 0) {
            updatedPages[0] = {
              ...updatedPages[0],
              messages: [newMessage, ...updatedPages[0].messages],
            };
          }

          return {
            ...old,
            pages: updatedPages,
          };
        }
      );

      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
