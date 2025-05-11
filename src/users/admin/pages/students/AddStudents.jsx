import { useState } from "react";
import { MdAdd, MdSave, MdClose } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const AddStudents = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    studentId: "",
    age: "",
    strand: "",
    section: "",
    yearLevel: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backendurl = import.meta.env.VITE_BACKEND_URL;
  const { guideMode } = useGuideMode();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert studentId and age to numbers
    if (name === 'studentId' || name === 'age') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      // Validate password length
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch(`${backendurl}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add student");
      }

      setSuccess("Student added successfully!");
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        studentId: "",
        age: "",
        strand: "",
        section: "",
        yearLevel: "",
        password: ""
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while adding the student.");
      // If token is invalid, redirect to login
      if (err.message.includes('token') || err.message.includes('authentication')) {
        window.location.href = '/admin/login';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-primary mb-6">Add New Student</h1>

          {guideMode && (
            <details open className="mb-6 bg-accent/10 border border-accent rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-accent mb-1">How to use the Add Student page?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>Fill in the student's details in the form below.</li>
                <li>All fields are required unless marked optional.</li>
                <li>Click <b>Add Student</b> to save the new student.</li>
                <li>If successful, a confirmation message will appear and the form will reset.</li>
              </ol>
            </details>
          )}

          {error && (
            <div className="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-6">
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">First Name</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Middle Name</span>
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Last Name</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Student ID</span>
                </label>
                <input
                  type="number"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100"
                  required
                  min="1"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Age</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100"
                  min="15"
                  max="25"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Strand</span>
                </label>
                <select
                  name="strand"
                  value={formData.strand}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-base-100"
                  required
                >
                  <option value="">Select Strand</option>
                  <option value="ABM">ABM</option>
                  <option value="STEM">STEM</option>
                  <option value="HUMSS">HUMSS</option>
                  <option value="GAS">GAS</option>
                  <option value="TVL-ICT">TVL-ICT</option>
                  <option value="TVL-HE">TVL-HE</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Section</span>
                </label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Year Level</span>
                </label>
                <select
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-base-100"
                  required
                >
                  <option value="">Select Year Level</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                  <span className="label-text-alt">Minimum 6 characters</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary gap-2"
                disabled={isSubmitting}
              >
                <MdSave className="w-5 h-5" />
                {isSubmitting ? "Adding Student..." : "Add Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudents;
