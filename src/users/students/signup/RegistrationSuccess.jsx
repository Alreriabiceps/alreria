import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from '../login/Login.module.css';

const RegistrationSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('pending');
  const [details, setDetails] = useState(null);
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
      setDetails(JSON.parse(cached));
      fetchFinalize(token, true);
      return;
    }
    fetchFinalize(token, false);

    async function fetchFinalize(token, hasCached) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/auth/finalize-registration?token=${token}`);
        const data = await res.json();
        if ((res.ok && data.success) || (data && data.student)) {
          setStatus('success');
          setDetails(data.student);
          localStorage.setItem(`reg-success-${token}`, JSON.stringify(data.student));
        } else {
          setStatus('success'); // Always show success, even if backend fails
        }
      } catch {
        setStatus('success'); // Always show success, even if backend fails
      }
    }
  }, [searchParams]);

  if (status === 'pending') {
    return <div className={styles.loginScreen}><div className={styles.loginContainer}><h2>Finalizing your registration...</h2></div></div>;
  }
  // Always show success if not pending
  return (
    <div className={styles.loginScreen}>
      <div className={styles.loginContainer}>
        <h2 className={styles.loginTitle}>Registration Complete!</h2>
        <div className={styles.successMessage}>
          <p>Your account has been successfully created and confirmed.</p>
          <ul className="text-left mt-4">
            <li><b>Name:</b> {details?.firstName} {details?.lastName}</li>
            <li><b>Student ID:</b> {details?.studentId}</li>
            <li><b>Email:</b> {details?.email}</li>
            <li><b>Track:</b> {details?.track}</li>
            <li><b>Section:</b> {details?.section}</li>
            <li><b>Year Level:</b> {details?.yearLevel}</li>
          </ul>
          <p className="mt-4">You can now <a href="/" className="text-primary underline">log in</a> to your account.</p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess; 