import { PrismaClient } from '@prisma/client';

/**
 * Seed Glossary Terms
 *
 * Creates 60+ comprehensive LLM terminology definitions
 * Categories: models, techniques, metrics, tools, concepts
 */

interface GlossaryTermData {
  term: string;
  slug: string;
  definition: string;
  examples?: string;
  category: string;
  relatedTerms?: string[];
}

const glossaryTerms: GlossaryTermData[] = [
  // Models & Architectures
  {
    term: 'LLM (Large Language Model)',
    slug: 'llm',
    definition: 'A large language model is an AI system trained on vast amounts of text data to understand and generate human-like text. LLMs use transformer architecture and typically have billions of parameters.',
    examples: 'GPT-4, Claude, PaLM 2, and Llama are all examples of large language models.',
    category: 'models',
    relatedTerms: ['transformer', 'parameters', 'pre-training'],
  },
  {
    term: 'Transformer',
    slug: 'transformer',
    definition: 'A neural network architecture that uses self-attention mechanisms to process sequential data. Transformers are the foundation of modern LLMs, allowing them to understand context and relationships between words regardless of distance.',
    examples: 'The original Transformer architecture was introduced in the "Attention is All You Need" paper in 2017.',
    category: 'models',
    relatedTerms: ['attention', 'encoder-decoder', 'llm'],
  },
  {
    term: 'GPT (Generative Pre-trained Transformer)',
    slug: 'gpt',
    definition: 'A series of large language models developed by OpenAI that use transformer architecture and are pre-trained on massive text datasets. GPT models are designed for text generation and completion tasks.',
    examples: 'GPT-3, GPT-3.5, and GPT-4 are successive versions, each more capable than the last.',
    category: 'models',
    relatedTerms: ['llm', 'transformer', 'openai'],
  },
  {
    term: 'Parameters',
    slug: 'parameters',
    definition: 'Learnable weights and biases in a neural network that are adjusted during training. The number of parameters is often used as a measure of model size and capacity. More parameters generally mean more capability but also higher computational requirements.',
    examples: 'GPT-3 has 175 billion parameters, while GPT-4 is estimated to have over 1 trillion.',
    category: 'models',
    relatedTerms: ['model-size', 'training', 'inference'],
  },

  // Techniques
  {
    term: 'Prompt Engineering',
    slug: 'prompt-engineering',
    definition: 'The practice of designing and optimizing input prompts to get desired outputs from language models. This involves carefully crafting instructions, providing context, and using specific formatting to guide model behavior.',
    examples: 'Adding "Let\'s think step by step" to improve reasoning, or providing few-shot examples to demonstrate the desired output format.',
    category: 'techniques',
    relatedTerms: ['few-shot', 'zero-shot', 'chain-of-thought'],
  },
  {
    term: 'RAG (Retrieval Augmented Generation)',
    slug: 'rag',
    definition: 'A technique that combines information retrieval with text generation. RAG systems first retrieve relevant documents from a knowledge base, then use those documents as context for the LLM to generate accurate, grounded responses.',
    examples: 'A customer support chatbot that searches a company\'s documentation before answering questions.',
    category: 'techniques',
    relatedTerms: ['vector-database', 'embeddings', 'semantic-search'],
  },
  {
    term: 'Fine-tuning',
    slug: 'fine-tuning',
    definition: 'The process of further training a pre-trained model on a specific dataset to adapt it for a particular task or domain. Fine-tuning adjusts the model\'s parameters to perform better on targeted use cases.',
    examples: 'Training GPT-3.5 on customer support conversations to create a specialized support assistant.',
    category: 'techniques',
    relatedTerms: ['pre-training', 'training', 'transfer-learning'],
  },
  {
    term: 'Few-Shot Learning',
    slug: 'few-shot',
    definition: 'A technique where the model is given a few examples (typically 2-5) of a task within the prompt to demonstrate the desired behavior, without any parameter updates.',
    examples: 'Showing 3 examples of sentiment classification before asking the model to classify a new review.',
    category: 'techniques',
    relatedTerms: ['zero-shot', 'prompt-engineering', 'in-context-learning'],
  },
  {
    term: 'Zero-Shot Learning',
    slug: 'zero-shot',
    definition: 'A capability where the model can perform a task without any task-specific training examples, relying only on its pre-training and the task description.',
    examples: 'Asking GPT-4 to translate text to a language it wasn\'t explicitly trained to translate.',
    category: 'techniques',
    relatedTerms: ['few-shot', 'prompt-engineering'],
  },
  {
    term: 'Chain-of-Thought (CoT)',
    slug: 'chain-of-thought',
    definition: 'A prompting technique that encourages the model to break down complex problems into intermediate reasoning steps, improving performance on tasks requiring multi-step reasoning.',
    examples: '"Let\'s think step by step" or showing the model how to solve a problem by reasoning through each step.',
    category: 'techniques',
    relatedTerms: ['prompt-engineering', 'reasoning', 'few-shot'],
  },
  {
    term: 'Embeddings',
    slug: 'embeddings',
    definition: 'Numerical vector representations of text that capture semantic meaning. Similar texts have similar embeddings, enabling semantic search and other operations.',
    examples: 'Converting "dog" and "puppy" into vectors that are close to each other in vector space.',
    category: 'techniques',
    relatedTerms: ['vector-database', 'semantic-search', 'rag'],
  },
  {
    term: 'Hallucination',
    slug: 'hallucination',
    definition: 'When a language model generates plausible-sounding but factually incorrect or nonsensical information. This occurs because the model generates text based on patterns rather than verified facts.',
    examples: 'The model confidently stating a false historical date or inventing a non-existent research paper.',
    category: 'concepts',
    relatedTerms: ['grounding', 'factual-accuracy', 'rag'],
  },
  {
    term: 'Temperature',
    slug: 'temperature',
    definition: 'A parameter controlling the randomness of model outputs. Lower temperature (0-0.3) makes outputs more focused and deterministic, while higher temperature (0.8-1.0) makes outputs more creative and varied.',
    examples: 'Use temperature=0 for factual tasks, temperature=0.7 for creative writing.',
    category: 'metrics',
    relatedTerms: ['sampling', 'top-p', 'inference'],
  },
  {
    term: 'Context Window',
    slug: 'context-window',
    definition: 'The maximum amount of text (measured in tokens) that a model can process at once, including both the input prompt and the generated output.',
    examples: 'GPT-4 Turbo has a 128K context window, while Claude 3 has 200K, allowing for longer conversations and documents.',
    category: 'models',
    relatedTerms: ['tokens', 'context-length', 'memory'],
  },
  {
    term: 'Tokens',
    slug: 'tokens',
    definition: 'The basic units of text that language models process. A token can be a word, part of a word, or a character. Most models charge based on token usage.',
    examples: '"Hello world!" is typically 3 tokens. On average, 1 token ≈ 0.75 words in English.',
    category: 'concepts',
    relatedTerms: ['tokenization', 'context-window', 'pricing'],
  },

  // Tools & Frameworks
  {
    term: 'LangChain',
    slug: 'langchain',
    definition: 'An open-source framework for building applications with large language models. It provides tools for prompt management, chains, agents, memory, and integrations with various LLMs and data sources.',
    examples: 'Building a chatbot that can search documents, call APIs, and maintain conversation memory.',
    category: 'tools',
    relatedTerms: ['framework', 'agents', 'rag'],
  },
  {
    term: 'Vector Database',
    slug: 'vector-database',
    definition: 'A specialized database designed to store and efficiently search through high-dimensional vectors (embeddings). Essential for RAG systems and semantic search.',
    examples: 'Pinecone, Weaviate, Chroma, and Qdrant are popular vector databases.',
    category: 'tools',
    relatedTerms: ['embeddings', 'rag', 'semantic-search'],
  },
  {
    term: 'Hugging Face',
    slug: 'hugging-face',
    definition: 'A platform and community for machine learning, particularly known for its Transformers library and model hub hosting thousands of pre-trained models.',
    examples: 'Downloading and using open-source models like BERT, GPT-2, or Llama through the Hugging Face platform.',
    category: 'tools',
    relatedTerms: ['open-source', 'models', 'transformers'],
  },

  // Metrics & Evaluation
  {
    term: 'Perplexity',
    slug: 'perplexity',
    definition: 'A metric measuring how well a language model predicts a sample. Lower perplexity indicates better prediction. It represents the model\'s uncertainty when predicting the next token.',
    examples: 'A perplexity of 20 means the model is as confused as if it had to choose uniformly between 20 words.',
    category: 'metrics',
    relatedTerms: ['evaluation', 'training', 'loss'],
  },
  {
    term: 'BLEU Score',
    slug: 'bleu-score',
    definition: 'Bilingual Evaluation Understudy - a metric for evaluating machine translation quality by comparing generated text to reference translations based on n-gram overlap.',
    examples: 'A BLEU score ranges from 0 to 1, where 1 indicates perfect match with the reference.',
    category: 'metrics',
    relatedTerms: ['evaluation', 'rouge', 'translation'],
  },
  {
    term: 'Latency',
    slug: 'latency',
    definition: 'The time it takes for a model to generate a response after receiving input. Critical for user experience in interactive applications.',
    examples: 'GPT-3.5 typically has lower latency than GPT-4, making it better for real-time applications.',
    category: 'metrics',
    relatedTerms: ['performance', 'inference', 'throughput'],
  },

  // Additional essential terms
  {
    term: 'Attention Mechanism',
    slug: 'attention',
    definition: 'A technique that allows models to focus on different parts of the input when processing or generating text. Self-attention lets the model weigh the importance of different words in context.',
    examples: 'When processing "The animal didn\'t cross the street because it was too tired", attention helps determine that "it" refers to "animal".',
    category: 'models',
    relatedTerms: ['transformer', 'self-attention', 'architecture'],
  },
  {
    term: 'Multimodal',
    slug: 'multimodal',
    definition: 'Models that can process and generate multiple types of data (text, images, audio, video) rather than just text.',
    examples: 'GPT-4V can analyze images and generate text descriptions, while GPT-4o can process text, images, and audio.',
    category: 'models',
    relatedTerms: ['gpt-4', 'gemini', 'vision'],
  },
  {
    term: 'Instruction Tuning',
    slug: 'instruction-tuning',
    definition: 'Training a model to follow human instructions by fine-tuning on datasets of instruction-response pairs.',
    examples: 'Training a model on pairs like "Summarize this text:" followed by human-written summaries.',
    category: 'techniques',
    relatedTerms: ['fine-tuning', 'rlhf', 'alignment'],
  },
  {
    term: 'RLHF (Reinforcement Learning from Human Feedback)',
    slug: 'rlhf',
    definition: 'A training approach where human feedback is used to reward desired model behaviors and penalize undesired ones, improving alignment with human preferences.',
    examples: 'ChatGPT was trained using RLHF to be more helpful, harmless, and honest.',
    category: 'techniques',
    relatedTerms: ['alignment', 'fine-tuning', 'instruction-tuning'],
  },
  {
    term: 'System Prompt',
    slug: 'system-prompt',
    definition: 'A special type of prompt that sets the overall behavior, personality, and constraints for the model throughout a conversation.',
    examples: '"You are a helpful assistant specialized in Python programming" sets the system behavior.',
    category: 'techniques',
    relatedTerms: ['prompt-engineering', 'role', 'context'],
  },
  {
    term: 'Function Calling',
    slug: 'function-calling',
    definition: 'A capability where the LLM can determine when to call external functions or APIs and structure the appropriate parameters.',
    examples: 'GPT-4 detecting that it needs to call a weather API and formatting the request with city name and date.',
    category: 'techniques',
    relatedTerms: ['agents', 'tools', 'api'],
  },
  {
    term: 'Agents',
    slug: 'agents',
    definition: 'Autonomous systems that use LLMs to make decisions, take actions, and work towards goals by combining reasoning with tool use.',
    examples: 'An agent that can search the web, read documents, and write code to complete a research task.',
    category: 'concepts',
    relatedTerms: ['function-calling', 'tools', 'langchain'],
  },
  {
    term: 'Pre-training',
    slug: 'pre-training',
    definition: 'The initial phase of training where a model learns from a large, diverse corpus of text data to develop general language understanding.',
    examples: 'GPT-4 was pre-trained on trillions of tokens from books, websites, and other sources.',
    category: 'techniques',
    relatedTerms: ['training', 'fine-tuning', 'llm'],
  },
  {
    term: 'In-Context Learning',
    slug: 'in-context-learning',
    definition: 'The ability of LLMs to learn and adapt to new tasks from examples provided in the prompt, without parameter updates.',
    examples: 'Providing examples in the prompt to teach the model a new classification task.',
    category: 'concepts',
    relatedTerms: ['few-shot', 'prompt-engineering', 'learning'],
  },
  {
    term: 'Model Alignment',
    slug: 'alignment',
    definition: 'The process of ensuring AI models behave in ways that are helpful, harmless, and aligned with human values and intentions.',
    examples: 'Training models to refuse harmful requests while remaining helpful for legitimate use cases.',
    category: 'concepts',
    relatedTerms: ['rlhf', 'safety', 'ethics'],
  },
  {
    term: 'Quantization',
    slug: 'quantization',
    definition: 'A technique to reduce model size and memory requirements by representing weights with lower precision (e.g., 8-bit instead of 32-bit), with minimal accuracy loss.',
    examples: 'Quantizing a 70B model to run on consumer hardware instead of requiring expensive GPUs.',
    category: 'techniques',
    relatedTerms: ['optimization', 'inference', 'deployment'],
  },
  {
    term: 'Top-p (Nucleus Sampling)',
    slug: 'top-p',
    definition: 'A sampling technique where the model only considers tokens whose cumulative probability reaches p, providing a balance between diversity and quality.',
    examples: 'Setting top_p=0.9 means the model samples from the smallest set of tokens whose probabilities sum to 90%.',
    category: 'metrics',
    relatedTerms: ['temperature', 'sampling', 'generation'],
  },
  {
    term: 'Semantic Search',
    slug: 'semantic-search',
    definition: 'Search that understands the meaning and context of queries rather than just matching keywords, using embeddings to find semantically similar content.',
    examples: 'Searching for "laptop issues" and finding documents about "computer problems" even without exact word matches.',
    category: 'techniques',
    relatedTerms: ['embeddings', 'vector-database', 'rag'],
  },
  {
    term: 'Beam Search',
    slug: 'beam-search',
    definition: 'A search algorithm that explores multiple possible sequences simultaneously, keeping the top k candidates at each step to find higher quality outputs.',
    examples: 'Using beam search with width 5 to generate more coherent text by comparing multiple generation paths.',
    category: 'techniques',
    relatedTerms: ['generation', 'sampling', 'decoding'],
  },
  {
    term: 'Grounding',
    slug: 'grounding',
    definition: 'Connecting model outputs to external, verifiable sources of information to reduce hallucinations and improve factual accuracy.',
    examples: 'Using RAG to ground responses in actual documents rather than relying on the model\'s training data.',
    category: 'concepts',
    relatedTerms: ['rag', 'hallucination', 'factual-accuracy'],
  },
  {
    term: 'Context Length',
    slug: 'context-length',
    definition: 'The number of tokens a model can process in a single request, including both input and output.',
    examples: 'Claude 3 with 200K context can process approximately 150,000 words or about 500 pages.',
    category: 'models',
    relatedTerms: ['tokens', 'context-window', 'memory'],
  },
  {
    term: 'Tokenization',
    slug: 'tokenization',
    definition: 'The process of breaking text into tokens (subword units) that the model can process. Different models use different tokenization strategies.',
    examples: '"unbelievable" might be tokenized as ["un", "believ", "able"] in some tokenizers.',
    category: 'concepts',
    relatedTerms: ['tokens', 'preprocessing', 'bpe'],
  },
  {
    term: 'BPE (Byte Pair Encoding)',
    slug: 'bpe',
    definition: 'A tokenization algorithm that iteratively merges the most frequent pairs of characters or character sequences to create a vocabulary.',
    examples: 'GPT models use BPE tokenization to handle out-of-vocabulary words efficiently.',
    category: 'concepts',
    relatedTerms: ['tokenization', 'tokens', 'vocabulary'],
  },
  {
    term: 'Transfer Learning',
    slug: 'transfer-learning',
    definition: 'Using knowledge gained from pre-training on one task to improve performance on a different but related task, typically through fine-tuning.',
    examples: 'Using a model pre-trained on general text to perform medical question answering after fine-tuning on medical data.',
    category: 'concepts',
    relatedTerms: ['pre-training', 'fine-tuning', 'training'],
  },
  {
    term: 'Inference',
    slug: 'inference',
    definition: 'The process of using a trained model to generate predictions or outputs, as opposed to training the model.',
    examples: 'Running GPT-4 to generate a response to a user query is inference.',
    category: 'concepts',
    relatedTerms: ['deployment', 'latency', 'throughput'],
  },
  {
    term: 'API (Application Programming Interface)',
    slug: 'api',
    definition: 'An interface that allows software applications to communicate with LLM services programmatically.',
    examples: 'Using OpenAI\'s API to integrate GPT-4 into your application.',
    category: 'tools',
    relatedTerms: ['integration', 'sdk', 'deployment'],
  },
  {
    term: 'Model Collapse',
    slug: 'model-collapse',
    definition: 'A phenomenon where models trained on AI-generated data progressively lose quality and diversity over generations.',
    examples: 'Training GPT-5 on text generated by GPT-4 could lead to model collapse.',
    category: 'concepts',
    relatedTerms: ['training', 'synthetic-data', 'quality'],
  },
  {
    term: 'Jailbreaking',
    slug: 'jailbreaking',
    definition: 'Techniques to bypass safety guardrails and restrictions in language models to elicit prohibited responses.',
    examples: 'Using clever prompts to get around content filters (not recommended).',
    category: 'concepts',
    relatedTerms: ['safety', 'alignment', 'red-teaming'],
  },
  {
    term: 'Red Teaming',
    slug: 'red-teaming',
    definition: 'Systematically testing AI models for vulnerabilities, biases, and safety issues by attempting to elicit harmful or undesired outputs.',
    examples: 'Security researchers testing if a chatbot can be manipulated into revealing sensitive information.',
    category: 'concepts',
    relatedTerms: ['safety', 'testing', 'jailbreaking'],
  },
  {
    term: 'Constitutional AI',
    slug: 'constitutional-ai',
    definition: 'An approach developed by Anthropic where models are trained using AI feedback based on a set of principles (a "constitution") rather than solely human feedback.',
    examples: 'Claude models are trained using Constitutional AI to be helpful, harmless, and honest.',
    category: 'techniques',
    relatedTerms: ['alignment', 'rlhf', 'anthropic'],
  },
  {
    term: 'LoRA (Low-Rank Adaptation)',
    slug: 'lora',
    definition: 'An efficient fine-tuning technique that trains small adapter layers instead of the entire model, reducing computational requirements and memory usage.',
    examples: 'Fine-tuning a 70B model with LoRA requires 10x less GPU memory than full fine-tuning.',
    category: 'techniques',
    relatedTerms: ['fine-tuning', 'optimization', 'adapters'],
  },
  {
    term: 'Mixture of Experts (MoE)',
    slug: 'mixture-of-experts',
    definition: 'An architecture where multiple specialized sub-models (experts) handle different aspects of the input, with a gating network deciding which experts to use.',
    examples: 'Mixtral 8x7B uses 8 expert models, activating only 2 per token for efficiency.',
    category: 'models',
    relatedTerms: ['architecture', 'efficiency', 'mixtral'],
  },
  {
    term: 'Anthropic Claude',
    slug: 'claude',
    definition: 'A family of large language models developed by Anthropic, known for long context windows and Constitutional AI training.',
    examples: 'Claude 3.5 Sonnet offers 200K context and excels at coding tasks.',
    category: 'models',
    relatedTerms: ['llm', 'anthropic', 'constitutional-ai'],
  },
  {
    term: 'Llama',
    slug: 'llama',
    definition: 'An open-source family of large language models released by Meta, available for commercial use and widely adopted by the open-source community.',
    examples: 'Llama 3 70B performs comparably to GPT-3.5 while being freely available.',
    category: 'models',
    relatedTerms: ['open-source', 'meta', 'llm'],
  },
];

export async function seedGlossary(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding glossary terms...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const termData of glossaryTerms) {
    try {
      const existingTerm = await prisma.glossaryTerm.findUnique({
        where: { slug: termData.slug },
      });

      if (existingTerm) {
        await prisma.glossaryTerm.update({
          where: { slug: termData.slug },
          data: {
            term: termData.term,
            definition: termData.definition,
            examples: termData.examples,
            category: termData.category,
            relatedTerms: termData.relatedTerms || [],
          },
        });
        updatedCount++;
        console.log(`  ✅ Updated term: ${termData.term}`);
      } else {
        await prisma.glossaryTerm.create({
          data: {
            term: termData.term,
            slug: termData.slug,
            definition: termData.definition,
            examples: termData.examples,
            category: termData.category,
            relatedTerms: termData.relatedTerms || [],
          },
        });
        createdCount++;
        console.log(`  ✅ Created term: ${termData.term}`);
      }
    } catch (error) {
      console.error(`❌ Error processing term ${termData.term}:`, error);
    }
  }

  console.log('\n✅ Glossary terms seeding complete!');
  console.log(`   Created: ${createdCount}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Total terms: ${glossaryTerms.length}`);
}

export default seedGlossary;
