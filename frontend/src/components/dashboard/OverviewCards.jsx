import { BookOpen, MessageSquare, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, trend, trendValue, trendLabel, color }) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const bgColors = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    teal: 'bg-teal-100 dark:bg-teal-900/30',
  };

  const iconColors = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    purple: 'text-purple-600 dark:text-purple-400',
    teal: 'text-teal-600 dark:text-teal-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${bgColors[color]}`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
        <div className="flex items-center text-sm">
          {trend === 'up' && <TrendingUp className={`w-4 h-4 ${trendColors[trend]}`} />}
          {trend === 'down' && <TrendingDown className={`w-4 h-4 ${trendColors[trend]}`} />}
          {trend === 'neutral' && <Minus className={`w-4 h-4 ${trendColors[trend]}`} />}
          <span className={`ml-1 ${trendColors[trend]}`}>
            {trendValue} {trendLabel}
          </span>
        </div>
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

const OverviewCards = ({ stats }) => {
  const cards = [
    {
      icon: BookOpen,
      title: 'Journal Entries',
      value: stats?.journalStats?.total || 0,
      trend: stats?.journalStats?.weekly > 0 ? 'up' : 'neutral',
      trendValue: stats?.journalStats?.weekly || 0,
      trendLabel: 'this week',
      color: 'indigo',
    },
    {
      icon: MessageSquare,
      title: 'Conversations',
      value: stats?.chatStats?.total || 0,
      trend: stats?.chatStats?.weekly > 0 ? 'up' : 'neutral',
      trendValue: stats?.chatStats?.weekly || 0,
      trendLabel: 'this week',
      color: 'purple',
    },
    {
      icon: Activity,
      title: 'Mood Average',
      value: stats?.moodStats?.current ? `${Math.round(stats.moodStats.current * 10) / 10}/5` : 'N/A',
      trend: stats?.moodStats?.trend > 0 ? 'up' : stats?.moodStats?.trend < 0 ? 'down' : 'neutral',
      trendValue: stats?.moodStats?.trend ? `${Math.abs(stats.moodStats.trend * 10) / 10}` : '0',
      trendLabel: 'from last week',
      color: 'teal',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
};

export default OverviewCards;
