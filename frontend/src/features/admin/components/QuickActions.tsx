import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { Link } from 'react-router-dom';
import { FileText, Flag, Users, Settings, BarChart3, Newspaper } from 'lucide-react';

const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Create Article',
      description: 'Publish new content',
      icon: <FileText className="h-5 w-5" />,
      href: '/admin/articles/new',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Review Reports',
      description: 'Moderate content',
      icon: <Flag className="h-5 w-5" />,
      href: '/admin/content',
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      title: 'Manage Users',
      description: 'User administration',
      icon: <Users className="h-5 w-5" />,
      href: '/admin/users',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Analytics',
      description: 'View detailed reports',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/admin/analytics',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Content Management',
      description: 'Manage all content',
      icon: <Newspaper className="h-5 w-5" />,
      href: '/admin/content',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      title: 'Platform Settings',
      description: 'Configure platform',
      icon: <Settings className="h-5 w-5" />,
      href: '/admin/settings',
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className={`${action.color} text-white p-4 rounded-lg transition-colors duration-200 group`}
            >
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 bg-white/20 rounded-lg">{action.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold">{action.title}</h4>
                  <p className="text-xs text-white/80 mt-0.5">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
