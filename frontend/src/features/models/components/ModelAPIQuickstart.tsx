import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import type { Model } from '../types';

interface ModelAPIQuickstartProps {
  model: Model;
}

type Language = 'python' | 'javascript' | 'curl';

const getCodeSample = (model: Model, language: Language): string => {
  const endpoint = model.apiEndpoint || 'https://api.example.com/v1/chat/completions';

  switch (language) {
    case 'python':
      return `import openai

client = openai.OpenAI(api_key="your-api-key")

response = client.chat.completions.create(
    model="${model.name}",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ],
    max_tokens=${model.specs.maxOutputTokens || 1000}
)

print(response.choices[0].message.content)`;

    case 'javascript':
      return `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key',
});

const response = await client.chat.completions.create({
  model: '${model.name}',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  max_tokens: ${model.specs.maxOutputTokens || 1000}
});

console.log(response.choices[0].message.content);`;

    case 'curl':
      return `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "${model.name}",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "max_tokens": ${model.specs.maxOutputTokens || 1000}
  }'`;

    default:
      return '';
  }
};

export const ModelAPIQuickstart: React.FC<ModelAPIQuickstartProps> = ({ model }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('python');
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const code = getCodeSample(model, selectedLanguage);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages: { value: Language; label: string }[] = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'curl', label: 'cURL' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>API Quickstart</CardTitle>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => setSelectedLanguage(lang.value)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedLanguage === lang.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <SyntaxHighlighter
            language={selectedLanguage === 'curl' ? 'bash' : selectedLanguage}
            style={isDark ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              padding: '1rem',
            }}
            showLineNumbers
          >
            {code}
          </SyntaxHighlighter>
          <Button
            onClick={handleCopy}
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 bg-white dark:bg-gray-800"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </Button>
        </div>
        {model.documentationUrl && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href={model.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              View full API documentation →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelAPIQuickstart;
