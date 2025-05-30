import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdSave, MdClose } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const QuestionList = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
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

  // Add effect to update filtered questions when filters or questions change
  useEffect(() => {
    const filtered = questions.filter(q => {
      const matchesBlooms = !bloomsFilter || q.bloomsLevel === bloomsFilter;
      console.log("Filtering question:", {
        question: q.questionText,
        bloomsLevel: q.bloomsLevel,
        matchesBlooms
      });
      return matchesBlooms;
    });
    console.log("Filtered questions:", filtered);
    setFilteredQuestions(filtered);
  }, [questions, bloomsFilter]);

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
        // Ensure each question has a questionType property
        const processedData = data.map(q => ({
          ...q,
          questionType: q.questionType || "multiple_choice"
        }));
        console.log("Fetched questions:", processedData);
        setQuestions(processedData);
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

  // Add effect to log when filters change
  useEffect(() => {
    console.log("Filters changed:", { bloomsFilter });
  }, [bloomsFilter]);

  // Add effect to log when questions change
  useEffect(() => {
    console.log("Questions updated:", questions);
  }, [questions]);

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
      
      if (choicesToSave.length > 0) {
        const payload = {
          questionText: editQuestion.questionText,
          questionType: "multiple_choice",
          choices: choicesToSave,
          correctAnswer: editQuestion.correctAnswer,
          bloomsLevel: editQuestion.bloomsLevel
        };
        console.log("Saving question with ID:", editQuestion._id);
        console.log("Payload to send:", JSON.stringify(payload, null, 2));

        const response = await fetch(
          `${backendUrl}/api/questions/${editQuestion._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
          }
        );
        if (response.ok) {
          const updatedQuestion = await response.json();
          console.log("Received updated question:", updatedQuestion);
          setQuestions((prev) =>
            prev.map((q) => (q._id === updatedQuestion._id ? updatedQuestion : q))
          );
          setEditQuestion(null);
          setError(""); // Clear error on success
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save question edit");
        }
      } else {
        setError("Please add at least one choice before saving.");
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      setError("Error saving edit: " + error.message);
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
            <details className="mb-6 bg-secondary/10 border border-secondary rounded p-3">
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

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Bloom's Taxonomy Filter */}
            <div className="form-control">
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
              {filteredQuestions.map((question) => (
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
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">
                            {question.questionText}
                          </h3>
                          <div className="flex gap-4 mt-2 text-sm text-base-content/70">
                            <span>
                              <span className="font-semibold">Type:</span>{" "}
                              {question.questionType === "multiple_choice" ? "Multiple Choice" : "Multiple Choice"}
                            </span>
                            <span>
                              <span className="font-semibold">Bloom's Level:</span>{" "}
                              {question.bloomsLevel || <span className="italic">Not set</span>}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              const questionDataForEdit = {
                                ...question,
                                questionType: "multiple_choice",
                                choices: question.choices.map(choiceText => ({
                                  text: choiceText,
                                  isCorrect: choiceText === question.correctAnswer,
                                })),
                              };
                              setEditQuestion(questionDataForEdit);
                              setError("");
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
                        {question.choices.map((choice, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg ${
                              question.correctAnswer === choice
                                ? "bg-success text-success-content font-bold"
                                : "bg-base-200"
                            }`}
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