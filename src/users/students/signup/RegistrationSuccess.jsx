import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from '../signup/Signup.module.css';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

const RegistrationSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    async function fetchFinalize(tokenToFinalize) {
      setStatus('pending');
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) {
          throw new Error("Backend URL not configured.");
        }
        const res = await fetch(`${backendUrl}/api/auth/finalize-registration?token=${tokenToFinalize}`);
        if (!res.ok) {
          let errorMsg = 'Failed to finalize registration.';
          try {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          } catch (e) {
            // console.error("Could not parse error JSON:", e);
          }
          throw new Error(errorMsg);
        }
        setStatus('success');
      } catch (err) {
        // console.error("Finalization error:", err);
        setStatus('error');
      }
    }

    fetchFinalize(token);

  }, [searchParams]);

  if (status === 'pending') {
    return (
      <div className={styles.signupPageWrapper}>
        <div className={`${styles.signupPanel} ${styles.centeredTextContent}`} style={{ maxWidth: '450px' }}>
          <FaSpinner className={`${styles.successIcon} spin`} style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
          <h2 className={styles.successTitle}>Finalizing your registration...</h2>
          <p className={styles.successText}>Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.signupPageWrapper}>
        <div className={`${styles.signupPanel} ${styles.centeredTextContent}`} style={{ maxWidth: '450px' }}>
          <h2 className={styles.successTitle} style={{color: 'var(--blueprint-danger)'}}>Registration Error</h2>
          <p className={styles.successText}>
            There was a problem finalizing your registration. This could be due to an invalid or expired link. 
            Please try registering again or contact support if the issue persists.
          </p>
          <button
            className={styles.signupButton}
            onClick={() => navigate('/register')}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signupPageWrapper}>
      <div className={`${styles.signupPanel} ${styles.centeredTextContent}`} style={{ maxWidth: '450px' }}>
        <FaCheckCircle className={styles.successIcon} />
        <h2 className={styles.successTitle}>Registration Complete!</h2>
        <p className={styles.successText}>
          Thank you for joining GLEAS!<br/>Your account is now ready. You can log in and start learning.
        </p>
        <button
          className={styles.signupButton}
          onClick={() => navigate('/')}
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccess; 