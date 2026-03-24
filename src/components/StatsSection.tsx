import { motion } from 'framer-motion';
import { Users, Brain, Clock, Star } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '10K+',
    label: 'Active Users',
    description: 'Trusted by thousands globally'
  },
  {
    icon: Brain,
    value: '98%',
    label: 'Accuracy',
    description: 'In medical report analysis'
  },
  {
    icon: Clock,
    value: '24/7',
    label: 'Support',
    description: 'Round the clock assistance'
  },
  {
    icon: Star,
    value: '4.9',
    label: 'Rating',
    description: 'Based on 5000+ reviews'
  }
];

export const StatsSection = () => {
  return (
    <div className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-blue-500/10 dark:bg-blue-400/10 rounded-full" />
              <stat.icon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {stat.label}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}; 