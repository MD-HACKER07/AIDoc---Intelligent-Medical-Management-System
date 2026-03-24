import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Search, MessageSquare, Download, Shield, Book, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';

const Docs = () => {
  const sections = [
    {
      title: "Getting Started",
      icon: Book,
      content: [
        "Create an account or log in",
        "Complete your profile information",
        "Upload your first medical report",
        "Get instant AI-powered analysis"
      ]
    },
    {
      title: "Uploading Reports",
      icon: Upload,
      content: [
        "Supported formats: PDF, JPG, PNG",
        "Maximum file size: 10MB",
        "Clear, readable scans recommended",
        "Multiple page support"
      ]
    },
    {
      title: "Understanding Analysis",
      icon: Search,
      content: [
        "AI-powered medical terminology translation",
        "Key findings highlighted",
        "Risk factors identified",
        "Recommended actions suggested"
      ]
    },
    {
      title: "Chat Support",
      icon: MessageSquare,
      content: [
        "24/7 AI chat assistance",
        "Medical term clarification",
        "Follow-up questions",
        "Expert consultation requests"
      ]
    },
    {
      title: "Downloading Results",
      icon: Download,
      content: [
        "Export analysis as PDF",
        "Save chat transcripts",
        "Download medical summaries",
        "Share with healthcare providers"
      ]
    },
    {
      title: "Privacy & Security",
      icon: Shield,
      content: [
        "End-to-end encryption",
        "HIPAA compliant",
        "Secure data storage",
        "Privacy controls"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Documentation
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Learn how to use AIDoc effectively for your medical report analysis
          </p>
        </motion.div>

        {/* Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Start Guide
          </h2>
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4].map((step) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + step * 0.1 }}
                className="flex items-center"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold">
                  {step}
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-2" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-shadow"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-600/20 dark:group-hover:bg-blue-500/20 transition-colors" />

              <div className="relative">
                <section.icon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center text-gray-600 dark:text-gray-300"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mr-2" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Need More Help?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our support team is available 24/7 to assist you with any questions
          </p>
          <button
            onClick={() => window.location.href = '/contact'}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Contact Support
          </button>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Docs; 