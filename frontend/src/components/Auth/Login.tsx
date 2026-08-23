import React, { useState } from 'react';

interface LoginFormData { email: string; password: string; rememberMe: boolean; }
interface LoginErrors { email?: string; password?: string; submit?: string; }
import { motion } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
const MotionButton = motion.button as React.FC<any>;
const MotionP = motion.p as React.FC<any>;
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password, formData.rememberMe);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@spacedebris.com', password: 'admin123' },
    { role: 'Operator', email: 'operator@spacedebris.com', password: 'operator123' },
    { role: 'Analyst', email: 'analyst@spacedebris.com', password: 'analyst123' }
  ];

  const fillDemoCredentials = (credentials) => {
    setFormData(prev => ({
      ...prev,
      email: credentials.email,
      password: credentials.password
    }));
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full mb-4"
            >
              <GlobeAltIcon className="w-8 h-8 text-white" />
            </MotionDiv>
            <h1 className="text-2xl font-normal text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to Space Debris Monitoring Dashboard</p>
          </div>

          {/* Demo Credentials */}
          <div className="mb-6 p-4 bg-dark-lighter/50 rounded-lg border border-neon-blue/20">
            <h3 className="text-sm font-medium text-neon-blue mb-3">Demo Accounts</h3>
            <div className="space-y-2">
              {demoCredentials.map((cred, index) => (
                <button
                  key={index}
                  onClick={() => fillDemoCredentials(cred)}
                  className="w-full text-left p-2 rounded bg-dark-lighter/50 hover:bg-dark-lighter transition-colors text-xs"
                >
                  <div className="text-white font-medium">{cred.role}</div>
                  <div className="text-gray-400">{cred.email}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 bg-dark-lighter border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-neon-blue focus:border-neon-blue'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <MotionP
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400 flex items-center"
                >
                  <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                  {errors.email}
                </MotionP>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 bg-dark-lighter border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-neon-blue focus:border-neon-blue'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <MotionP
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400 flex items-center"
                >
                  <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                  {errors.password}
                </MotionP>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-neon-blue bg-dark-lighter border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-400">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-neon-blue hover:text-neon-purple transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <MotionDiv
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
              >
                <p className="text-sm text-red-400 flex items-center">
                  <ExclamationCircleIcon className="w-4 h-4 mr-2" />
                  {errors.submit}
                </p>
              </MotionDiv>
            )}

            {/* Submit Button */}
            <MotionButton
              type="submit"
              disabled={isSubmitting || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full neon-button py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting || isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </MotionButton>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-neon-blue hover:text-neon-purple transition-colors font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </MotionDiv>

        {/* Additional Info */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-500 text-xs">
            Secure access to space debris monitoring and prediction systems
          </p>
        </MotionDiv>
      </div>
    </div>
  );
};

export default Login;
