import React, { useState } from 'react';
import { API } from '../../Api';

const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('sendOTP', { email });
      setStep('otp');
      setSuccess('OTP sent to your email');
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('verifyOTP', { email, otp });
      setStep('reset-password');
      setSuccess('OTP verified successfully');
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await API.post('resetPassword', { newPassword });
      setSuccess('Password reset successfully');
      setError('');
      // Optional: auto close or redirect
      setTimeout(onClose, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
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
            />
            <button 
              type="submit" 
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Send OTP
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
            />
            <button 
              type="submit" 
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Verify OTP
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
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <button 
              type="submit" 
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Reset Password
            </button>
          </form>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
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
  );
};

export default ForgotPasswordModal;