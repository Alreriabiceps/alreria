import { useState, useEffect } from "react";
import { MdAdd, MdCheck, MdClose, MdSave } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const BLOOMS_LEVELS = [
  "Remembering",
  "Understanding",
  "Applying",
  "Analyzing",
  "Evaluating",
  "Creating"
];

// Helper function to get week number
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const WeekSchedule = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [weekNumber, setWeekNumber] = useState(getWeekNumber(new Date()).toString());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(5);
  const [bloomsFilter, setBloomsFilter] = useState("");
  const { guideMode } = useGuideMode();

  const backendurl = import.meta.env.VITE_BACKEND_URL;

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
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
        if (!res.ok) throw new Error("Failed to fetch subjects");
        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch subjects", err);
        setError("Failed to load subjects");
      }
    };

    fetchSubjects();
  }, [backendurl]);

  // Fetch questions when subject is selected
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedSubject) {
        setQuestions([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await fetch(`${backendurl}/api/questions/${selectedSubject}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch questions", err);
        setError("Failed to load questions");
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedSubject, backendurl]);

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedQuestions([]); // Reset selected questions when subject changes
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedSubject) {
      setError("Please select a subject");
      return;
    }

    if (selectedQuestions.length === 0) {
      setError("Please select at least one question");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${backendurl}/api/weeks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: selectedSubject,
          questions: selectedQuestions,
          weekNumber: parseInt(weekNumber),
          year: parseInt(currentYear)
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create schedule");
      }

      await res.json(); // Just consume the response
      setSuccess("Weekly test scheduled successfully!");
      setSelectedQuestions([]); // Reset selections
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError(err.message || "Failed to create schedule");
    }
  };

  // Filter questions by Bloom's Taxonomy before paginating
  const filteredQuestions = bloomsFilter
    ? questions.filter(q => q.bloomsLevel === bloomsFilter)
    : questions;

  // Add pagination functions
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">Schedule Weekly Test</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/70">Week {weekNumber}</span>
              <span className="text-sm text-base-content/70">•</span>
              <span className="text-sm text-base-content/70">{currentYear}</span>
            </div>
          </div>

          {guideMode && (
            <details open className="mb-6 bg-error/10 border border-error rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-error mb-1">How to use the Create Schedule page?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>Select the subject for the weekly test schedule.</li>
                <li>Choose the week and year for the schedule.</li>
                <li>Select questions to include in the test.</li>
                <li>Click <b>Save</b> to create the schedule. A confirmation will appear if successful.</li>
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
                  <span className="label-text font-medium">Select Subject</span>
                </label>
                <select
                  className="select select-bordered w-full bg-base-100"
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                >
                  <option value="">-- Select a Subject --</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Week Number</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full bg-base-100"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    min="1"
                    max="52"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Year</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full bg-base-100"
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    min="2024"
                    max="2100"
                    required
                  />
                </div>
              </div>
            </div>

            {selectedSubject && (
              <>
                {/* Bloom's Taxonomy Filter */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-medium">Filter by Bloom's Taxonomy Level</span>
                  </label>
                  <select
                    className="select select-bordered w-full bg-base-100"
                    value={bloomsFilter}
                    onChange={e => {
                      setBloomsFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">-- All Levels --</option>
                    {BLOOMS_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="card bg-base-100 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Select Questions</h2>
                <span className="text-sm text-base-content/70">
                  {selectedQuestions.length} selected
                </span>
              </div>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-base-content/70">No questions available for this subject</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentQuestions.map((question) => (
                    <div
                      key={question._id}
                      className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${selectedQuestions.includes(question._id)
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-base-200 hover:bg-base-300"
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary mt-1"
                        checked={selectedQuestions.includes(question._id)}
                        onChange={() => handleQuestionSelect(question._id)}
                      />
                      <div className="flex-grow">
                        <p className="font-medium mb-2">{question.questionText}</p>
                        <div className="flex flex-wrap gap-2">
                          {question.choices.map((choice, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 rounded-full text-sm ${choice === question.correctAnswer
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
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
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

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary gap-2"
                disabled={isLoading || selectedQuestions.length === 0}
              >
                <MdSave className="w-5 h-5" />
                Schedule Test
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WeekSchedule;
