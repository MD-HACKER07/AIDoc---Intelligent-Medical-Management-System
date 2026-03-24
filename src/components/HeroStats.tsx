import { motion } from 'framer-motion';
import { Users, FileCheck, Award, Building2 } from 'lucide-react';

const stats = [
  { icon: Users, value: '10K+', label: 'Active Users' },
  { icon: FileCheck, value: '50K+', label: 'Reports Analyzed' },
  { icon: Award, value: '99%', label: 'Accuracy Rate' },
  { icon: Building2, value: '100+', label: 'Partner Hospitals' }
];

export const HeroStats = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {/* Background accent */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-600/20 dark:group-hover:bg-blue-500/20 transition-colors" />
            
            <div className="relative">
              <div className="w-12 h-12 mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 