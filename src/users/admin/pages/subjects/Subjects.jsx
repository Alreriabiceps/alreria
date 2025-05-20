// components/Subjects.js
import { useEffect, useState } from "react";
import { MdAdd, MdEdit, MdDelete, MdSave, MdClose } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // For success messages
  const [loading, setLoading] = useState(false); // Indicate loading state
  const [editingSubject, setEditingSubject] = useState(null); // Stores the whole subject being edited { _id, subject }
  const [editedSubjectName, setEditedSubjectName] = useState("");
  const { guideMode } = useGuideMode();

  // Ensure your VITE_BACKEND_URL is correctly set in your .env file
  const backendurl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; // Provide a default for local dev

  // --- Fetch Subjects ---
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await fetch(`${backendurl}/api/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${res.status}`
          );
        }
        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
        setError(`Failed to fetch subjects: ${err.message}`);
        if (err.message.includes('token') || err.message.includes('authentication')) {
          window.location.href = '/admin/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [backendurl]); // Dependency array is correct

  // --- Clear Messages ---
  useEffect(() => {
    // Clear messages after a delay
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 4000); // Clear after 4 seconds
      return () => clearTimeout(timer); // Cleanup timer on component unmount or message change
    }
  }, [error, success]);

  // --- Add Subject ---
  const handleAddSubject = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedSubject = newSubject.trim();
    if (!trimmedSubject) {
      return setError("Subject name cannot be empty.");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${backendurl}/api/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ subject: trimmedSubject }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || `Failed to add subject. Status: ${res.status}`
        );
      }

      setSubjects((prev) =>
        [...prev, result].sort((a, b) => a.subject.localeCompare(b.subject))
      );
      setNewSubject("");
      setSuccess(`Subject "${result.subject}" added successfully!`);
    } catch (err) {
      console.warn("Error adding subject:", err);
      setError(`Error adding subject: ${err.message}`);
      if (err.message.includes('token') || err.message.includes('authentication')) {
        window.location.href = '/admin/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Delete Subject ---
  const handleDeleteSubject = async (id, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${subjectName}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${backendurl}/api/subjects/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete subject");
      }

      setSubjects(prev => prev.filter(subject => subject._id !== id));
      setSuccess(`Subject "${subjectName}" deleted successfully!`);
    } catch (err) {
      console.error("Error deleting subject:", err);
      setError(`Error deleting subject: ${err.message}`);
      if (err.message.includes('token') || err.message.includes('authentication')) {
        window.location.href = '/admin/login';
      }
    }
  };

  // --- Update Subject ---
  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEditedName = editedSubjectName.trim();
    if (!trimmedEditedName) {
      return setError("Subject name cannot be empty.");
    }

    // Check if name is actually changed
    if (editingSubject && trimmedEditedName === editingSubject.subject) {
      setEditingSubject(null);
      setEditedSubjectName("");
      return;
    }

    if (!editingSubject?._id) {
      setError("An internal error occurred. Cannot identify subject to update.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${backendurl}/api/subjects/${editingSubject._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ subject: trimmedEditedName }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to update subject. Status: ${res.status}`);
      }

      const updatedSubject = await res.json();

      // Update the subject in the local state
      setSubjects(prevSubjects => {
        const updatedSubjects = prevSubjects.map(subject =>
          subject._id === updatedSubject._id ? updatedSubject : subject
        );
        return updatedSubjects.sort((a, b) => a.subject.localeCompare(b.subject));
      });

      setEditingSubject(null);
      setEditedSubjectName("");
      setSuccess(`Subject updated to "${updatedSubject.subject}" successfully!`);
    } catch (err) {
      console.error("Error updating subject:", err);
      if (err.message.includes('token') || err.message.includes('authentication')) {
        window.location.href = '/admin/login';
      } else {
        setError(`Error updating subject: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Edit Subject ---
  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setEditedSubjectName(subject.subject);
    setError("");
    setSuccess("");
  };

  // --- Cancel Editing ---
  const handleCancelEdit = () => {
    setEditingSubject(null);
    setEditedSubjectName("");
    setError("");
  };

  // --- Render ---
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">Subject Manager</h1>
            <button
              onClick={() => document.getElementById('add-subject-modal').showModal()}
              className="btn btn-primary btn-sm gap-2"
            >
              <MdAdd className="w-5 h-5" />
              Add Subject
            </button>
          </div>

          {guideMode && (
            <details className="mb-6 bg-primary/10 border border-primary rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-primary mb-1">How to use the Subjects page?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>View all subjects in the list below.</li>
                <li>To add a new subject, click <b>Add Subject</b> and fill in the subject name.</li>
                <li>To edit a subject, click the edit icon next to it, make changes, and save.</li>
                <li>To delete a subject, click the delete icon next to it.</li>
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

          {/* Subjects List */}
          <div className="card bg-base-100 p-6 rounded-lg">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject._id}>
                        <td>
                          {editingSubject?._id === subject._id ? (
                            <form onSubmit={handleUpdateSubject} className="flex gap-2">
                              <input
                                type="text"
                                value={editedSubjectName}
                                onChange={(e) => setEditedSubjectName(e.target.value)}
                                className="input input-bordered w-full"
                                placeholder="Enter subject name"
                              />
                              <button type="submit" className="btn btn-primary btn-sm">
                                <MdSave className="w-5 h-5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="btn btn-ghost btn-sm"
                              >
                                <MdClose className="w-5 h-5" />
                              </button>
                            </form>
                          ) : (
                            subject.subject
                          )}
                        </td>
                        <td className="text-right">
                          {editingSubject?._id !== subject._id && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditSubject(subject)}
                                className="btn btn-ghost btn-sm"
                              >
                                <MdEdit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject._id, subject.subject)}
                                className="btn btn-ghost btn-sm text-error"
                              >
                                <MdDelete className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Subject Modal */}
      <dialog id="add-subject-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New Subject</h3>
          <form onSubmit={handleAddSubject}>
            <div className="form-control">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter subject name"
              />
            </div>
            <div className="modal-action">
              <button type="submit" className="btn btn-primary">
                Add Subject
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => document.getElementById('add-subject-modal').close()}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default Subjects;
