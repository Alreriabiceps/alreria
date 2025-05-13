import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send reset link');
      setMessage('If an account exists, a password reset link has been sent to your email.');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginScreen}>
      <div className={styles.scanlineOverlay}></div>
      <div className={styles.loginContainer}>
        <h1 className={`${styles.loginTitle} ${styles.textShadowGlow}`}>// RESET PASSWORD //</h1>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your email"
              autoComplete="username"
              required
            />
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
          {message && <p className={styles.successMessage}>{message}</p>}
          <button
            type="submit"
            className={styles.gameButton}
            disabled={isLoading}
            style={{ marginTop: '1.2rem' }}
          >
            {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </form>
        <button
          type="button"
          className={styles.gameButton}
          style={{ marginTop: '1rem', background: '#222', color: '#fff', fontSize: '0.8rem', padding: '6px 14px' }}
          onClick={() => navigate('/')}
          disabled={isLoading}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword; 