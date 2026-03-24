import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { HeroIllustration } from '../components/HeroIllustration';
import { HeroStats } from '../components/HeroStats';
import { FeaturesSection } from '../components/FeaturesSection';
import { TeamSection } from '../components/TeamSection';
import { HowItWorks } from '../components/HowItWorks';
import { TestimonialSection } from '../components/TestimonialSection';
import { SectionHeader } from '../components/SectionHeader';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-24 sm:pb-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">AI-Powered Healthcare</span>
              </motion.div>
              
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl leading-tight">
                Transform Your Medical Report Analysis with{' '}
                <span className="text-blue-600 dark:text-blue-400">AI</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0">
                Get instant, accurate analysis of your medical reports. Our AI technology helps you understand your health data better.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="group bg-blue-600 hover:bg-blue-700 text-white">
                  <Link to="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2">
                  <Link to="/demo">See Demo</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/20 dark:to-purple-400/20 blur-3xl rounded-full" />
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-800" />
        <HeroStats />
      </div>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <SectionHeader
          title="Why Choose AIDoc?"
          subtitle="Experience the future of medical report analysis with our cutting-edge features"
        />
        <FeaturesSection />
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <SectionHeader
          title="How It Works"
          subtitle="Simple steps to get started with AIDoc"
        />
        <HowItWorks />
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <SectionHeader
          title="Meet Our Team"
          subtitle="The talented individuals behind AIDoc"
        />
        <TeamSection />
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <SectionHeader
          title="What Our Users Say"
          subtitle="Trusted by healthcare professionals worldwide"
        />
        <TestimonialSection />
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white sm:text-4xl mb-6"
          >
            Ready to Transform Your Medical Report Analysis?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of healthcare professionals who trust AIDoc for accurate and instant medical report analysis.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Button asChild size="lg" variant="secondary" className="group bg-white hover:bg-gray-50 text-blue-600">
              <Link to="/signup">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Diagnostic Section */}
      <DiagnosticSection />
    </div>
  );
}

// Add a diagnostic section at the bottom that's only visible in development mode
const DiagnosticSection = () => {
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300">
      <h2 className="text-lg font-semibold mb-2 text-gray-700">Development Diagnostics</h2>
      <p className="text-sm text-gray-600 mb-4">
        These links are only visible in development mode and can help diagnose issues with the application.
      </p>
      <div className="flex space-x-4">
        <a 
          href="/?mode=diagnostic" 
          className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
        >
          Diagnostic Mode
        </a>
        <a 
          href="/?mode=direct-patient" 
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Direct Patient Mode
        </a>
        <a 
          href="/diagnostic" 
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Diagnostic Page
        </a>
      </div>
    </div>
  );
};