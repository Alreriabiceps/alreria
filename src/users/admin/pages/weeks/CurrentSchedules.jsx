import { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdSave, MdClose, MdCheck, MdClose as MdCloseIcon } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const CurrentSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editWeekNumber, setEditWeekNumber] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editQuestions, setEditQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(5);
  const { guideMode } = useGuideMode();

  const backendurl = import.meta.env.VITE_BACKEND_URL;

  // Fetch schedules and subjects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch schedules
        const schedulesRes = await fetch(`${backendurl}/api/weeks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!schedulesRes.ok) throw new Error("Failed to fetch schedules");
        const schedulesData = await schedulesRes.json();
        setSchedules(Array.isArray(schedulesData) ? schedulesData : []);

        // Fetch subjects
        const subjectsRes = await fetch(`${backendurl}/api/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!subjectsRes.ok) throw new Error("Failed to fetch subjects");
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load data");
        if (err.message.includes('token') || err.message.includes('authentication')) {
          window.location.href = '/admin/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [backendurl]);

  // Fetch questions when editing
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!editSubject) {
        setAvailableQuestions([]);
        return;
      }

      try {
        const res = await fetch(`${backendurl}/api/questions/${editSubject}`);
        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();
        setAvailableQuestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch questions", err);
        setError("Failed to load questions");
      }
    };

    fetchQuestions();
  }, [editSubject, backendurl]);

  // Filter schedules based on selected week and subject
  const filteredSchedules = schedules.filter(schedule => {
    const weekMatch = !selectedWeek || schedule.weekNumber === parseInt(selectedWeek);
    const subjectMatch = !selectedSubject || schedule.subjectId._id === selectedSubject;
    return weekMatch && subjectMatch;
  });

  // Group filtered schedules by week
  const schedulesByWeek = filteredSchedules.reduce((acc, schedule) => {
    const weekKey = `Week ${schedule.weekNumber}`;
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(schedule);
    return acc;
  }, {});

  const handleToggleActive = async (scheduleId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${backendurl}/api/weeks/${scheduleId}/toggle-active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to toggle active status");
      }

      const updatedSchedule = await res.json();
      setSchedules(prev =>
        prev.map(schedule =>
          schedule._id === scheduleId ? updatedSchedule : schedule
        )
      );
      setSuccess("Schedule status updated successfully!");
    } catch (err) {
      console.error("Error toggling active status:", err);
      setError(err.message || "Failed to update schedule status");
      if (err.message.includes('token') || err.message.includes('authentication')) {
        window.location.href = '/admin/login';
      }
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${backendurl}/api/weeks/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete schedule');
      }

      setSchedules(prev => prev.filter(schedule => schedule._id !== scheduleId));
      setSuccess('Schedule deleted successfully!');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      if (err.message.includes('token') || err.message.includes('authentication')) {
        window.location.href = '/admin/login';
      } else {
        setError(err.message || 'Failed to delete schedule. Please try again.');
      }
    }
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setEditWeekNumber(schedule.weekNumber.toString());
    setEditSubject(schedule.subjectId._id);
    setEditQuestions(schedule.questionIds.map(q => q._id));
    setShowModal(true);
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editSubject) {
      setError('Please select a subject');
      return;
    }

    if (editQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${backendurl}/api/weeks/${selectedSchedule._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: editSubject,
          questions: editQuestions,
          weekNumber: parseInt(editWeekNumber),
          year: selectedSchedule.year
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update schedule');
      }

      const updatedSchedule = await res.json();
      setSchedules(prev =>
        prev.map(schedule =>
          schedule._id === selectedSchedule._id ? updatedSchedule : schedule
        )
      );
      setSuccess('Schedule updated successfully!');
      setShowModal(false);
      setSelectedSchedule(null);
      setEditQuestions([]);
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError(err.message || 'Failed to update schedule');
      if (err.message.includes('token') || err.message.includes('authentication')) {
        window.location.href = '/admin/login';
      }
    }
  };

  const handleQuestionSelect = (questionId) => {
    setEditQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // Pagination for questions in edit modal
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = availableQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(availableQuestions.length / questionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-primary">Weekly Schedules</h1>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="form-control w-full sm:w-48">
                <select
                  className="select select-bordered w-full bg-base-100"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                >
                  <option value="">All Weeks</option>
                  {[...Array(52)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Week {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control w-full sm:w-48">
                <select
                  className="select select-bordered w-full bg-base-100"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {guideMode && (
            <details className="mb-6 bg-success/10 border border-success rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-success mb-1">How to use the Current Schedules page?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>View all current schedules for weekly tests.</li>
                <li>Check details for each schedule, including subject and week number.</li>
                <li>Edit or delete schedules as needed using the available actions.</li>
                <li>Use the filters to find specific schedules quickly.</li>
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

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : Object.keys(schedulesByWeek).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-base-content/70">No schedules found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Subject</th>
                    <th>Questions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(schedulesByWeek).map(([week, weekSchedules]) => (
                    weekSchedules.map((schedule) => (
                      <tr key={schedule._id}>
                        <td>Week {schedule.weekNumber}</td>
                        <td>{schedule.subjectId.subject}</td>
                        <td>{schedule.questionIds.length} questions</td>
                        <td>
                          <span className={`badge ${schedule.isActive ? 'badge-success' : 'badge-error'}`}>
                            {schedule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="flex gap-2">
                          <button
                            onClick={() => handleToggleActive(schedule._id)}
                            className={`btn btn-sm ${schedule.isActive ? 'btn-error' : 'btn-success'}`}
                          >
                            {schedule.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="btn btn-sm btn-primary"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule._id)}
                            className="btn btn-sm btn-error"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <dialog id="edit-modal" className={`modal ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Schedule</h3>
          <form onSubmit={handleUpdateSchedule}>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Week Number</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full bg-base-100"
                value={editWeekNumber}
                onChange={(e) => setEditWeekNumber(e.target.value)}
                min="1"
                max="52"
                required
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Subject</span>
              </label>
              <select
                className="select select-bordered w-full bg-base-100"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              >
                <option value="">-- Select a Subject --</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Questions</span>
              </label>
              <div className="space-y-2">
                {currentQuestions.map((question) => (
                  <div
                    key={question._id}
                    className="flex items-start gap-3 p-3 bg-base-200 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary mt-1"
                      checked={editQuestions.includes(question._id)}
                      onChange={() => handleQuestionSelect(question._id)}
                    />
                    <div>
                      <p className="font-medium">{question.questionText}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {question.choices.map((choice, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded-full text-sm ${choice === question.correctAnswer
                              ? "bg-success text-success-content"
                              : "bg-base-300"
                              }`}
                          >
                            {choice}
                            {choice === question.correctAnswer && (
                              <MdCheck className="inline-block ml-1" />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <div className="join">
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`join-item btn btn-sm ${currentPage === index + 1 ? "btn-active" : ""
                          }`}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button type="submit" className="btn btn-primary gap-2">
                <MdSave className="w-5 h-5" />
                Save Changes
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowModal(false)}>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default CurrentSchedules; 