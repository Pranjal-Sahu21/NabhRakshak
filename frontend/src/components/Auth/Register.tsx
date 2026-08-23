import React, { useState } from 'react';

interface RegisterFormData { firstName?: string; lastName?: string; email?: string; password?: string; confirmPassword?: string; role?: string; organization?: string; agreeToTerms?: boolean; }
interface RegisterErrors { firstName?: string; lastName?: string; email?: string; password?: string; confirmPassword?: string; organization?: string; agreeToTerms?: string; submit?: string; }
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
  EnvelopeIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const Register = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'analyst',
    organization: '',
    agreeToTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const roles = [
    {
      id: 'analyst',
      name: 'Space Analyst',
      description: 'Monitor and analyze space debris data',
      icon: AcademicCapIcon,
      permissions: ['view_data', 'create_reports']
    },
    {
      id: 'operator',
      name: 'Mission Operator',
      description: 'Manage missions and satellite operations',
      icon: UserGroupIcon,
      permissions: ['view_data', 'create_reports', 'manage_missions']
    },
    {
      id: 'admin',
      name: 'System Administrator',
      description: 'Full system access and user management',
      icon: BuildingOfficeIcon,
      permissions: ['full_access']
    }
  ];

  const validateStep1 = () => {
    const newErrors: any = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization is required';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setIsSubmitting(true);
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization
      });
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
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

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    return strength;
  };

  const getStrengthColor = (strength) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-neon-purple/5 to-neon-blue/5 rounded-full blur-3xl"></div>
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
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full mb-4"
            >
              <GlobeAltIcon className="w-8 h-8 text-white" />
            </MotionDiv>
            <h1 className="text-2xl font-normal text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Join the Space Debris Monitoring Network</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-neon-blue text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-neon-blue' : 'bg-gray-600'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-neon-blue text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <MotionDiv
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-3 py-3 bg-dark-lighter border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                      errors.firstName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:ring-neon-blue focus:border-neon-blue'
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-3 py-3 bg-dark-lighter border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                      errors.lastName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:ring-neon-blue focus:border-neon-blue'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
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
                    placeholder="john.doe@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Select Your Role
                </label>
                <div className="space-y-3">
                  {roles.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <label
                        key={role.id}
                        className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.role === role.id
                            ? 'border-neon-blue bg-neon-blue/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="role"
                            value={role.id}
                            checked={formData.role === role.id}
                            onChange={handleChange}
                            className="mt-1 w-4 h-4 text-neon-blue bg-dark-lighter border-gray-600 focus:ring-neon-blue"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <IconComponent className="w-5 h-5 text-neon-blue" />
                              <span className="font-medium text-white">{role.name}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <MotionButton
                type="button"
                onClick={handleNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full neon-button py-3 flex items-center justify-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRightIcon className="w-4 h-4" />
              </MotionButton>
            </MotionDiv>
          )}

          {/* Step 2: Security & Organization */}
          {step === 2 && (
            <MotionDiv
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Organization Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Organization
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3 bg-dark-lighter border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                        errors.organization 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:ring-neon-blue focus:border-neon-blue'
                      }`}
                      placeholder="NASA, ESA, ISRO, etc."
                    />
                  </div>
                  {errors.organization && (
                    <p className="mt-2 text-sm text-red-400">{errors.organization}</p>
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
                      placeholder="Create a strong password"
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
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getStrengthColor(getPasswordStrength())}`}
                            style={{ width: `${(getPasswordStrength() / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {getStrengthText(getPasswordStrength())}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-3 bg-dark-lighter border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                        errors.confirmPassword 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:ring-neon-blue focus:border-neon-blue'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="mt-2 text-sm text-green-400 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Passwords match
                    </p>
                  )}
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Terms Agreement */}
                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-neon-blue bg-dark-lighter border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                    />
                    <span className="text-sm text-gray-400">
                      I agree to the{' '}
                      <Link to="/terms" className="text-neon-blue hover:text-neon-purple">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-neon-blue hover:text-neon-purple">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="mt-2 text-sm text-red-400">{errors.agreeToTerms}</p>
                  )}
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

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <MotionButton
                    type="button"
                    onClick={handleBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    Back
                  </MotionButton>
                  <MotionButton
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 neon-button py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting || isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </MotionButton>
                </div>
              </form>
            </MotionDiv>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-neon-blue hover:text-neon-purple transition-colors font-medium"
              >
                Sign in
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
            Join the global network of space debris monitoring professionals
          </p>
        </MotionDiv>
      </div>
    </div>
  );
};

export default Register;
