import { PrismaClient, TopicType, TopicStatus } from '@prisma/client';

/**
 * Seed Forum Content
 *
 * Creates 8 sample forum topics with replies to showcase the forum
 */

interface TopicSeedData {
  title: string;
  slug: string;
  content: string;
  topicType: TopicType;
  categorySlug: string;
  tags: string[];
  replies: Array<{
    content: string;
    authorUsername: string;
  }>;
}

const forumTopics: TopicSeedData[] = [
  {
    title: 'What are your favorite prompting techniques for GPT-4?',
    slug: 'favorite-prompting-techniques-gpt-4',
    content: `I've been experimenting with GPT-4 for the past few months and I'm curious what prompting techniques the community has found most effective.

## My current favorites:

1. **Chain-of-thought with examples**: Providing 2-3 examples of the reasoning process before asking the actual question
2. **Role-based prompting**: "You are an expert Python developer..." seems to significantly improve code quality
3. **Structured output requests**: Asking for JSON or specific formats with clear schemas

What techniques have you found most useful? Any hidden gems?`,
    topicType: 'discussion',
    categorySlug: 'prompt-engineering',
    tags: ['gpt-4', 'prompting', 'techniques', 'best-practices'],
    replies: [
      {
        content: `Great question! I've had excellent results with **self-consistency sampling**. Instead of generating one response, I generate 3-5 responses with temperature=0.7 and then have GPT-4 evaluate which answer is best. It's slower but significantly more accurate for complex reasoning tasks.`,
        authorUsername: 'emily_ai',
      },
      {
        content: `One technique I swear by: **meta-prompting**. I first ask GPT-4 to help me write the perfect prompt for my task. The model is surprisingly good at improving your prompts!

Example:
"I want to extract entities from customer reviews. Help me write the perfect prompt for this task, including few-shot examples."`,
        authorUsername: 'johndeveloper',
      },
      {
        content: `I've found **constraint-based prompting** super helpful. Being very explicit about what you DON'T want often works better than just saying what you do want.

For example: "Generate a product description. Do NOT use marketing clichés, do NOT exceed 100 words, do NOT use exclamation marks."`,
        authorUsername: 'lisa founder',
      },
      {
        content: `+1 for role-based prompting! But I take it further with **persona cards**. I create detailed persona descriptions that I reuse:

\`\`\`
You are Dr. Sarah Chen, a senior data scientist with 15 years of experience in ML.
Your communication style: precise, data-driven, avoids jargon when possible.
Your approach: always validate assumptions before drawing conclusions.
\`\`\``,
        authorUsername: 'marcus_ml',
      },
    ],
  },
  {
    title: 'How to choose between GPT-4 and Claude 3.5 Sonnet for production?',
    slug: 'choosing-gpt-4-vs-claude-35-sonnet',
    content: `I'm building a production application and trying to decide between GPT-4 and Claude 3.5 Sonnet. I've tested both and they're both excellent, but I need to commit to one for consistency.

## My use case:
- Code generation and review (Python, TypeScript)
- Technical documentation writing
- Processing user queries with context from our docs
- ~1M tokens/month initially

## My observations so far:
- **Claude**: Better code quality, 70% cheaper, faster responses
- **GPT-4**: Better at creative problem-solving, more familiar to users

Has anyone made this choice for a production system? What factors tipped the scale for you?`,
    topicType: 'question',
    categorySlug: 'development',
    tags: ['gpt-4', 'claude', 'production', 'decision'],
    replies: [
      {
        content: `We went with Claude 3.5 Sonnet for our production code review tool and haven't regretted it. The cost savings alone paid for itself. We're processing about 5M tokens/month and Claude saves us ~$7,000/month compared to GPT-4.

The code quality is genuinely better for our use case (Python/FastAPI). Claude also handles our long context better - we feed it entire files and it maintains context throughout.

One caveat: GPT-4's ecosystem is more mature. More tools, more examples, more Stack Overflow answers.`,
        authorUsername: 'thomas_oss',
      },
      {
        content: `**My recommendation: Use both strategically**

We use Claude for:
- Code generation (better output, cheaper)
- Long document processing (200K context)

We use GPT-4 for:
- Creative tasks (naming, marketing copy)
- When we need vision capabilities
- Tasks where we leverage function calling heavily

Total cost is still lower than using GPT-4 for everything, and we get better results.`,
        authorUsername: 'maya_enterprise',
      },
      {
        content: `One thing to consider: **vendor lock-in**. Build your application with an abstraction layer so you can swap models easily. We use LangChain's model abstraction which made it trivial to A/B test both models in production.

After 2 weeks of A/B testing with real users, we went with Claude. But having that flexibility was crucial.`,
        authorUsername: 'anna_llm',
      },
    ],
  },
  {
    title: '[Tutorial] Building a production-ready RAG system from scratch',
    slug: 'tutorial-production-rag-system',
    content: `I've built several RAG systems over the past year and wanted to share a comprehensive guide. This is what I wish I knew when starting.

## Architecture Overview

\`\`\`
Documents → Chunking → Embeddings → Vector DB → Retrieval → LLM → Response
\`\`\`

## 1. Document Chunking Strategy

**Don't use fixed-size chunks!** Use semantic chunking instead:

\`\`\`python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\\n\\n", "\\n", ". ", " ", ""]
)
\`\`\`

## 2. Embedding Selection

We tested 5 embedding models:
- **OpenAI ada-002**: Best quality, $0.0001/1K tokens
- **Cohere embed-v3**: Great for multilingual
- **Sentence-transformers**: Free, decent quality

Winner for us: **OpenAI ada-002** (quality matters more than cost for embeddings)

## 3. Vector Database

Tried Pinecone, Weaviate, and Qdrant:
- **Pinecone**: Easiest to use, great for prototypes
- **Weaviate**: Best features, self-hostable
- **Qdrant**: Best performance, great for large scale

We went with **Weaviate** for production.

## 4. Retrieval Optimization

**Hybrid search** was game-changing:

\`\`\`python
results = vector_db.search(
    query=query,
    hybrid_search=True,
    alpha=0.7,  # 70% vector, 30% keyword
    limit=5
)
\`\`\`

## 5. Reranking

Use Cohere's reranker to improve results:

\`\`\`python
from cohere import Client
co = Client(api_key)

reranked = co.rerank(
    query=query,
    documents=initial_results,
    top_n=3,
    model="rerank-english-v2.0"
)
\`\`\`

Reranking improved our accuracy by 25%!

## 6. Prompt Engineering for RAG

\`\`\`python
prompt = f"""Answer the question based on the context below. If the answer is not in the context, say "I don't have enough information to answer this."

Context:
{retrieved_docs}

Question: {user_question}

Answer:"""
\`\`\`

## 7. Monitoring

Track these metrics:
- Retrieval accuracy (manual eval on 100 test cases)
- Response latency
- User satisfaction (thumbs up/down)
- Failed queries (couldn't find answer)

## Results

Before optimization:
- Accuracy: 62%
- Avg latency: 3.2s

After optimization:
- Accuracy: 89%
- Avg latency: 1.8s

Happy to answer questions!`,
    topicType: 'tutorial',
    categorySlug: 'rag-vector-dbs',
    tags: ['rag', 'tutorial', 'production', 'architecture'],
    replies: [
      {
        content: `This is gold! 🏆 Quick question: how do you handle document updates? Do you reindex everything or have an incremental update strategy?`,
        authorUsername: 'raj_learning',
      },
      {
        content: `Great tutorial! One addition: we found that adding metadata filtering dramatically improved results.

Example: If a user asks about pricing, we filter to only documents tagged with \`category: pricing\` before doing vector search.

This reduced our retrieval set from thousands to hundreds, improving both accuracy and speed.`,
        authorUsername: 'marcus_ml',
      },
      {
        content: `For anyone implementing this: don't forget about **query expansion**! We use the LLM to generate 2-3 variations of the user's question and retrieve for all of them. Helps with edge cases where the user's phrasing doesn't match the documents.

\`\`\`python
variations = llm.generate_query_variations(user_question, n=3)
all_results = []
for variation in variations:
    results = vector_db.search(variation)
    all_results.extend(results)
# Deduplicate and rerank
\`\`\``,
        authorUsername: 'anna_llm',
      },
      {
        content: `Excellent guide! We implemented something similar and got comparable results. One thing we added: **answer verification**. After generating the answer, we pass it back to the LLM with the original context and ask "Is this answer supported by the context?"

It catches hallucinations before they reach users. Adds ~200ms but worth it.`,
        authorUsername: 'maya_enterprise',
      },
    ],
  },
  {
    title: 'Why are my RAG responses inconsistent?',
    slug: 'rag-responses-inconsistent-help',
    content: `I'm building a RAG system for our internal documentation and the responses are wildly inconsistent. Same question, different answers each time.

## Setup:
- OpenAI ada-002 embeddings
- Pinecone vector DB
- GPT-3.5-turbo for generation
- ~500 documents, split into chunks of 512 tokens

## Problem:
Sometimes I get perfect answers, other times completely wrong or "I don't know."

## Things I've tried:
- Different chunk sizes (256, 512, 1024)
- More retrieved documents (5 → 10)
- Lower temperature (0.7 → 0.3)

Still inconsistent. Any ideas what could be wrong?`,
    topicType: 'question',
    categorySlug: 'rag-vector-dbs',
    tags: ['rag', 'help', 'debugging', 'consistency'],
    replies: [
      {
        content: `The issue is likely **retrieval** not generation. Here's how to debug:

1. Log what documents are being retrieved
2. Manually check if the right docs have the answer
3. If correct docs aren't retrieved: embeddings problem
4. If correct docs retrieved but bad answer: prompt problem

Most likely it's #3. Are you using the same embedding model for indexing and querying? That's a common mistake.`,
        authorUsername: 'thomas_oss',
      },
      {
        content: `Temperature isn't your issue. With RAG, temperature should be 0 or very low anyway (factual task).

Your chunk size of 512 tokens is on the small side. You might be splitting important context. Try 1000 tokens with 200 overlap.

Also: are you retrieving based on similarity to the *question* or to a *rephrased version*? We found that having the LLM rephrase the question first improved retrieval by 30%.`,
        authorUsername: 'maya_enterprise',
      },
      {
        content: `**This smells like a reranking problem to me.**

Vector search returns documents sorted by embedding similarity, but that doesn't always match what's actually relevant. Add Cohere's reranker:

\`\`\`python
# After retrieval
reranked = cohere_client.rerank(
    query=query,
    documents=retrieved_docs,
    top_n=3
)
\`\`\`

We had the exact same issue and reranking solved it instantly.`,
        authorUsername: 'anna_llm',
      },
      {
        content: `Are you sure your prompt is good? Share it and let's review. In my experience, 80% of RAG problems are prompt problems. The model needs very clear instructions on how to use the context.

Also: add citation requirements! "Quote directly from the context" forces the model to use your docs.`,
        authorUsername: 'emily_ai',
      },
    ],
  },
  {
    title: 'Show HN: Open-source tool for tracking LLM costs',
    slug: 'show-hn-llm-cost-tracking-tool',
    content: `Hey everyone! I built an open-source tool for tracking and analyzing LLM API costs across OpenAI, Anthropic, and other providers.

## Features:
- 📊 Real-time cost tracking
- 📈 Usage analytics (tokens, requests, latency)
- 💰 Cost predictions and budgets
- 🔔 Alerts when approaching limits
- 📱 Dashboard for visualization

## Why I built this:
Our LLM costs went from $500/month to $15,000/month in 3 months and we had no visibility. This tool helped us identify:
- 40% of tokens were from a single inefficient prompt
- One endpoint was being called 10x more than expected
- We could switch to GPT-3.5 for 60% of requests

Result: Cut costs by 65% with zero impact on user experience.

## Tech stack:
- Python backend (FastAPI)
- React frontend
- PostgreSQL for storage
- Works as middleware in your existing stack

GitHub: [link]

Would love feedback! What features would make this more useful for you?`,
    topicType: 'showcase',
    categorySlug: 'showcase',
    tags: ['open-source', 'tools', 'cost-optimization', 'monitoring'],
    replies: [
      {
        content: `This is exactly what we need! Starring the repo now. One feature request: **token-level breakdown**. Show me which parts of my prompts are eating tokens. Is it the system message? The examples? The context?`,
        authorUsername: 'johndeveloper',
      },
      {
        content: `Brilliant! We're using Langsmith for this but it's expensive. An open-source alternative is much appreciated.

Feature request: **model comparison**. Let me test the same prompts with GPT-4, GPT-3.5, and Claude side-by-side and see cost vs quality trade-offs.`,
        authorUsername: 'marcus_ml',
      },
      {
        content: `Super cool! Question: does it support streaming responses? We use streaming for better UX and need to track those costs accurately.

Also: can it track fine-tuned models separately? Their costs are different.`,
        authorUsername: 'lisa_founder',
      },
      {
        content: `Awesome work! We've been looking for something like this. Two suggestions:

1. **Caching detection**: Show when we're wasting money on repeated identical requests
2. **Anomaly detection**: Alert when costs spike unexpectedly

Would be happy to contribute if you're accepting PRs!`,
        authorUsername: 'thomas_oss',
      },
      {
        content: `This is great for startups! We spent way too long building our own internal tracking. One thing that would be killer: **attribution by user/customer**. We need to know which customers are generating the most costs for our pricing model.`,
        authorUsername: 'anna_llm',
      },
    ],
  },
  {
    title: 'Fine-tuning vs RAG: When should I use each?',
    slug: 'fine-tuning-vs-rag-when-to-use',
    content: `I see a lot of confusion about when to use fine-tuning vs RAG. Here's my mental model after building both types of systems:

## Use RAG when:
- ✅ Your knowledge base changes frequently
- ✅ You need to cite sources
- ✅ You have limited training data (<1000 examples)
- ✅ Multiple use cases from the same knowledge base
- ✅ You want to add knowledge without retraining

## Use Fine-tuning when:
- ✅ You need a specific output format/style
- ✅ You have 1000+ high-quality examples
- ✅ Knowledge is stable
- ✅ Cost reduction is important (vs larger base model)
- ✅ You need consistent behavior

## Use BOTH when:
- ✅ Fine-tune for style/format consistency
- ✅ RAG for up-to-date information
- ✅ Best of both worlds!

## Real example:
We fine-tuned GPT-3.5 on 2000 customer support conversations to learn our tone and format. Then we use RAG to pull in up-to-date product information. Perfect combination!

What's your experience been?`,
    topicType: 'discussion',
    categorySlug: 'fine-tuning',
    tags: ['fine-tuning', 'rag', 'comparison', 'best-practices'],
    replies: [
      {
        content: `Great breakdown! I'd add one more to "Use Fine-tuning": when you need to reduce latency. Fine-tuned GPT-3.5 is faster than GPT-4 with RAG for our use case.`,
        authorUsername: 'maya_enterprise',
      },
      {
        content: `100% agree on using both! We do exactly this. Fine-tuned model handles the "how to respond" and RAG handles the "what to say."

One tip: fine-tune on synthetic data if you don't have enough real examples. Use GPT-4 to generate training data in your desired format.`,
        authorUsername: 'emily_ai',
      },
      {
        content: `Another consideration: **debugging**. RAG is easier to debug - you can see what documents were retrieved. Fine-tuning is a black box.

For production systems, this debuggability is worth a lot.`,
        authorUsername: 'thomas_oss',
      },
    ],
  },
  {
    title: 'GPT-4o vs GPT-4 Turbo: Worth the upgrade?',
    slug: 'gpt-4o-vs-gpt-4-turbo-comparison',
    content: `GPT-4o just came out and I'm trying to decide if it's worth switching from GPT-4 Turbo. Has anyone tested it thoroughly?

## From the docs:
- 2x faster
- 50% cheaper
- Better at audio/vision
- Same or better text quality

## My questions:
1. Is the text quality really the same? Any regressions?
2. Is the 2x speed claim accurate in practice?
3. Any gotchas or breaking changes?

Would love to hear real-world experiences before I migrate!`,
    topicType: 'question',
    categorySlug: 'openai-models',
    tags: ['gpt-4o', 'gpt-4', 'comparison'],
    replies: [
      {
        content: `We've been testing GPT-4o for a week now. Speed claim is accurate - responses are noticeably snappier. Text quality is comparable, maybe slightly better on average.

No breaking changes that we hit. API is identical. Just change the model name to "gpt-4o" and you're good.

We're switching all our production traffic. The cost savings alone are worth it.`,
        authorUsername: 'johndeveloper',
      },
      {
        content: `One "gotcha": GPT-4o seems more sensitive to system message wording. Some prompts that worked well on GPT-4 Turbo gave different results on GPT-4o until we refined them.

Not worse necessarily, just different. Budget time for testing.`,
        authorUsername: 'anna_llm',
      },
      {
        content: `The vision capabilities are *significantly* better. If you're doing any image processing, GPT-4o is a huge upgrade. Not even close.`,
        authorUsername: 'marcus_ml',
      },
    ],
  },
  {
    title: '[Paper Discussion] "Attention is All You Need" - 7 years later',
    slug: 'paper-discussion-attention-is-all-you-need-retrospective',
    content: `Just re-read the original Transformer paper ("Attention is All You Need") after working with LLMs for 2 years. It's wild how prescient it was.

## Key insights that aged well:
1. **Self-attention > RNNs**: They were right. RNNs are basically dead now.
2. **Parallelization**: This was huge for scaling. Couldn't have trained GPT-4 otherwise.
3. **Positional encodings**: Still used in most models, though we've improved them.

## Things they didn't anticipate:
1. The scale we'd reach (175B→1T+ parameters)
2. Few-shot learning capabilities
3. The importance of instruction tuning
4. Constitutional AI / RLHF

## Modern improvements over original:
- Rotary positional embeddings (RoPE)
- Flash Attention (2-3x faster)
- Mixture of Experts
- Sparse attention patterns

What do you think will be the next major architecture breakthrough? Or are we just scaling Transformers forever?`,
    topicType: 'paper',
    categorySlug: 'research-papers',
    tags: ['transformers', 'research', 'architecture', 'history'],
    replies: [
      {
        content: `The emergence of in-context learning was absolutely not anticipated. The paper was about seq2seq translation. Nobody expected that scaling these models would lead to few-shot learning and reasoning capabilities.

I think we'll see more efficient alternatives to full attention emerge. Attention is O(n²) which doesn't scale well to million-token contexts.`,
        authorUsername: 'emily_ai',
      },
      {
        content: `State Space Models (SSMs) like Mamba are interesting alternatives. They're O(n) instead of O(n²) but seem to match Transformers on many benchmarks.

The question is whether they scale as well. My bet: hybrid architectures that combine Transformers with SSMs for different parts of the model.`,
        authorUsername: 'thomas_oss',
      },
      {
        content: `One thing I find fascinating: the original paper used 6 layers. Now we're at 100+ layers. At what point do we hit diminishing returns on depth?

My prediction: we'll move toward MoE (sparse models) rather than pure depth. Mixtral showed this can work really well.`,
        authorUsername: 'maya_enterprise',
      },
    ],
  },
];

export async function seedForumContent(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding forum topics and replies...');

  let topicsCreated = 0;
  let repliesCreated = 0;

  for (const topicData of forumTopics) {
    try {
      // Get category
      const category = await prisma.forumCategory.findUnique({
        where: { slug: topicData.categorySlug },
      });

      if (!category) {
        console.log(`⚠️  Category '${topicData.categorySlug}' not found, skipping topic: ${topicData.title}`);
        continue;
      }

      // Get author (use admin or first available user)
      const author = await prisma.user.findFirst({
        where: { OR: [{ username: 'johndeveloper' }, { role: 'admin' }] },
      });

      if (!author) {
        console.log('⚠️  No users found. Please run user seed first.');
        return;
      }

      // Create or update topic
      const existingTopic = await prisma.topic.findFirst({
        where: { slug: topicData.slug },
      });

      let topic;
      if (existingTopic) {
        topic = await prisma.topic.update({
          where: { id: existingTopic.id },
          data: {
            title: topicData.title,
            content: topicData.content,
            topicType: topicData.topicType,
            status: 'open',
            viewCount: Math.floor(Math.random() * 1000) + 50,
            lastActivityAt: new Date(),
          },
        });
        console.log(`  ✅ Updated topic: ${topicData.title}`);
      } else {
        topic = await prisma.topic.create({
          data: {
            title: topicData.title,
            slug: topicData.slug,
            content: topicData.content,
            topicType: topicData.topicType,
            categoryId: category.id,
            authorId: author.id,
            status: 'open',
            viewCount: Math.floor(Math.random() * 1000) + 50,
            lastActivityAt: new Date(),
          },
        });
        topicsCreated++;
        console.log(`  ✅ Created topic: ${topicData.title}`);
      }

      // Add tags
      for (const tagName of topicData.tags) {
        const tag = await prisma.forumTag.upsert({
          where: { slug: tagName },
          update: { usageCount: { increment: 1 } },
          create: {
            name: tagName,
            slug: tagName,
            usageCount: 1,
          },
        });

        await prisma.topicTag.upsert({
          where: {
            topicId_tagId: {
              topicId: topic.id,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            topicId: topic.id,
            tagId: tag.id,
          },
        });
      }

      // Create replies
      for (const replyData of topicData.replies) {
        const replyAuthor = await prisma.user.findFirst({
          where: { username: replyData.authorUsername },
        });

        if (!replyAuthor) {
          console.log(`⚠️  User ${replyData.authorUsername} not found, skipping reply`);
          continue;
        }

        // Check if reply already exists
        const existingReply = await prisma.reply.findFirst({
          where: {
            topicId: topic.id,
            authorId: replyAuthor.id,
            content: replyData.content,
          },
        });

        if (!existingReply) {
          await prisma.reply.create({
            data: {
              topicId: topic.id,
              authorId: replyAuthor.id,
              content: replyData.content,
              depthLevel: 1,
              upvoteCount: Math.floor(Math.random() * 20),
              downvoteCount: Math.floor(Math.random() * 2),
            },
          });
          repliesCreated++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing topic ${topicData.title}:`, error);
    }
  }

  console.log('\n✅ Forum content seeding complete!');
  console.log(`   Topics created: ${topicsCreated}`);
  console.log(`   Replies created: ${repliesCreated}`);
}

export default seedForumContent;
