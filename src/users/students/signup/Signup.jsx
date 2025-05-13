import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Signup.module.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    track: '',
    section: '',
    yearLevel: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    setFormData(prev => ({
      ...prev,
      [name]: name === 'studentId' ? value.replace(/\D/, '') : value
    }));
  };

  const validatePassword = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!Object.values(passwordStrength).every(Boolean)) {
      setError('Password does not meet all requirements');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validatePassword()) {
      return;
    }

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

      setSuccess('Registration successful! Please check your email to confirm your account.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.signupScreen}>
      <div className={styles.scanlineOverlay}></div>

      <div className={styles.signupContainer}>
        <h1 className={`${styles.signupTitle} ${styles.textShadowGlow}`}>
          // CREATE NEW ACCOUNT //
        </h1>

        {success ? (
          <div>
            <div className={styles.successMessageBox}>
              <div className={styles.successIcon}>📧</div>
              <div>
                <h2 className={styles.successTitle}>Check Your Email!</h2>
                <p className={styles.successText}>
                  We've sent a confirmation link to your email address.<br />
                  <b>Don't forget to check your <span style={{color:'#00b894'}}>Spam</span> or <span style={{color:'#00b894'}}>Promotions</span> folder</b> if you don't see it in your inbox.<br />
                  <span style={{color:'#00b894'}}>You must confirm your email before you can log in.</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.signupButton}
              style={{ marginTop: '2rem' }}
              onClick={() => navigate('/')}
            >
              Log In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.signupForm}>
            <div className={styles.signupGrid}>
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
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
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
                  minLength={8}
                />
                <div className={styles.passwordRequirements}>
                  <p>Password must contain:</p>
                  <ul>
                    <li className={passwordStrength.length ? styles.requirementMet : ''}>
                      At least 8 characters
                    </li>
                    <li className={passwordStrength.uppercase ? styles.requirementMet : ''}>
                      One uppercase letter
                    </li>
                    <li className={passwordStrength.lowercase ? styles.requirementMet : ''}>
                      One lowercase letter
                    </li>
                    <li className={passwordStrength.number ? styles.requirementMet : ''}>
                      One number
                    </li>
                    <li className={passwordStrength.special ? styles.requirementMet : ''}>
                      One special character
                    </li>
                  </ul>
                </div>
              </div>

              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="confirmPassword">Confirm Password Matrix:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <button
              type="submit"
              className={styles.signupButton}
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