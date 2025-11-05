import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ConversationList, ChatView } from '../components';
import { useConversations, useDeleteConversation, useBlockUser } from '../hooks';
import { cn } from '@/lib/utils';

const MessagesPage: React.FC = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [isMobileView, setIsMobileView] = React.useState(false);

  const { data: conversationsData } = useConversations();
  const deleteConversationMutation = useDeleteConversation();
  const blockUserMutation = useBlockUser();

  // Find selected conversation
  const selectedConversation = conversationsData?.conversations.find(
    (conv) => conv.id === conversationId
  );

  // Responsive handling
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDeleteConversation = async () => {
    if (!conversationId) return;

    try {
      await deleteConversationMutation.mutateAsync(conversationId);
      navigate('/messages');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation) return;

    const otherParticipantId =
      selectedConversation.participant1Id !== selectedConversation.participant2Id
        ? selectedConversation.participant1Id
        : selectedConversation.participant2Id;

    try {
      await blockUserMutation.mutateAsync(otherParticipantId);
      navigate('/messages');
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  // Mobile: Show list or chat based on selection
  if (isMobileView) {
    return (
      <>
        <Helmet>
          <title>Messages | nEURM</title>
        </Helmet>

        <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
          {conversationId && selectedConversation ? (
            // Show chat view
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => navigate('/messages')}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Messages
                </h1>
              </div>
              <ChatView
                conversation={selectedConversation}
                onDeleteConversation={handleDeleteConversation}
                onBlockUser={handleBlockUser}
              />
            </>
          ) : (
            // Show conversation list
            <>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Messages
                </h1>
              </div>
              <ConversationList className="flex-1" />
            </>
          )}
        </div>
      </>
    );
  }

  // Desktop: Split view
  return (
    <>
      <Helmet>
        <title>Messages | nEURM</title>
      </Helmet>

      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List - Left Sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <ConversationList className="flex-1" />
          </div>

          {/* Chat View - Main Content */}
          <div className="flex-1 flex flex-col">
            {conversationId && selectedConversation ? (
              <ChatView
                conversation={selectedConversation}
                onDeleteConversation={handleDeleteConversation}
                onBlockUser={handleBlockUser}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageCircle className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Choose a conversation from the list to start messaging, or visit a user's
                  profile to start a new conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MessagesPage;
