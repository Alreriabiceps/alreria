import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../login/Login.module.css';

const Signup = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        throw new Error('Backend URL is not configured. Please check your environment variables.');
      }

      const response = await fetch(`${backendUrl}/api/auth/student-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: Number(studentId),
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Registration failed: ${response.status} ${response.statusText}`);
      }

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
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
        <h1 className={`${styles.loginTitle} ${styles.textShadowGlow}`}>
          // CREATE NEW ACCOUNT //
        </h1>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="studentId">Service ID:</label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              autoComplete="username"
              disabled={isLoading}
              placeholder="e.g., XP-774"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password Matrix:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}
          {success && <p className={styles.successMessage}>{success}</p>}

          <button
            type="submit"
            className={`${styles.gameButton} ${styles.loginButton}`}
            disabled={isLoading}
          >
            {isLoading ? 'REGISTERING...' : 'SIGN UP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup; 