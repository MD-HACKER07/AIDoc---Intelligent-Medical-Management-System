import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import Footer from '../../components/Footer';

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 dark:text-blue-400 mb-8 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Go Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose dark:prose-invert max-w-none"
        >
          <h1>Refund Policy</h1>
          
          <p className="lead">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2>1. Refund Eligibility</h2>
          <p>
            We offer refunds under the following circumstances:
          </p>
          <ul>
            <li>Service unavailability exceeding 24 hours</li>
            <li>Technical issues preventing service usage</li>
            <li>Billing errors or unauthorized charges</li>
            <li>Cancellation within 7 days of subscription (cooling-off period)</li>
          </ul>

          <h2>2. Refund Process</h2>
          <p>
            To request a refund:
          </p>
          <ol>
            <li>Contact our support team through the contact form</li>
            <li>Provide your account details and reason for refund</li>
            <li>Include any relevant documentation or screenshots</li>
            <li>Allow up to 5-7 business days for processing</li>
          </ol>

          <h2>3. Non-Refundable Items</h2>
          <p>
            The following are not eligible for refunds:
          </p>
          <ul>
            <li>Partially used subscription periods</li>
            <li>Services already rendered</li>
            <li>Cases of terms of service violations</li>
          </ul>

          <h2>4. Refund Method</h2>
          <p>
            Refunds will be processed to the original payment method used for the purchase. Processing time may vary depending on your payment provider.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have any questions about our refund policy, please contact us:
          </p>
          <ul>
            <li>Through our contact form</li>
            <li>Email: support@aidoc.com</li>
            <li>Phone: +91 XXXXXXXXXX</li>
          </ul>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Note: This refund policy is subject to change. Users will be notified of any changes through our website or email.
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundPolicy; 