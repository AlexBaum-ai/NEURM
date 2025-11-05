import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { TopicComposer } from '../components';
import { useCategories } from '../hooks';
import { forumApi } from '../api/forumApi';
import { useAuthStore } from '@/store/authStore';

interface TopicFormData {
  title: string;
  content: string;
  categoryId: string;
  type: 'discussion' | 'question' | 'showcase' | 'tutorial' | 'announcement' | 'paper';
  tags: string[];
  images: Array<{ file: File; preview: string }>;
  poll?: {
    question: string;
    options: Array<{ text: string; votes: number }>;
    multipleChoice: boolean;
    expiresAt?: string;
  } | null;
}

const NewTopicPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async ({ data, isDraft }: { data: TopicFormData; isDraft: boolean }) => {
      // TODO: Upload images to media service first
      // For now, we'll skip image upload and just send the topic data
      const topicData = {
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        type: data.type,
        isDraft,
        tags: data.tags,
        // attachments: [], // Will be populated after image upload
        poll: data.poll
          ? {
              question: data.poll.question,
              allowMultiple: data.poll.multipleChoice,
              endsAt: data.poll.expiresAt || null,
              options: data.poll.options.map((opt) => opt.text),
            }
          : undefined,
      };

      const response = await forumApi.createTopic(topicData);
      return response;
    },
    onSuccess: (data, variables) => {
      if (variables.isDraft) {
        // Navigate to drafts page or show success message
        navigate('/forum/drafts');
      } else {
        // Navigate to the new topic
        navigate(`/forum/topics/${data.slug}`);
      }
    },
    onError: (error: any) => {
      console.error('Failed to create topic:', error);
      // Error will be shown by the form
    },
  });

  const handleSubmit = async (data: TopicFormData, isDraft: boolean) => {
    await createTopicMutation.mutateAsync({ data, isDraft });
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/auth/login?redirect=/forum/new');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Please login to create a topic</p>
      </div>
    );
  }

  if (categoriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create New Topic - Neurmatic Forum</title>
        <meta name="description" content="Create a new forum topic to discuss LLMs and AI" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
        <div className="container mx-auto max-w-4xl px-4">
          <TopicComposer
            categories={categoriesData?.categories || []}
            onSubmit={handleSubmit}
            isSubmitting={createTopicMutation.isPending}
          />
        </div>
      </div>
    </>
  );
};

export default NewTopicPage;
