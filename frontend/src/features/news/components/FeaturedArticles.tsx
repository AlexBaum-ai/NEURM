import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Eye } from 'lucide-react';
import type { ArticleListItem } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface FeaturedArticlesProps {
  articles: ArticleListItem[];
}

const difficultyColors = {
  BEGINNER: 'bg-green-500 text-white',
  INTERMEDIATE: 'bg-blue-500 text-white',
  ADVANCED: 'bg-orange-500 text-white',
  EXPERT: 'bg-red-500 text-white',
};

export const FeaturedArticles: React.FC<FeaturedArticlesProps> = ({ articles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!articles || articles.length === 0) {
    return null;
  }

  const currentArticle = articles[currentIndex];
  const timeAgo = formatDistanceToNow(new Date(currentArticle.publishedAt), { addSuffix: true });

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === articles.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl overflow-hidden shadow-lg mb-8">
      <div className="relative h-[500px] md:h-[400px]">
        {/* Background Image with Overlay */}
        {currentArticle.featuredImageUrl && (
          <div className="absolute inset-0">
            <img
              src={currentArticle.featuredImageUrl}
              alt={currentArticle.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
          </div>
        )}

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
          <div className="max-w-3xl">
            {/* Category and Difficulty */}
            <div className="flex items-center gap-3 mb-4">
              <Link
                to={`/news?category=${currentArticle.category.slug}`}
                className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                {currentArticle.category.name}
              </Link>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${difficultyColors[currentArticle.difficulty]}`}>
                {currentArticle.difficulty}
              </span>
            </div>

            {/* Title */}
            <Link to={`/news/${currentArticle.slug}`}>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 hover:text-primary-300 transition-colors line-clamp-2">
                {currentArticle.title}
              </h2>
            </Link>

            {/* Summary */}
            <p className="text-lg text-gray-200 mb-6 line-clamp-2">
              {currentArticle.summary}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <Link
                to={`/profile/${currentArticle.author.username}`}
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                {currentArticle.author.profile.avatarUrl ? (
                  <img
                    src={currentArticle.author.profile.avatarUrl}
                    alt={currentArticle.author.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                    {currentArticle.author.username[0].toUpperCase()}
                  </div>
                )}
                <span className="font-medium">
                  {currentArticle.author.profile.displayName || currentArticle.author.username}
                </span>
              </Link>

              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {currentArticle.readingTimeMinutes}m read
              </span>

              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {currentArticle.viewCount} views
              </span>

              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {articles.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all text-white"
              aria-label="Previous article"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all text-white"
              aria-label="Next article"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {articles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    w-2 h-2 rounded-full transition-all
                    ${index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70'}
                  `}
                  aria-label={`Go to article ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedArticles;
