import { useState } from 'react';
import { emailService } from '../services/emailService';
// Assuming toast is installed, else we just rely on local state
// import toast from 'react-hot-toast';

export function useEmailSender() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError]     = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sendEmail = async (payload) => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage('');

    try {
      const response = await emailService.sendEmail(payload);
      if (response.data?.success) {
        setIsSuccess(true);
        // toast.success('Email sent successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to send email');
      }
    } catch (err) {
      setIsError(true);
      setErrorMessage(err.response?.data?.message || err.message || 'Network error occurred');
      // toast.error('Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage('');
  };

  return { sendEmail, isLoading, isSuccess, isError, errorMessage, reset };
}
