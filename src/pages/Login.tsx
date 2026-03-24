import { useState } from 'react';
import { Brain } from 'lucide-react';
import { auth, googleProvider } from '../config/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { useNavigate, Link, useLocation } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    (location.state as any)?.message || ''
  );

  // Get the redirect path from location state, default to /welcome
  const from = (location.state as any)?.from?.pathname || '/welcome';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to the page user tried to access, or welcome page
      navigate(from);
    } catch (error: any) {
      console.error('Error during email sign in:', error);
      const errorMessage = 
        error.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.' :
        error.code === 'auth/user-not-found' ? 'No account found with this email.' :
        error.code === 'auth/invalid-email' ? 'Invalid email address.' :
        'Failed to sign in. Please try again.';
      setError(errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setSuccessMessage('');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Logged in user:', result.user);
      // Redirect to the page user tried to access, or welcome page
      navigate(from);
    } catch (error: any) {
      console.error('Error during Google sign in:', error);
      const errorMessage = error.code === 'auth/popup-closed-by-user' 
        ? 'Login was cancelled. Please try again.'
        : error.code === 'auth/unauthorized-domain'
        ? 'This domain is not authorized for login. Please contact support.'
        : 'Failed to sign in with Google. Please try again.';
      setError(errorMessage);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      const errorMessage = 
        error.code === 'auth/user-not-found' ? 'No account found with this email.' :
        error.code === 'auth/invalid-email' ? 'Invalid email address.' :
        'Failed to send reset email. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Brain className="h-12 w-12 text-blue-600" />
          <span className="text-3xl font-bold text-blue-600 ml-2">
            AIDoc
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {resetSent && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Password reset email sent! Please check your inbox.
          </div>
        )}
        
        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 text-center mb-6">
            Welcome Back
          </h2>
          <p className="text-slate-600 text-center mb-8">
            Sign in to access AI-powered medical report analysis
          </p>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors mb-4"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5"
            />
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-slate-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 font-medium transition-colors"
            >
              Sign in
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;