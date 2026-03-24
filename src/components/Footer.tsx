import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, Heart, ShieldCheck, FileText } from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

interface FooterProps {
  children?: ReactNode;
}

export const Footer: React.FC<FooterProps> = ({ children }) => {
  const { hospital } = useHospital();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center">
              <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                {hospital ? hospital.name : 'AIDoc'}
              </span>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Empowering hospitals and doctors with AI-assisted healthcare solutions
            </p>
            
            {hospital && (
              <div className="mt-4 space-y-2">
                {hospital.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{hospital.phone}</span>
                  </div>
                )}
                {hospital.email && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{hospital.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">For Hospitals</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/add-patient" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  Add Patient
                </Link>
              </li>
              <li>
                <Link to="/hospital-chat" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  AI Consultations
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">Legal</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/privacy-policy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-conditions" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">Resources</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/docs" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Documentation</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>Contact Support</span>
                  </div>
                </Link>
              </li>
              <li>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  <span>HIPAA Compliant</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <p className="text-gray-600 dark:text-gray-400 text-center md:text-left">
                © {currentYear} AIDoc. All rights reserved.
              </p>
              {children && <div className="ml-4">{children}</div>}
            </div>
            <div className="mt-4 md:mt-0 flex items-center text-gray-600 dark:text-gray-400">
              <span>Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>for healthcare professionals</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

