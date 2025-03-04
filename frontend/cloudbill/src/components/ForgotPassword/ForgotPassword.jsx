import React, { useState, useEffect, useCallback  } from 'react';
import { API } from '../../Api.js';
import { AlertCircle, Search, Plus, X } from "lucide-react";

const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState({ message: "", type: "" });
  
    const showPopup = useCallback((message, type = "success") => {
      setPopup({ message, type });
      setTimeout(() => setPopup({ message: "", type: "" }), 3000);
    }, []);

  // Password validation states
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });

  // Validate password on change
  useEffect(() => {
    const validations = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    };
    setPasswordValidations(validations);
  }, [newPassword]);

  // Check if all password validations are met
  const isPasswordValid = Object.values(passwordValidations).every(v => v);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await API.post('sendOTP', { email });
      console.log(response.data);
      setStep('otp');
      setSuccess('OTP sent to your email');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await API.post('verifyOTP', { email, otp });
      setStep('reset-password');
      setSuccess('OTP verified successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (isLoading || !isPasswordValid) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await API.post('resetPassword', { newPassword });
      // Auto close after 2 seconds
      showPopup("Your password has been reset successfully.")
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <h2 className="text-xl font-bold text-center">Forgot Password</h2>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className={`w-full text-white p-2 rounded ${
                isLoading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        );
      
      case 'otp':
        return (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <h2 className="text-xl font-bold text-center">Verify OTP</h2>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              className="w-full p-2 border rounded"
              required
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className={`w-full text-white p-2 rounded ${
                isLoading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        );
      
      case 'reset-password':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <h2 className="text-xl font-bold text-center">Reset Password</h2>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
              disabled={isLoading}
            />
            <div className="text-sm text-gray-600 mb-2">
              Password Requirements:
              <ul className="list-disc list-inside">
                <li className={passwordValidations.length ? 'text-green-500' : 'text-red-500'}>
                  At least 8 characters
                </li>
                <li className={passwordValidations.uppercase ? 'text-green-500' : 'text-red-500'}>
                  One uppercase letter
                </li>
                <li className={passwordValidations.lowercase ? 'text-green-500' : 'text-red-500'}>
                  One lowercase letter
                </li>
                <li className={passwordValidations.number ? 'text-green-500' : 'text-red-500'}>
                  One number
                </li>
                <li className={passwordValidations.specialChar ? 'text-green-500' : 'text-red-500'}>
                  One special character
                </li>
              </ul>
            </div>
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className={`w-full text-white p-2 rounded ${
                (!isPasswordValid || isLoading)
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={!isPasswordValid || isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        );
    }
  };


  return (
    <>
      {popup.message && (
              <div
                className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white z-50 flex items-center ${
                  popup.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}
              >
                <AlertCircle className="mr-2" size={18} />
                {popup.message}
              </div>
      )};
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            disabled={isLoading}
          >
            ✕
          </button>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
              {success}
            </div>
          )}
          
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordModal;