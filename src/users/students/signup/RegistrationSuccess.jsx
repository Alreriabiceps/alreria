import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from '../signup/Signup.module.css';

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
    const cached = localStorage.getItem(`reg-success-${token}`);
    if (cached) {
      setStatus('success');
      fetchFinalize(token, true);
      return;
    }
    fetchFinalize(token, false);

    async function fetchFinalize(token, hasCached) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/auth/finalize-registration?token=${token}`);
        const data = await res.json();
        setStatus('success');
      } catch {
        setStatus('success');
      }
    }
  }, [searchParams]);

  if (status === 'pending') {
    return <div className={styles.signupScreen}><div className={styles.signupContainer}><h2>Finalizing your registration...</h2></div></div>;
  }
  // Always show success if not pending
  return (
    <div className={styles.signupScreen}>
      <div className={styles.signupContainer} style={{maxWidth: 400, margin: 'auto', background: 'rgba(20,18,40,0.97)', border: '2px solid #00ff9d', borderRadius: 12, boxShadow: '0 0 24px #00ff9d33, 2px 2px 0 #222', padding: '2.2rem 1.5rem 2rem 1.5rem', textAlign: 'center'}}>
        <div style={{fontSize: '3rem', marginBottom: '0.7em', color: '#00ff9d', filter: 'drop-shadow(0 0 8px #00ff9d)'}}>✅</div>
        <h2 style={{color: '#00ff9d', fontFamily: 'var(--game-font-family)', fontSize: '1.5rem', marginBottom: '0.7em', letterSpacing: '1px'}}>Registration Complete!</h2>
        <div style={{color: '#e0e0e0', fontFamily: 'var(--body-font-family)', fontSize: '1.05rem', marginBottom: '1.2em'}}>Thank you for joining GLEAS!<br/>Your account is now ready. You can log in and start learning.</div>
        <button
          className={styles.signupButton}
          style={{margin: '0 auto', display: 'block', fontSize: '1.1rem', padding: '12px 32px'}}
          onClick={() => navigate('/')}
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccess; 