import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdSave, MdClose } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const QuestionList = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editQuestion, setEditQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const BLOOMS_LEVELS = [
    "Remembering",
    "Understanding",
    "Applying",
    "Analyzing",
    "Evaluating",
    "Creating"
  ];
  const [bloomsFilter, setBloomsFilter] = useState("");
  const { guideMode } = useGuideMode();

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchQuestionsForSubject(selectedSubject);
    } else {
      setQuestions([]);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${backendUrl}/api/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      } else {
        setError("Failed to fetch subjects.");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setError("Error fetching subjects.");
    }
  };

  const fetchQuestionsForSubject = async (subjectId) => {
    setIsLoading(true);
    setError("");
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${backendUrl}/api/questions/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        setQuestions([]);
        setError("No questions found for this subject.");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
      setError("Error fetching questions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleEditChange = (field, value) => {
    setEditQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Transform choices back for saving
      const choicesToSave = editQuestion.choices.map(choiceObj => choiceObj.text);
      const correctChoice = editQuestion.choices.find(choiceObj => choiceObj.isCorrect);
      
      if (choicesToSave.length > 0 && !correctChoice) {
        setError("Please select a correct answer before saving.");
        return;
      }
      const correctAnswerToSave = correctChoice ? correctChoice.text : "";

      const payload = {
        questionText: editQuestion.questionText,
        choices: choicesToSave,
        correctAnswer: correctAnswerToSave,
      };
      console.log("Saving question with ID:", editQuestion._id);
      console.log("Payload to send:", JSON.stringify(payload, null, 2)); // Pretty print JSON

      const response = await fetch(
        `${backendUrl}/api/questions/${editQuestion._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload), // Use the payload variable
        }
      );
      if (response.ok) {
        const updatedQuestion = await response.json();
        // Normalize choices to array of strings (in case backend returns objects)
        const normalizedQuestion = {
          ...updatedQuestion,
          choices: Array.isArray(updatedQuestion.choices)
            ? updatedQuestion.choices.map(c => typeof c === 'string' ? c : c.text)
            : [],
        };
        setQuestions((prev) =>
          prev.map((q) => (q._id === normalizedQuestion._id ? normalizedQuestion : q))
        );
        setEditQuestion(null);
        setError(""); // Clear error on success
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save question edit");
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      setError("Error saving edit: " + error.message);
      if (error.message.includes('token') || error.message.includes('authentication')) {
        // Consider redirecting to login if token is invalid
        // navigate('/admin/login'); 
      }
    }
  };

  const handleCancelEdit = () => {
    setEditQuestion(null);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/questions/${questionId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q._id !== questionId));
      } else {
        setError("Failed to delete question.");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      setError("Error deleting question.");
    }
  };

  const handleEditQuestionChange = (e) => {
    handleEditChange("questionText", e.target.value);
  };

  const handleChoiceChange = (index, e) => {
    const updatedChoices = [...editQuestion.choices];
    updatedChoices[index].text = e.target.value;
    handleEditChange("choices", updatedChoices);
  };

  const handleCorrectAnswerChange = (index) => {
    const updatedChoices = editQuestion.choices.map((choice, i) => ({
      ...choice,
      isCorrect: i === index,
    }));
    handleEditChange("choices", updatedChoices);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-primary mb-6">Question List</h1>

          {guideMode && (
            <details open className="mb-6 bg-secondary/10 border border-secondary rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-secondary mb-1">How to use the Question List page?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>Select a subject to view its questions.</li>
                <li>Filter questions by Bloom's Taxonomy level if needed.</li>
                <li>Edit or delete questions using the icons next to each question.</li>
                <li>All changes are saved automatically or after confirmation.</li>
              </ol>
            </details>
          )}

          {error && (
            <div className="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          {/* Subject Selector */}
          <div className="form-control mb-6">
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

          {/* Bloom's Taxonomy Filter */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium">Filter by Bloom's Taxonomy Level</span>
            </label>
            <select
              className="select select-bordered w-full bg-base-100"
              value={bloomsFilter}
              onChange={e => setBloomsFilter(e.target.value)}
            >
              <option value="">-- All Levels --</option>
              {BLOOMS_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}

          {/* Questions List */}
          {!isLoading && selectedSubject && questions.length > 0 && (
            <div className="space-y-4">
              {(
                bloomsFilter
                  ? questions.filter(q => q.bloomsLevel === bloomsFilter)
                  : questions
              ).map((question) => (
                <div
                  key={question._id}
                  className="card bg-base-100 p-4 rounded-lg"
                >
                  {editQuestion && editQuestion._id === question._id ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Edit Question</h3>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={handleCancelEdit}
                        >
                          <MdClose className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="form-control">
                        <textarea
                          value={editQuestion.questionText}
                          onChange={handleEditQuestionChange}
                          className="textarea textarea-bordered w-full bg-base-100"
                          placeholder="Edit Question Text"
                          rows="3"
                        />
                      </div>
                      {/* Bloom's Taxonomy Level Dropdown (Edit) */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Bloom's Taxonomy Level</span>
                        </label>
                        <select
                          className="select select-bordered w-full bg-base-100"
                          value={editQuestion.bloomsLevel || ""}
                          onChange={e => handleEditChange("bloomsLevel", e.target.value)}
                        >
                          <option value="">-- Select Level --</option>
                          <option value="Remembering">Remembering</option>
                          <option value="Understanding">Understanding</option>
                          <option value="Applying">Applying</option>
                          <option value="Analyzing">Analyzing</option>
                          <option value="Evaluating">Evaluating</option>
                          <option value="Creating">Creating</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="label">
                          <span className="label-text font-medium">Choices</span>
                        </label>
                        {editQuestion.choices.map((choice, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-answer-${question._id}`}
                              className="radio radio-primary"
                              checked={choice.isCorrect}
                              onChange={() => handleCorrectAnswerChange(i)}
                            />
                            <input
                              type="text"
                              value={choice.text}
                              onChange={(e) => handleChoiceChange(i, e)}
                              className="input input-bordered w-full bg-base-100"
                              placeholder={`Choice ${i + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <button
                          className="btn btn-primary gap-2"
                          onClick={handleSaveEdit}
                        >
                          <MdSave className="w-5 h-5" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold">
                          {question.questionText}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              const questionDataForEdit = {
                                ...question,
                                choices: question.choices.map(choiceText => ({
                                  text: choiceText,
                                  isCorrect: choiceText === question.correctAnswer,
                                })),
                              };
                              setEditQuestion(questionDataForEdit);
                              setError(""); // Clear error when starting edit
                            }}
                          >
                            <MdEdit className="w-5 h-5" />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleDeleteQuestion(question._id)}
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-base-content/70 mb-2">
                          <span className="font-semibold">Bloom's Taxonomy Level:</span> {question.bloomsLevel || <span className="italic">Not set</span>}
                        </div>
                        {question.choices.map((choice, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg ${question.correctAnswer === choice ? "bg-success text-success-content font-bold" : "bg-base-200"}`}
                          >
                            {choice}
                            {question.correctAnswer === choice && (
                              <span className="ml-2 text-xs font-semibold">(Correct Answer)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionList;