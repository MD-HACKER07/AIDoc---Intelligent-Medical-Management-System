import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Brain, Shield, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';

const LearnMore = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "What is AIDoc?",
      content: "AIDoc is an advanced medical report analysis platform that uses artificial intelligence to help patients and healthcare providers better understand medical reports. Our system translates complex medical terminology into easy-to-understand language while maintaining accuracy and reliability.",
      icon: Brain,
      color: "blue"
    },
    {
      title: "How It Works",
      content: "Upload your medical reports, and our AI system analyzes them instantly. You'll receive detailed explanations, key insights, and recommendations in simple language. Our platform maintains the highest standards of security and privacy throughout this process.",
      icon: Shield,
      color: "green"
    },
    {
      title: "Benefits",
      content: "• Instant analysis of medical reports\n• Easy-to-understand explanations\n• Secure and private platform\n• 24/7 expert support\n• Track health progress over time\n• Access to educational resources",
      icon: CheckCircle,
      color: "purple"
    },
    {
      title: "Who It's For",
      content: "AIDoc is designed for patients who want to better understand their medical reports, healthcare providers looking to improve patient communication, and medical institutions aiming to enhance their service delivery.",
      icon: Users,
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-24 pb-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 dark:text-blue-400 mb-8 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </motion.button>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Understanding AIDoc
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 mb-12"
          >
            Discover how we're revolutionizing medical report understanding with AI technology
          </motion.p>
        </div>
      </motion.section>

      {/* Content Sections */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative p-8 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                {/* Background accent */}
                <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-${section.color}-500/10 dark:bg-${section.color}-400/10 rounded-full blur-xl`} />

                <div className="relative">
                  <section.icon className={`w-12 h-12 text-${section.color}-500 dark:text-${section.color}-400 mb-4`} />
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-blue-600 dark:bg-blue-700"
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience AIDoc?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of users who are already benefiting from our platform
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/welcome')}
            className="px-8 py-3 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Now
          </motion.button>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default LearnMore; 