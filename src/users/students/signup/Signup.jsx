import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../login/Login.module.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    studentId: '',
    password: '',
    track: '',
    section: '',
    yearLevel: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'studentId' ? value.replace(/\D/, '') : value
    }));
  };

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
          ...formData,
          studentId: Number(formData.studentId)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Registration failed: ${response.status} ${response.statusText}`);
      }

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
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

        {success ? (
          <div>
            <div className={styles.successMessage}>{success}</div>
            <div className="mt-4 text-base text-center text-accent-content">
              <p>
                Please check your email inbox for a confirmation link.<br />
                <b>Don&apos;t forget to check your Spam or Promotions folder</b> if you don&apos;t see it in your inbox.<br />
                You must confirm your email before you can log in.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className="signupGrid--3col">
              <div className={styles.inputGroup}>
                <label htmlFor="firstName">First Name:</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="First Name"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="middleName">Middle Name:</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Middle Name (optional)"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="lastName">Last Name:</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Last Name"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Email"
                />
              </div>
            </div>
            <div className="signupGrid">
              <div className={styles.inputGroup}>
                <label htmlFor="studentId">Service ID:</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  disabled={isLoading}
                  placeholder="e.g., 12345"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="track">Track:</label>
                <select
                  id="track"
                  name="track"
                  value={formData.track}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Track</option>
                  <option value="Academic Track">Academic Track</option>
                  <option value="Technical-Professional Track">Technical-Professional Track</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="section">Section:</label>
                <input
                  type="text"
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Section"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="yearLevel">Year Level:</label>
                <select
                  id="yearLevel"
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Year Level</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="password">Password Matrix:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <button
              type="submit"
              className={`${styles.gameButton} ${styles.loginButton}`}
              disabled={isLoading}
            >
              {isLoading ? 'REGISTERING...' : 'SIGN UP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup; 