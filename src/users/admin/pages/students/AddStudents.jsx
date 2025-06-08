import { useState, useEffect } from "react";
import { MdAdd, MdSave, MdClose } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const AddStudents = () => {
  const [students, setStudents] = useState([
    { firstName: "", lastName: "", studentId: "", grade: "", section: "", track: "", password: "" }
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { guideMode } = useGuideMode();

  const backendurl = import.meta.env.VITE_BACKEND_URL;

  const handleStudentChange = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index][field] = value;
    setStudents(updatedStudents);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        if (err.message.includes('token') || err.message.includes('authentication')) {
          window.location.href = '/admin/login';
        }
      }
    };
    fetchData();
  }, [backendurl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const hasEmptyFields = students.some(
      (s) => !s.firstName || !s.lastName || !s.studentId || !s.grade || !s.section || !s.track || !s.password
    );

    if (hasEmptyFields) {
      setError("Please fill in all fields for each student.");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${backendurl}/api/admin/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ students }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add students");
      }

      alert("Students added successfully!");
      setStudents([{ firstName: "", lastName: "", studentId: "", grade: "", section: "", track: "", password: "" }]);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while adding students.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStudent = () => {
    setStudents([
      ...students,
      { firstName: "", lastName: "", studentId: "", grade: "", section: "", track: "", password: "" }
    ]);
  };

  const handleRemoveStudent = (index) => {
    if (students.length === 1) {
      setError("You must have at least one student.");
      return;
    }
    setStudents(students.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-3 sm:p-6">
          {guideMode && (
            <details className="mb-6 bg-base-200 border border-primary rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-primary mb-1">How to use the Add Students page?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>Fill in the required information for each student: First Name, Last Name, Student ID, Grade, Section, Track, and Password.</li>
                <li>To add more students, click the <b>Add Another Student</b> button.</li>
                <li>To remove a student, click the red <b>Remove</b> button next to their information.</li>
                <li>Once you've filled in all the information, click <b>Add Students</b> to save them.</li>
                <li>Make sure each Student ID is unique across the system.</li>
              </ol>
            </details>
          )}
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">Add Students</h1>
            </div>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {students.map((student, index) => (
                <div key={index} className="card bg-base-100 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="badge badge-primary">Student {index + 1}</div>
                    </div>
                    
                    {students.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => handleRemoveStudent(index)}
                      >
                        <MdClose className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">First Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered bg-base-100"
                        placeholder="Enter first name"
                        value={student.firstName}
                        onChange={(e) => handleStudentChange(index, "firstName", e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Last Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered bg-base-100"
                        placeholder="Enter last name"
                        value={student.lastName}
                        onChange={(e) => handleStudentChange(index, "lastName", e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Student ID</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered bg-base-100"
                        placeholder="Enter student ID"
                        value={student.studentId}
                        onChange={(e) => handleStudentChange(index, "studentId", e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Grade</span>
                      </label>
                      <select
                        className="select select-bordered bg-base-100"
                        value={student.grade}
                        onChange={(e) => handleStudentChange(index, "grade", e.target.value)}
                      >
                        <option value="">Select Grade</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Section</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered bg-base-100"
                        placeholder="Enter section"
                        value={student.section}
                        onChange={(e) => handleStudentChange(index, "section", e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Track</span>
                      </label>
                      <select
                        className="select select-bordered bg-base-100"
                        value={student.track}
                        onChange={(e) => handleStudentChange(index, "track", e.target.value)}
                      >
                        <option value="">Select Track</option>
                        <option value="Academic Track">Academic Track</option>
                        <option value="Technical-Professional Track">Technical-Professional Track</option>
                      </select>
                    </div>

                    <div className="form-control sm:col-span-2 lg:col-span-3">
                      <label className="label">
                        <span className="label-text font-medium">Password</span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered bg-base-100"
                        placeholder="Enter password"
                        value={student.password}
                        onChange={(e) => handleStudentChange(index, "password", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="btn btn-outline gap-2"
                onClick={handleAddStudent}
              >
                <MdAdd className="w-4 h-4" />
                Add Another Student
              </button>

              <button
                type="submit"
                className="btn btn-primary gap-2 flex-1"
                disabled={isSubmitting}
              >
                <MdSave className="w-4 h-4" />
                {isSubmitting ? "Adding Students..." : "Add Students"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudents;
