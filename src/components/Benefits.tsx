import { motion } from 'framer-motion';
import { Clock, Lock, Zap, Heart, Sparkles, Target } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Save Time',
    description: 'Get instant analysis of your medical reports without waiting'
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description: 'Your data is encrypted and protected with enterprise-grade security'
  },
  {
    icon: Zap,
    title: 'Instant Insights',
    description: 'Understand your medical reports in simple, clear language'
  },
  {
    icon: Heart,
    title: 'Better Health Decisions',
    description: 'Make informed decisions about your healthcare journey'
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Accuracy',
    description: 'Benefit from advanced AI technology for precise analysis'
  },
  {
    icon: Target,
    title: 'Personalized Care',
    description: 'Receive tailored insights based on your medical history'
  }
];

export const Benefits = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex items-start space-x-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex-shrink-0">
              <benefit.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {benefit.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 