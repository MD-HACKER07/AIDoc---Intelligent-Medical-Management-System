import { motion } from 'framer-motion';
import { Upload, Cpu, FileText, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Report',
    description: 'Simply upload your medical report in any format'
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    description: 'Our AI processes and analyzes your report'
  },
  {
    icon: FileText,
    title: 'Get Insights',
    description: 'Receive detailed insights and explanations'
  },
  {
    icon: CheckCircle,
    title: 'Take Action',
    description: 'Make informed decisions about your health'
  }
];

export const HowItWorks = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-200 dark:bg-blue-900 -translate-y-1/2 hidden md:block" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center"
            >
              <div className="relative z-10 bg-white dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border-2 border-blue-500">
                <step.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}; 