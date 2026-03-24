import React from 'react';
import { Shield, Brain, Clock, Heart, Users, Lock, FileText, MessageSquare, LineChart, BookOpen, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced machine learning algorithms analyze medical reports with high accuracy.'
  },
  {
    icon: FileText,
    title: 'Report Simplification',
    description: 'Complex medical terminology translated into easy-to-understand language.'
  },
  {
    icon: Clock,
    title: 'Instant Results',
    description: 'Get detailed analysis and explanations within seconds.'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your medical data is encrypted and protected with industry-standard security.'
  },
  {
    icon: MessageSquare,
    title: 'Expert Support',
    description: '24/7 access to medical professionals for additional clarification.'
  },
  {
    icon: LineChart,
    title: 'Progress Tracking',
    description: 'Monitor your health metrics and track improvements over time.'
  },
  {
    icon: BookOpen,
    title: 'Medical Education',
    description: 'Access comprehensive resources to better understand your health conditions.'
  },
  {
    icon: HeartPulse,
    title: 'Health Insights',
    description: 'Personalized health recommendations based on your medical history.'
  }
];

const featureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export const FeaturesSection = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg group hover:shadow-xl transition-shadow"
          >
            {/* Background accent */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-600/20 dark:group-hover:bg-blue-500/20 transition-colors" />

            <div className="relative">
              {/* Icon */}
              <div className="w-12 h-12 mb-4 text-blue-500 dark:text-blue-400">
                <feature.icon className="w-full h-full" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/20 dark:group-hover:border-blue-400/20 rounded-lg transition-colors" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
