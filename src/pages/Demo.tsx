import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ArrowRight, Upload, Brain, MessageSquare, FileText, CheckCircle2, ChevronRight, Sparkles, Shield, Clock, Zap, Star, Award, Users, Heart, ChevronDown, Lock, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { useScroll, useTransform } from 'framer-motion';

const steps = [
  {
    title: 'Upload Medical Report',
    description: 'Start by uploading your medical report in PDF or image format',
    icon: Upload,
    color: 'blue',
    features: ['Drag & drop support', 'Multiple file formats', 'Secure upload']
  },
  {
    title: 'AI Analysis',
    description: 'Our AI analyzes your report and extracts key information',
    icon: Brain,
    color: 'purple',
    features: ['Real-time processing', 'Smart data extraction', 'Accuracy checks']
  },
  {
    title: 'Interactive Chat',
    description: 'Ask questions and get detailed explanations about your report',
    icon: MessageSquare,
    color: 'green',
    features: ['Natural language queries', 'Context-aware responses', '24/7 availability']
  },
  {
    title: 'Detailed Summary',
    description: 'Receive a comprehensive summary of your medical report',
    icon: FileText,
    color: 'orange',
    features: ['Structured overview', 'Key findings', 'Actionable insights']
  }
];

const features = [
  {
    title: 'Instant Analysis',
    description: 'Get immediate insights from your medical reports',
    icon: Zap,
    color: 'yellow'
  },
  {
    title: 'Smart Explanations',
    description: 'Understand complex medical terms in simple language',
    icon: Brain,
    color: 'purple'
  },
  {
    title: '24/7 Access',
    description: 'Access your reports and get answers anytime, anywhere',
    icon: Clock,
    color: 'blue'
  },
  {
    title: 'Secure & Private',
    description: 'Your medical data is encrypted and protected',
    icon: Shield,
    color: 'green'
  }
];

const stats = [
  {
    label: 'Active Users',
    value: '10K+',
    icon: Users,
    color: 'blue'
  },
  {
    label: 'Reports Analyzed',
    value: '10K+',
    icon: FileText,
    color: 'purple'
  },
  {
    label: 'Accuracy Rate',
    value: '99.9%',
    icon: Award,
    color: 'yellow'
  },
  {
    label: 'Customer Satisfaction',
    value: '98%',
    icon: Heart,
    color: 'red'
  }
];

const testimonials = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Cardiologist',
    text: 'AIDoc has revolutionized how I analyze patient reports. The AI insights are incredibly accurate.',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    rating: 5
  },
  {
    name: 'Dr. Michael Chen',
    role: 'General Practitioner',
    text: 'The interactive chat feature helps me explain complex medical terms to patients easily.',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    rating: 5
  },
  {
    name: 'Dr. Emily Rodriguez',
    role: 'Pediatrician',
    text: 'The instant analysis feature saves me hours of report review time. Highly recommended!',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    rating: 5
  }
];

const benefits = [
  {
    title: 'Time-Saving',
    description: 'Reduce report analysis time by up to 80%',
    icon: Clock,
    color: 'blue',
    stats: '80% faster'
  },
  {
    title: 'Accuracy',
    description: 'AI-powered analysis with human verification',
    icon: Award,
    color: 'purple',
    stats: '99.9% accurate'
  },
  {
    title: 'Security',
    description: 'HIPAA-compliant data protection',
    icon: Lock,
    color: 'green',
    stats: 'HIPAA compliant'
  },
  {
    title: 'Global Access',
    description: 'Access from anywhere, anytime',
    icon: Globe,
    color: 'orange',
    stats: '24/7 available'
  }
];

const integrations = [
  {
    name: 'Electronic Health Records',
    description: 'Seamlessly integrate with major EHR systems',
    icon: FileText,
    color: 'blue'
  },
  {
    name: 'Medical Devices',
    description: 'Connect with popular medical devices',
    icon: Zap,
    color: 'purple'
  },
  {
    name: 'Lab Systems',
    description: 'Direct integration with lab reporting systems',
    icon: CheckCircle2,
    color: 'green'
  }
];

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const controls = useAnimation();
  const [showBenefits, setShowBenefits] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUploadClick = () => {
    controls.start({ scale: [1, 1.1, 1] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Interactive Demo</span>
            </motion.div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
              Experience AIDoc in Action
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Watch how our AI-powered platform transforms medical report analysis
            </p>
          </motion.div>
        </div>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setHoveredStat(index)}
                onHoverEnd={() => setHoveredStat(null)}
                className="relative group"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center mb-4`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </div>
                  {hoveredStat === index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Why Choose AIDoc?
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Experience the future of medical report analysis
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg bg-${benefit.color}-100 dark:bg-${benefit.color}-900/30 flex items-center justify-center mb-4`}>
                  <benefit.icon className={`w-6 h-6 text-${benefit.color}-600 dark:text-${benefit.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {benefit.description}
                </p>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {benefit.stats}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Steps Display */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  How It Works
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: index === currentStep ? 1 : 0.5,
                      x: 0,
                      scale: index === currentStep ? 1.05 : 1,
                    }}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                      index === currentStep
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${step.color}-100 dark:bg-${step.color}-900/30`}>
                        <step.icon className={`w-6 h-6 text-${step.color}-600 dark:text-${step.color}-400`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-gray-600 dark:text-gray-300">
                          {step.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {step.features.map((feature) => (
                            <span
                              key={feature}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Interactive Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/20 dark:to-purple-400/20 blur-3xl rounded-full" />
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                        <motion.div animate={controls}>
                          <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        </motion.div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">
                          Drag and drop your medical report here
                        </p>
                        <Button className="mt-4" onClick={handleUploadClick}>
                          Browse Files
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                          />
                        </div>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                          Analyzing your medical report...
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {['Extracting data', 'Processing results', 'Generating insights', 'Finalizing report'].map((step, index) => (
                            <motion.div
                              key={step}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.2 }}
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              {step}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-4 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                              <p className="text-gray-800 dark:text-gray-200">
                                Hello! I've analyzed your medical report. How can I help you understand it better?
                              </p>
                            </div>
                          </div>
                          {showChat && (
                            <div className="flex items-start gap-3 justify-end">
                              <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                                <p className="text-gray-800 dark:text-gray-200">
                                  Can you explain my blood test results?
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Ask a question..."
                              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button onClick={() => setShowChat(true)}>Send</Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Report Summary
                        </h3>
                        <div className="space-y-3">
                          {features.map((feature, index) => (
                            <motion.div
                              key={feature.title}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center gap-3"
                            >
                              <feature.icon className={`w-5 h-5 text-${feature.color}-500`} />
                              <span className="text-gray-600 dark:text-gray-300">
                                {feature.title}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Seamless Integrations
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Connect with your existing healthcare systems
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg bg-${integration.color}-100 dark:bg-${integration.color}-900/30 flex items-center justify-center mb-4`}>
                  <integration.icon className={`w-6 h-6 text-${integration.color}-600 dark:text-${integration.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {integration.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {integration.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              What Healthcare Professionals Say
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Trusted by doctors and medical institutions worldwide
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {testimonial.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
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
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" variant="secondary" className="group bg-white hover:bg-gray-50 text-blue-600">
              <Link to="/signup">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10">
              <Link to="/contact">
                Contact Sales
              </Link>
            </Button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-sm text-blue-100"
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.p>
        </div>
      </section>
    </div>
  );
} 