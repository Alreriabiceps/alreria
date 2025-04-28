import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Login.module.css';

const Login = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        throw new Error('Backend URL is not configured. Please check your environment variables.');
      }

      console.log('Attempting student login with:', { studentId, password });
      const response = await fetch(`${backendUrl}/api/auth/student-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: Number(studentId),
          password
        }),
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        console.error('Login error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        throw new Error(data.error || `Login failed: ${response.status} ${response.statusText}`);
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.student));

      // Update auth context
      await login({ studentId, password });

      // Redirect to student dashboard
      navigate('/student/dashboard');
    } catch (err) {
      console.error('Login error details:', err);
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
          // AUTHENTICATION REQUIRED //
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
              autoComplete="current-password"
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button
            type="submit"
            className={`${styles.gameButton} ${styles.loginButton}`}
            disabled={isLoading}
          >
            {isLoading ? 'AUTHENTICATING...' : 'ENGAGE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 