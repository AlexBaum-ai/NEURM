import { PrismaClient, ModelCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLLMModels() {
  console.log('🌱 Seeding LLM models...');

  const models = [
    // OpenAI Models
    {
      name: 'GPT-4 Turbo',
      slug: 'gpt-4-turbo',
      provider: 'OpenAI',
      category: ModelCategory.commercial,
      description:
        'GPT-4 Turbo is OpenAI\'s most capable model with enhanced performance, featuring a 128K context window and knowledge cutoff of April 2023.',
      contextWindow: 128000,
      modelSize: '1.76T parameters (estimated)',
      modalities: ['text', 'image'],
      releaseDate: new Date('2023-11-06'),
      latestVersion: 'gpt-4-turbo-2024-04-09',
      status: 'active',
      pricingInput: 0.01,
      pricingOutput: 0.03,
      officialUrl: 'https://platform.openai.com/docs/models/gpt-4-turbo',
      apiDocsUrl: 'https://platform.openai.com/docs/api-reference',
      bestFor: ['Complex reasoning', 'Long context tasks', 'Multimodal applications'],
      notIdealFor: ['Real-time applications', 'Cost-sensitive projects'],
      apiQuickstart: {
        python: `from openai import OpenAI\nclient = OpenAI()\n\nresponse = client.chat.completions.create(\n  model="gpt-4-turbo",\n  messages=[{"role": "user", "content": "Hello!"}]\n)\nprint(response.choices[0].message.content)`,
        javascript: `import OpenAI from 'openai';\nconst client = new OpenAI();\n\nconst response = await client.chat.completions.create({\n  model: 'gpt-4-turbo',\n  messages: [{ role: 'user', content: 'Hello!' }]\n});\nconsole.log(response.choices[0].message.content);`,
        curl: `curl https://api.openai.com/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer $OPENAI_API_KEY" \\\n  -d '{\n    "model": "gpt-4-turbo",\n    "messages": [{"role": "user", "content": "Hello!"}]\n  }'`,
      },
    },
    {
      name: 'GPT-4',
      slug: 'gpt-4',
      provider: 'OpenAI',
      category: ModelCategory.commercial,
      description:
        'GPT-4 is a large multimodal model accepting text and image inputs, emitting text outputs with superior performance on professional and academic benchmarks.',
      contextWindow: 8192,
      modelSize: '1.76T parameters (estimated)',
      modalities: ['text', 'image'],
      releaseDate: new Date('2023-03-14'),
      latestVersion: 'gpt-4-0613',
      status: 'active',
      pricingInput: 0.03,
      pricingOutput: 0.06,
      officialUrl: 'https://platform.openai.com/docs/models/gpt-4',
      apiDocsUrl: 'https://platform.openai.com/docs/api-reference',
      bestFor: ['Complex tasks', 'Coding', 'Analysis'],
      notIdealFor: ['Simple queries', 'Budget-constrained projects'],
    },
    {
      name: 'GPT-3.5 Turbo',
      slug: 'gpt-3-5-turbo',
      provider: 'OpenAI',
      category: ModelCategory.commercial,
      description:
        'GPT-3.5 Turbo is optimized for chat and works well for traditional completions tasks, offering a balance of performance and cost.',
      contextWindow: 16385,
      modelSize: '175B parameters',
      modalities: ['text'],
      releaseDate: new Date('2022-11-30'),
      latestVersion: 'gpt-3.5-turbo-0125',
      status: 'active',
      pricingInput: 0.0005,
      pricingOutput: 0.0015,
      officialUrl: 'https://platform.openai.com/docs/models/gpt-3-5-turbo',
      apiDocsUrl: 'https://platform.openai.com/docs/api-reference',
      bestFor: ['Chat applications', 'Cost-effective tasks', 'High-volume usage'],
      notIdealFor: ['Complex reasoning', 'Very long context'],
    },
    {
      name: 'GPT-4o',
      slug: 'gpt-4o',
      provider: 'OpenAI',
      category: ModelCategory.commercial,
      description:
        'GPT-4o ("o" for "omni") is OpenAI\'s most advanced multimodal model, processing text, audio, and images with unprecedented speed and intelligence.',
      contextWindow: 128000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image', 'audio'],
      releaseDate: new Date('2024-05-13'),
      latestVersion: 'gpt-4o-2024-05-13',
      status: 'active',
      pricingInput: 0.005,
      pricingOutput: 0.015,
      officialUrl: 'https://platform.openai.com/docs/models/gpt-4o',
      apiDocsUrl: 'https://platform.openai.com/docs/api-reference',
      bestFor: ['Multimodal applications', 'Real-time processing', 'Audio understanding'],
      notIdealFor: ['Text-only tasks on a budget'],
    },

    // Anthropic Models
    {
      name: 'Claude 3.5 Sonnet',
      slug: 'claude-3-5-sonnet',
      provider: 'Anthropic',
      category: ModelCategory.commercial,
      description:
        'Claude 3.5 Sonnet sets new industry benchmarks for intelligence, speed, and cost, outperforming competitor models and Claude 3 Opus on a wide range of evaluations.',
      contextWindow: 200000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image'],
      releaseDate: new Date('2024-06-20'),
      latestVersion: 'claude-3-5-sonnet-20240620',
      status: 'active',
      pricingInput: 0.003,
      pricingOutput: 0.015,
      officialUrl: 'https://www.anthropic.com/claude',
      apiDocsUrl: 'https://docs.anthropic.com/claude/reference',
      bestFor: ['Long documents', 'Coding', 'Complex analysis'],
      notIdealFor: ['Simple queries', 'Extremely latency-sensitive tasks'],
      apiQuickstart: {
        python: `import anthropic\nclient = anthropic.Anthropic()\n\nmessage = client.messages.create(\n  model="claude-3-5-sonnet-20240620",\n  max_tokens=1024,\n  messages=[{"role": "user", "content": "Hello!"}]\n)\nprint(message.content)`,
        javascript: `import Anthropic from '@anthropic-ai/sdk';\nconst client = new Anthropic();\n\nconst message = await client.messages.create({\n  model: 'claude-3-5-sonnet-20240620',\n  max_tokens: 1024,\n  messages: [{ role: 'user', content: 'Hello!' }]\n});\nconsole.log(message.content);`,
      },
    },
    {
      name: 'Claude 3 Opus',
      slug: 'claude-3-opus',
      provider: 'Anthropic',
      category: ModelCategory.commercial,
      description:
        'Claude 3 Opus is Anthropic\'s most powerful model for highly complex tasks, with top-level performance across multiple evaluations.',
      contextWindow: 200000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image'],
      releaseDate: new Date('2024-03-04'),
      latestVersion: 'claude-3-opus-20240229',
      status: 'active',
      pricingInput: 0.015,
      pricingOutput: 0.075,
      officialUrl: 'https://www.anthropic.com/claude',
      apiDocsUrl: 'https://docs.anthropic.com/claude/reference',
      bestFor: ['Research', 'Complex reasoning', 'Long documents'],
      notIdealFor: ['Cost-sensitive projects', 'Simple tasks'],
    },
    {
      name: 'Claude 3 Sonnet',
      slug: 'claude-3-sonnet',
      provider: 'Anthropic',
      category: ModelCategory.commercial,
      description:
        'Claude 3 Sonnet strikes the ideal balance between intelligence and speed, excelling at enterprise workloads and scaled AI deployments.',
      contextWindow: 200000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image'],
      releaseDate: new Date('2024-03-04'),
      latestVersion: 'claude-3-sonnet-20240229',
      status: 'active',
      pricingInput: 0.003,
      pricingOutput: 0.015,
      officialUrl: 'https://www.anthropic.com/claude',
      apiDocsUrl: 'https://docs.anthropic.com/claude/reference',
      bestFor: ['Data processing', 'Sales automation', 'Enterprise workloads'],
      notIdealFor: ['Highest complexity tasks', 'Budget projects'],
    },
    {
      name: 'Claude 3 Haiku',
      slug: 'claude-3-haiku',
      provider: 'Anthropic',
      category: ModelCategory.commercial,
      description:
        'Claude 3 Haiku is Anthropic\'s fastest and most compact model, designed for near-instant responsiveness and seamless AI experiences.',
      contextWindow: 200000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image'],
      releaseDate: new Date('2024-03-04'),
      latestVersion: 'claude-3-haiku-20240307',
      status: 'active',
      pricingInput: 0.00025,
      pricingOutput: 0.00125,
      officialUrl: 'https://www.anthropic.com/claude',
      apiDocsUrl: 'https://docs.anthropic.com/claude/reference',
      bestFor: ['Chat applications', 'Real-time interactions', 'Cost optimization'],
      notIdealFor: ['Complex reasoning', 'Long-form content generation'],
    },

    // Google Models
    {
      name: 'Gemini 1.5 Pro',
      slug: 'gemini-1-5-pro',
      provider: 'Google',
      category: ModelCategory.commercial,
      description:
        'Gemini 1.5 Pro is Google\'s most capable model with a breakthrough 2 million token context window, excelling at complex reasoning and multimodal understanding.',
      contextWindow: 2000000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image', 'audio', 'video'],
      releaseDate: new Date('2024-02-15'),
      latestVersion: 'gemini-1.5-pro',
      status: 'active',
      pricingInput: 0.00125,
      pricingOutput: 0.005,
      officialUrl: 'https://deepmind.google/technologies/gemini/',
      apiDocsUrl: 'https://ai.google.dev/docs',
      bestFor: ['Long documents', 'Video analysis', 'Multimodal tasks'],
      notIdealFor: ['Simple text tasks', 'Real-time applications'],
      apiQuickstart: {
        python: `import google.generativeai as genai\ngenai.configure(api_key="YOUR_API_KEY")\n\nmodel = genai.GenerativeModel('gemini-1.5-pro')\nresponse = model.generate_content("Hello!")\nprint(response.text)`,
      },
    },
    {
      name: 'Gemini 1.5 Flash',
      slug: 'gemini-1-5-flash',
      provider: 'Google',
      category: ModelCategory.commercial,
      description:
        'Gemini 1.5 Flash is a fast and versatile multimodal model optimized for performance at scale with a 1M token context window.',
      contextWindow: 1000000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image', 'audio', 'video'],
      releaseDate: new Date('2024-05-14'),
      latestVersion: 'gemini-1.5-flash',
      status: 'active',
      pricingInput: 0.000075,
      pricingOutput: 0.0003,
      officialUrl: 'https://deepmind.google/technologies/gemini/',
      apiDocsUrl: 'https://ai.google.dev/docs',
      bestFor: ['High-volume tasks', 'Multimodal processing', 'Cost efficiency'],
      notIdealFor: ['Most complex reasoning'],
    },
    {
      name: 'PaLM 2',
      slug: 'palm-2',
      provider: 'Google',
      category: ModelCategory.commercial,
      description:
        'PaLM 2 is Google\'s large language model with improved multilingual, reasoning, and coding capabilities, powering many Google products.',
      contextWindow: 8192,
      modelSize: '340B parameters',
      modalities: ['text'],
      releaseDate: new Date('2023-05-10'),
      latestVersion: 'palm-2',
      status: 'active',
      pricingInput: 0.00025,
      pricingOutput: 0.0005,
      officialUrl: 'https://ai.google/discover/palm2/',
      apiDocsUrl: 'https://ai.google.dev/docs',
      bestFor: ['Multilingual tasks', 'Reasoning', 'Coding'],
      notIdealFor: ['Very long context', 'Multimodal tasks'],
    },

    // Meta Models
    {
      name: 'Llama 3.2 405B',
      slug: 'llama-3-2-405b',
      provider: 'Meta',
      category: ModelCategory.open_source,
      description:
        'Llama 3.2 405B is Meta\'s largest open-source model, rivaling the best closed-source models with multilingual support and advanced reasoning.',
      contextWindow: 128000,
      modelSize: '405B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-09-25'),
      latestVersion: '3.2',
      status: 'active',
      officialUrl: 'https://ai.meta.com/llama/',
      apiDocsUrl: 'https://llama.meta.com/docs/',
      bestFor: ['Self-hosting', 'Complex reasoning', 'Multilingual tasks'],
      notIdealFor: ['Resource-constrained environments', 'Real-time applications'],
      apiQuickstart: {
        python: `from transformers import AutoTokenizer, AutoModelForCausalLM\n\ntokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-405B")\nmodel = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-405B")\n\ninputs = tokenizer("Hello!", return_tensors="pt")\noutputs = model.generate(**inputs)\nprint(tokenizer.decode(outputs[0]))`,
      },
    },
    {
      name: 'Llama 3.2 70B',
      slug: 'llama-3-2-70b',
      provider: 'Meta',
      category: ModelCategory.open_source,
      description:
        'Llama 3.2 70B offers excellent performance for its size, balancing capability and efficiency for production deployments.',
      contextWindow: 128000,
      modelSize: '70B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-09-25'),
      latestVersion: '3.2',
      status: 'active',
      officialUrl: 'https://ai.meta.com/llama/',
      apiDocsUrl: 'https://llama.meta.com/docs/',
      bestFor: ['Production deployments', 'Cost-effective reasoning', 'Self-hosting'],
      notIdealFor: ['Most complex tasks', 'Multimodal applications'],
    },
    {
      name: 'Llama 3.2 8B',
      slug: 'llama-3-2-8b',
      provider: 'Meta',
      category: ModelCategory.open_source,
      description:
        'Llama 3.2 8B is a compact model ideal for edge deployments and resource-constrained environments while maintaining strong performance.',
      contextWindow: 128000,
      modelSize: '8B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-09-25'),
      latestVersion: '3.2',
      status: 'active',
      officialUrl: 'https://ai.meta.com/llama/',
      apiDocsUrl: 'https://llama.meta.com/docs/',
      bestFor: ['Edge deployment', 'Mobile devices', 'Low-latency applications'],
      notIdealFor: ['Complex reasoning', 'Long documents'],
    },

    // Mistral AI Models
    {
      name: 'Mistral Large',
      slug: 'mistral-large',
      provider: 'Mistral AI',
      category: ModelCategory.commercial,
      description:
        'Mistral Large is a top-tier reasoning model with 128K context length, excelling at complex multilingual reasoning tasks and code generation.',
      contextWindow: 128000,
      modelSize: 'Undisclosed',
      modalities: ['text'],
      releaseDate: new Date('2024-02-26'),
      latestVersion: 'mistral-large-2407',
      status: 'active',
      pricingInput: 0.003,
      pricingOutput: 0.009,
      officialUrl: 'https://mistral.ai/news/mistral-large/',
      apiDocsUrl: 'https://docs.mistral.ai/',
      bestFor: ['Complex reasoning', 'Code generation', 'Multilingual tasks'],
      notIdealFor: ['Simple queries', 'Budget projects'],
      apiQuickstart: {
        python: `from mistralai.client import MistralClient\nclient = MistralClient(api_key="YOUR_API_KEY")\n\nresponse = client.chat(\n  model="mistral-large-latest",\n  messages=[{"role": "user", "content": "Hello!"}]\n)\nprint(response.choices[0].message.content)`,
      },
    },
    {
      name: 'Mixtral 8x7B',
      slug: 'mixtral-8x7b',
      provider: 'Mistral AI',
      category: ModelCategory.open_source,
      description:
        'Mixtral 8x7B is a high-quality sparse mixture-of-experts model with 7B active parameters, offering strong performance at reduced computational cost.',
      contextWindow: 32768,
      modelSize: '46.7B total (7B active)',
      modalities: ['text'],
      releaseDate: new Date('2023-12-11'),
      latestVersion: 'v0.1',
      status: 'active',
      officialUrl: 'https://mistral.ai/news/mixtral-of-experts/',
      apiDocsUrl: 'https://docs.mistral.ai/',
      bestFor: ['Open-source deployment', 'Cost efficiency', 'Code generation'],
      notIdealFor: ['Very long context', 'Multimodal tasks'],
    },
    {
      name: 'Mistral 7B',
      slug: 'mistral-7b',
      provider: 'Mistral AI',
      category: ModelCategory.open_source,
      description:
        'Mistral 7B is a powerful 7-billion-parameter model that outperforms Llama 2 13B on all benchmarks and Llama 1 34B on many benchmarks.',
      contextWindow: 8192,
      modelSize: '7.3B parameters',
      modalities: ['text'],
      releaseDate: new Date('2023-09-27'),
      latestVersion: 'v0.3',
      status: 'active',
      officialUrl: 'https://mistral.ai/news/announcing-mistral-7b/',
      apiDocsUrl: 'https://docs.mistral.ai/',
      bestFor: ['Open-source projects', 'Edge deployment', 'Fine-tuning'],
      notIdealFor: ['Complex reasoning', 'Very long context'],
    },

    // Cohere Models
    {
      name: 'Command R+',
      slug: 'command-r-plus',
      provider: 'Cohere',
      category: ModelCategory.commercial,
      description:
        'Command R+ is Cohere\'s most powerful model optimized for RAG and tool use, with 128K context and multilingual capabilities.',
      contextWindow: 128000,
      modelSize: '104B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-04-04'),
      latestVersion: 'command-r-plus-08-2024',
      status: 'active',
      pricingInput: 0.003,
      pricingOutput: 0.015,
      officialUrl: 'https://cohere.com/models/command-r-plus',
      apiDocsUrl: 'https://docs.cohere.com/',
      bestFor: ['RAG applications', 'Tool use', 'Enterprise search'],
      notIdealFor: ['Simple chat', 'Budget projects'],
    },
    {
      name: 'Command R',
      slug: 'command-r',
      provider: 'Cohere',
      category: ModelCategory.commercial,
      description:
        'Command R is a scalable model optimized for RAG and tool use in production environments, balancing performance and cost.',
      contextWindow: 128000,
      modelSize: '35B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-03-11'),
      latestVersion: 'command-r-08-2024',
      status: 'active',
      pricingInput: 0.00015,
      pricingOutput: 0.0006,
      officialUrl: 'https://cohere.com/models/command-r',
      apiDocsUrl: 'https://docs.cohere.com/',
      bestFor: ['RAG applications', 'High-volume deployments', 'Cost efficiency'],
      notIdealFor: ['Most complex reasoning'],
    },

    // xAI Models
    {
      name: 'Grok 2',
      slug: 'grok-2',
      provider: 'xAI',
      category: ModelCategory.commercial,
      description:
        'Grok 2 is xAI\'s advanced conversational AI with real-time knowledge and unfiltered responses, integrated with X (Twitter) platform.',
      contextWindow: 32768,
      modelSize: 'Undisclosed',
      modalities: ['text'],
      releaseDate: new Date('2024-08-13'),
      latestVersion: 'grok-2-20240813',
      status: 'active',
      officialUrl: 'https://x.ai/',
      apiDocsUrl: 'https://docs.x.ai/',
      bestFor: ['Real-time information', 'Conversational AI', 'X platform integration'],
      notIdealFor: ['Filtered content needs', 'Long context'],
    },

    // Amazon Models
    {
      name: 'Amazon Titan Text G1 - Express',
      slug: 'amazon-titan-text-g1-express',
      provider: 'Amazon',
      category: ModelCategory.commercial,
      description:
        'Amazon Titan Text G1 Express is optimized for English text generation tasks with a focus on speed and cost-effectiveness.',
      contextWindow: 8192,
      modelSize: 'Undisclosed',
      modalities: ['text'],
      releaseDate: new Date('2023-09-28'),
      latestVersion: 'v1',
      status: 'active',
      pricingInput: 0.0002,
      pricingOutput: 0.0006,
      officialUrl: 'https://aws.amazon.com/bedrock/titan/',
      apiDocsUrl: 'https://docs.aws.amazon.com/bedrock/',
      bestFor: ['AWS integration', 'RAG applications', 'Cost-effective tasks'],
      notIdealFor: ['Complex reasoning', 'Multilingual tasks'],
    },

    // Alibaba Models
    {
      name: 'Qwen 2.5 72B',
      slug: 'qwen-2-5-72b',
      provider: 'Alibaba',
      category: ModelCategory.open_source,
      description:
        'Qwen 2.5 72B is Alibaba\'s latest open-source model with strong multilingual capabilities and excellent performance on coding tasks.',
      contextWindow: 131072,
      modelSize: '72B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-09-19'),
      latestVersion: '2.5',
      status: 'active',
      officialUrl: 'https://qwenlm.github.io/',
      apiDocsUrl: 'https://github.com/QwenLM/Qwen2.5',
      bestFor: ['Multilingual tasks', 'Code generation', 'Long context'],
      notIdealFor: ['Multimodal tasks', 'Resource-constrained environments'],
    },

    // DeepSeek Models
    {
      name: 'DeepSeek Coder V2',
      slug: 'deepseek-coder-v2',
      provider: 'DeepSeek',
      category: ModelCategory.open_source,
      description:
        'DeepSeek Coder V2 is a powerful open-source code generation model with 236B parameters, excelling at programming tasks.',
      contextWindow: 163840,
      modelSize: '236B total (21B active)',
      modalities: ['text'],
      releaseDate: new Date('2024-06-17'),
      latestVersion: 'v2',
      status: 'active',
      officialUrl: 'https://github.com/deepseek-ai/DeepSeek-Coder-V2',
      apiDocsUrl: 'https://github.com/deepseek-ai/DeepSeek-Coder-V2',
      bestFor: ['Code generation', 'Code completion', 'Programming assistance'],
      notIdealFor: ['General conversation', 'Non-technical tasks'],
    },

    // Stability AI Models
    {
      name: 'Stable LM 2 12B',
      slug: 'stable-lm-2-12b',
      provider: 'Stability AI',
      category: ModelCategory.open_source,
      description:
        'Stable LM 2 12B is an efficient open-source language model trained on diverse multilingual data with strong reasoning capabilities.',
      contextWindow: 4096,
      modelSize: '12B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-01-19'),
      latestVersion: 'v2',
      status: 'active',
      officialUrl: 'https://stability.ai/stable-lm',
      apiDocsUrl: 'https://github.com/Stability-AI/StableLM',
      bestFor: ['Open-source deployment', 'Multilingual tasks', 'Fine-tuning'],
      notIdealFor: ['Very long context', 'Most complex reasoning'],
    },

    // AI21 Labs Models
    {
      name: 'Jamba 1.5 Large',
      slug: 'jamba-1-5-large',
      provider: 'AI21 Labs',
      category: ModelCategory.commercial,
      description:
        'Jamba 1.5 Large is a hybrid SSM-Transformer model with 398B parameters and 256K context window, offering excellent efficiency.',
      contextWindow: 256000,
      modelSize: '398B total (94B active)',
      modalities: ['text'],
      releaseDate: new Date('2024-08-08'),
      latestVersion: '1.5',
      status: 'active',
      pricingInput: 0.002,
      pricingOutput: 0.008,
      officialUrl: 'https://www.ai21.com/jamba',
      apiDocsUrl: 'https://docs.ai21.com/',
      bestFor: ['Long documents', 'Efficient processing', 'Enterprise applications'],
      notIdealFor: ['Simple queries', 'Budget projects'],
    },

    // 01.AI Models
    {
      name: 'Yi-Large',
      slug: 'yi-large',
      provider: '01.AI',
      category: ModelCategory.commercial,
      description:
        'Yi-Large is a bilingual (Chinese-English) model with strong reasoning and code generation capabilities, competing with GPT-4.',
      contextWindow: 32768,
      modelSize: 'Undisclosed',
      modalities: ['text'],
      releaseDate: new Date('2024-05-13'),
      latestVersion: 'yi-large',
      status: 'active',
      pricingInput: 0.003,
      pricingOutput: 0.012,
      officialUrl: 'https://www.01.ai/',
      apiDocsUrl: 'https://platform.lingyiwanwu.com/docs',
      bestFor: ['Chinese language tasks', 'Bilingual applications', 'Code generation'],
      notIdealFor: ['Other languages', 'Budget projects'],
    },

    // Perplexity Models
    {
      name: 'Perplexity Sonar Large',
      slug: 'perplexity-sonar-large',
      provider: 'Perplexity',
      category: ModelCategory.specialized,
      description:
        'Perplexity Sonar Large is optimized for online search and real-time information retrieval with citation capabilities.',
      contextWindow: 127072,
      modelSize: 'Undisclosed',
      modalities: ['text'],
      releaseDate: new Date('2024-07-30'),
      latestVersion: 'sonar-large-32k-online',
      status: 'active',
      pricingInput: 0.001,
      pricingOutput: 0.001,
      officialUrl: 'https://www.perplexity.ai/',
      apiDocsUrl: 'https://docs.perplexity.ai/',
      bestFor: ['Online search', 'Real-time information', 'Research'],
      notIdealFor: ['Offline tasks', 'Creative writing'],
    },

    // Anthropic Code Models
    {
      name: 'Claude 3 Opus with Artifacts',
      slug: 'claude-3-opus-artifacts',
      provider: 'Anthropic',
      category: ModelCategory.specialized,
      description:
        'Claude 3 Opus with Artifacts specializes in generating interactive code artifacts and visualizations within conversations.',
      contextWindow: 200000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image', 'code'],
      releaseDate: new Date('2024-06-27'),
      latestVersion: 'claude-3-opus-20240229',
      status: 'active',
      pricingInput: 0.015,
      pricingOutput: 0.075,
      officialUrl: 'https://www.anthropic.com/news/artifacts',
      apiDocsUrl: 'https://docs.anthropic.com/',
      bestFor: ['Interactive coding', 'Data visualization', 'Rapid prototyping'],
      notIdealFor: ['Simple text generation', 'Budget projects'],
    },

    // Microsoft Models
    {
      name: 'Phi-3 Medium',
      slug: 'phi-3-medium',
      provider: 'Microsoft',
      category: ModelCategory.open_source,
      description:
        'Phi-3 Medium is a 14B parameter model from Microsoft that punches above its weight, rivaling much larger models in performance.',
      contextWindow: 128000,
      modelSize: '14B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-05-21'),
      latestVersion: 'phi-3-medium-128k',
      status: 'active',
      officialUrl: 'https://azure.microsoft.com/en-us/products/phi-3',
      apiDocsUrl: 'https://huggingface.co/microsoft/Phi-3-medium-128k-instruct',
      bestFor: ['Edge deployment', 'Mobile devices', 'Resource efficiency'],
      notIdealFor: ['Most complex tasks', 'Very long documents'],
    },

    // Inflection AI Models
    {
      name: 'Inflection-2.5',
      slug: 'inflection-2-5',
      provider: 'Inflection AI',
      category: ModelCategory.commercial,
      description:
        'Inflection-2.5 powers Pi, a personal AI assistant with empathetic conversational abilities and real-time knowledge.',
      contextWindow: 32768,
      modelSize: 'Undisclosed',
      modalities: ['text'],
      releaseDate: new Date('2024-03-07'),
      latestVersion: 'inflection-2.5',
      status: 'active',
      officialUrl: 'https://inflection.ai/inflection-2-5',
      apiDocsUrl: 'https://docs.inflection.ai/',
      bestFor: ['Empathetic conversations', 'Personal assistance', 'Mental wellness'],
      notIdealFor: ['Technical tasks', 'Code generation'],
    },

    // Additional Open Source Models
    {
      name: 'Falcon 180B',
      slug: 'falcon-180b',
      provider: 'TII',
      category: ModelCategory.open_source,
      description:
        'Falcon 180B is one of the largest open-source models, trained on 3.5 trillion tokens with strong performance across benchmarks.',
      contextWindow: 2048,
      modelSize: '180B parameters',
      modalities: ['text'],
      releaseDate: new Date('2023-09-06'),
      latestVersion: 'v1',
      status: 'active',
      officialUrl: 'https://falconllm.tii.ae/',
      apiDocsUrl: 'https://huggingface.co/tiiuae/falcon-180B',
      bestFor: ['Self-hosting', 'Research', 'Open-source projects'],
      notIdealFor: ['Resource-constrained environments', 'Long context'],
    },
    {
      name: 'Vicuna 33B',
      slug: 'vicuna-33b',
      provider: 'LMSYS',
      category: ModelCategory.open_source,
      description:
        'Vicuna 33B is an open-source chatbot trained by fine-tuning Llama, achieving over 90% quality of ChatGPT.',
      contextWindow: 2048,
      modelSize: '33B parameters',
      modalities: ['text'],
      releaseDate: new Date('2023-03-30'),
      latestVersion: 'v1.5',
      status: 'active',
      officialUrl: 'https://lmsys.org/blog/2023-03-30-vicuna/',
      apiDocsUrl: 'https://github.com/lm-sys/FastChat',
      bestFor: ['Open-source chatbots', 'Fine-tuning', 'Research'],
      notIdealFor: ['Production at scale', 'Complex reasoning'],
    },
    {
      name: 'MPT-30B',
      slug: 'mpt-30b',
      provider: 'MosaicML',
      category: ModelCategory.open_source,
      description:
        'MPT-30B is an open-source model with long context support (8K tokens) and commercial-friendly licensing.',
      contextWindow: 8192,
      modelSize: '30B parameters',
      modalities: ['text'],
      releaseDate: new Date('2023-06-22'),
      latestVersion: 'mpt-30b',
      status: 'active',
      officialUrl: 'https://www.mosaicml.com/blog/mpt-30b',
      apiDocsUrl: 'https://github.com/mosaicml/llm-foundry',
      bestFor: ['Commercial use', 'Long context', 'Fine-tuning'],
      notIdealFor: ['State-of-the-art performance', 'Multimodal tasks'],
    },

    // Specialized Domain Models
    {
      name: 'Med-PaLM 2',
      slug: 'med-palm-2',
      provider: 'Google',
      category: ModelCategory.specialized,
      description:
        'Med-PaLM 2 is specialized for medical question answering and healthcare applications, achieving expert-level performance.',
      contextWindow: 8192,
      modelSize: 'Undisclosed',
      modalities: ['text'],
      releaseDate: new Date('2023-05-16'),
      latestVersion: 'v2',
      status: 'active',
      officialUrl: 'https://sites.research.google/med-palm/',
      apiDocsUrl: 'https://cloud.google.com/vertex-ai',
      bestFor: ['Medical Q&A', 'Healthcare applications', 'Clinical research'],
      notIdealFor: ['General purpose tasks', 'Non-medical domains'],
    },
    {
      name: 'BioGPT',
      slug: 'biogpt',
      provider: 'Microsoft',
      category: ModelCategory.specialized,
      description:
        'BioGPT is a domain-specific model pre-trained on biomedical literature, excelling at biomedical text generation and question answering.',
      contextWindow: 1024,
      modelSize: '1.5B parameters',
      modalities: ['text'],
      releaseDate: new Date('2022-09-30'),
      latestVersion: 'v1',
      status: 'active',
      officialUrl: 'https://github.com/microsoft/BioGPT',
      apiDocsUrl: 'https://github.com/microsoft/BioGPT',
      bestFor: ['Biomedical research', 'Scientific literature', 'Healthcare NLP'],
      notIdealFor: ['General conversation', 'Non-scientific domains'],
    },

    // Code-Specialized Models
    {
      name: 'CodeLlama 70B',
      slug: 'codellama-70b',
      provider: 'Meta',
      category: ModelCategory.open_source,
      description:
        'CodeLlama 70B is Meta\'s largest code-specialized model, supporting code generation in multiple programming languages.',
      contextWindow: 100000,
      modelSize: '70B parameters',
      modalities: ['text', 'code'],
      releaseDate: new Date('2023-08-24'),
      latestVersion: 'v2',
      status: 'active',
      officialUrl: 'https://ai.meta.com/blog/code-llama-large-language-model-coding/',
      apiDocsUrl: 'https://github.com/facebookresearch/codellama',
      bestFor: ['Code generation', 'Code completion', 'Programming assistance'],
      notIdealFor: ['General conversation', 'Non-technical tasks'],
    },
    {
      name: 'StarCoder 2',
      slug: 'starcoder-2',
      provider: 'Hugging Face',
      category: ModelCategory.open_source,
      description:
        'StarCoder 2 is a transparent and permissive code model trained on 600+ programming languages and The Stack v2 dataset.',
      contextWindow: 16384,
      modelSize: '15B parameters',
      modalities: ['text', 'code'],
      releaseDate: new Date('2024-02-28'),
      latestVersion: 'v2',
      status: 'active',
      officialUrl: 'https://huggingface.co/bigcode/starcoder2-15b',
      apiDocsUrl: 'https://github.com/bigcode-project/starcoder2',
      bestFor: ['Code generation', 'Multi-language support', 'Open development'],
      notIdealFor: ['General text tasks', 'Conversational AI'],
    },

    // Multimodal Specialized Models
    {
      name: 'LLaVA 1.6',
      slug: 'llava-1-6',
      provider: 'UW Madison',
      category: ModelCategory.open_source,
      description:
        'LLaVA 1.6 (Large Language and Vision Assistant) is an open-source multimodal model excelling at visual understanding and reasoning.',
      contextWindow: 4096,
      modelSize: '34B parameters',
      modalities: ['text', 'image'],
      releaseDate: new Date('2024-01-30'),
      latestVersion: 'v1.6',
      status: 'active',
      officialUrl: 'https://llava-vl.github.io/',
      apiDocsUrl: 'https://github.com/haotian-liu/LLaVA',
      bestFor: ['Visual question answering', 'Image understanding', 'Research'],
      notIdealFor: ['Text-only tasks', 'Production at scale'],
    },
    {
      name: 'Fuyu-8B',
      slug: 'fuyu-8b',
      provider: 'Adept',
      category: ModelCategory.open_source,
      description:
        'Fuyu-8B is a multimodal architecture optimized for digital agents, directly processing images without separate encoders.',
      contextWindow: 16384,
      modelSize: '8B parameters',
      modalities: ['text', 'image'],
      releaseDate: new Date('2023-10-17'),
      latestVersion: 'v1',
      status: 'active',
      officialUrl: 'https://www.adept.ai/blog/fuyu-8b',
      apiDocsUrl: 'https://huggingface.co/adept/fuyu-8b',
      bestFor: ['UI understanding', 'Digital agents', 'Visual reasoning'],
      notIdealFor: ['Text-only tasks', 'General conversation'],
    },

    // Emerging and Experimental Models
    {
      name: 'Command R7B',
      slug: 'command-r7b',
      provider: 'Cohere',
      category: ModelCategory.open_source,
      description:
        'Command R7B is Cohere\'s compact open-source model optimized for tool use and RAG applications with multilingual support.',
      contextWindow: 128000,
      modelSize: '7B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-08-01'),
      latestVersion: 'command-r7b-12-2024',
      status: 'active',
      officialUrl: 'https://cohere.com/blog/command-r7b',
      apiDocsUrl: 'https://docs.cohere.com/',
      bestFor: ['RAG applications', 'Tool use', 'Multilingual tasks'],
      notIdealFor: ['Complex reasoning', 'Very long documents'],
    },
    {
      name: 'Orca 2',
      slug: 'orca-2',
      provider: 'Microsoft',
      category: ModelCategory.open_source,
      description:
        'Orca 2 is trained using Explanation Tuning, teaching the model to employ different reasoning strategies for different tasks.',
      contextWindow: 4096,
      modelSize: '13B parameters',
      modalities: ['text'],
      releaseDate: new Date('2023-11-18'),
      latestVersion: 'v2',
      status: 'active',
      officialUrl: 'https://www.microsoft.com/en-us/research/blog/orca-2/',
      apiDocsUrl: 'https://huggingface.co/microsoft/Orca-2-13b',
      bestFor: ['Reasoning tasks', 'Research', 'Educational applications'],
      notIdealFor: ['Production at scale', 'Long context'],
    },

    // Lightweight and Edge Models
    {
      name: 'Gemma 2 9B',
      slug: 'gemma-2-9b',
      provider: 'Google',
      category: ModelCategory.open_source,
      description:
        'Gemma 2 9B is Google\'s compact open model with performance rivaling much larger models, optimized for efficiency.',
      contextWindow: 8192,
      modelSize: '9B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-06-27'),
      latestVersion: 'gemma-2-9b-it',
      status: 'active',
      officialUrl: 'https://blog.google/technology/developers/gemma-2/',
      apiDocsUrl: 'https://ai.google.dev/gemma/docs',
      bestFor: ['Edge deployment', 'Fine-tuning', 'Resource efficiency'],
      notIdealFor: ['Very complex tasks', 'Long context'],
    },
    {
      name: 'TinyLlama 1.1B',
      slug: 'tinyllama-1-1b',
      provider: 'TinyLlama',
      category: ModelCategory.open_source,
      description:
        'TinyLlama 1.1B is an extremely compact model trained on 3 trillion tokens, ideal for edge devices and mobile applications.',
      contextWindow: 2048,
      modelSize: '1.1B parameters',
      modalities: ['text'],
      releaseDate: new Date('2024-01-04'),
      latestVersion: 'v1.1',
      status: 'active',
      officialUrl: 'https://github.com/jzhang38/TinyLlama',
      apiDocsUrl: 'https://github.com/jzhang38/TinyLlama',
      bestFor: ['Mobile devices', 'Edge computing', 'IoT applications'],
      notIdealFor: ['Complex reasoning', 'Long documents'],
    },

    // Additional Commercial Models
    {
      name: 'Reka Core',
      slug: 'reka-core',
      provider: 'Reka AI',
      category: ModelCategory.commercial,
      description:
        'Reka Core is a multimodal model supporting text, images, video, and audio with state-of-the-art performance across modalities.',
      contextWindow: 128000,
      modelSize: 'Undisclosed',
      modalities: ['text', 'image', 'video', 'audio'],
      releaseDate: new Date('2024-04-15'),
      latestVersion: 'reka-core-20240501',
      status: 'active',
      pricingInput: 0.001,
      pricingOutput: 0.005,
      officialUrl: 'https://www.reka.ai/',
      apiDocsUrl: 'https://docs.reka.ai/',
      bestFor: ['Multimodal understanding', 'Video analysis', 'Complex reasoning'],
      notIdealFor: ['Simple text tasks', 'Budget projects'],
    },
  ];

  // Create models with error handling
  let createdCount = 0;
  let updatedCount = 0;

  for (const modelData of models) {
    try {
      const existingModel = await prisma.lLMModel.findUnique({
        where: { slug: modelData.slug },
      });

      if (existingModel) {
        await prisma.lLMModel.update({
          where: { slug: modelData.slug },
          data: modelData,
        });
        updatedCount++;
        console.log(`✅ Updated model: ${modelData.name}`);
      } else {
        await prisma.lLMModel.create({
          data: modelData,
        });
        createdCount++;
        console.log(`✅ Created model: ${modelData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing model ${modelData.name}:`, error);
    }
  }

  console.log(
    `\n🎉 LLM Models seeding complete: ${createdCount} created, ${updatedCount} updated`
  );
  console.log(`📊 Total models in database: ${createdCount + updatedCount}`);
}

export default seedLLMModels;

// Allow running directly
if (require.main === module) {
  seedLLMModels()
    .catch((e) => {
      console.error('❌ Error seeding LLM models:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
