import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card/Card';
import { Input } from '@/components/common/Input/Input';
import { SEO } from '@/components/common/SEO';

/**
 * NotFoundPage Component
 *
 * 404 error page with search functionality and navigation links
 * Helps users find their way when they land on a non-existent page
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const popularLinks = [
    { title: 'News & Articles', path: '/news', description: 'Latest LLM news and insights' },
    { title: 'Forum Discussions', path: '/forum', description: 'Community discussions and Q&A' },
    { title: 'Job Listings', path: '/jobs', description: 'Find your next LLM opportunity' },
    { title: 'Model Tracker', path: '/models', description: 'Compare 47+ LLM models' },
    { title: 'LLM Glossary', path: '/guide/glossary', description: 'Learn LLM terminology' },
    { title: 'Prompt Library', path: '/forum/prompts', description: 'Browse community prompts' },
  ];

  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you are looking for could not be found. Use our search to find what you need or explore popular sections."
        noindex={true}
      />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="max-w-4xl w-full space-y-8">
          {/* Error illustration */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
              <FileQuestion className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Sorry, the page you are looking for doesn't exist or has been moved.
              Try searching for what you need below.
            </p>
          </div>

          {/* Search form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Neurmatic
              </CardTitle>
              <CardDescription>
                Search for articles, forum topics, jobs, or models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={!searchQuery.trim()}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button asChild variant="default">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
          </div>

          {/* Popular sections */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Or explore popular sections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {link.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Help text */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Still having trouble? {' '}
              <Link to="/contact" className="text-primary-600 dark:text-primary-400 hover:underline">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
