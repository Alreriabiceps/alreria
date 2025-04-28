import { useState, useEffect } from "react";
import { MdAdd, MdDelete, MdSave } from "react-icons/md";

const AddQuestions = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState([
    { questionText: "", choices: ["", "", "", ""], correctAnswer: "" }
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backendurl = import.meta.env.VITE_BACKEND_URL;

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
        if (!res.ok) {
          throw new Error("Failed to fetch subjects");
        }
        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch subjects", err);
        if (err.message.includes('token') || err.message.includes('authentication')) {
          window.location.href = '/admin/login';
        }
      }
    };
    fetchSubjects();
  }, [backendurl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!selectedSubject) {
      setError("Please select a subject.");
      setIsSubmitting(false);
      return;
    }

    const hasEmptyFields = questions.some(
      (q) =>
        !q.questionText ||
        q.choices.some(choice => !choice) ||
        !q.correctAnswer
    );

    if (hasEmptyFields) {
      setError("Please fill in all fields for each question.");
      setIsSubmitting(false);
      return;
    }

    const formattedData = {
      subjectId: selectedSubject,
      questions: questions.map((q) => ({
        questionText: q.questionText,
        choices: q.choices,
        correctAnswer: q.correctAnswer
      })),
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${backendurl}/api/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) throw new Error("Failed to submit");

      alert("Questions submitted successfully!");
      setQuestions([{ questionText: "", choices: ["", "", "", ""], correctAnswer: "" }]);
      setSelectedSubject("");
    } catch (err) {
      console.error(err);
      setError("An error occurred while submitting questions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    if (field === "choices") {
      updatedQuestions[index].choices[value.choiceIndex] = value.choiceValue;
    } else {
      updatedQuestions[index][field] = value;
    }
    setQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", choices: ["", "", "", ""], correctAnswer: "" }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      setError("You must have at least one question.");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">Add Questions</h1>
            <button
              onClick={handleAddQuestion}
              className="btn btn-primary btn-sm gap-2"
            >
              <MdAdd className="w-5 h-5" />
              Add Question
            </button>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Select Subject</span>
              </label>
              <select
                className="select select-bordered w-full bg-base-100"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">-- Choose a Subject --</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="card bg-base-100 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="btn btn-ghost btn-sm text-error"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="form-control mb-4">
                    <textarea
                      placeholder="Enter your question"
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)}
                      className="textarea textarea-bordered w-full bg-base-100"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-answer-${index}`}
                          className="radio radio-primary"
                          checked={q.correctAnswer === choice}
                          onChange={() => handleQuestionChange(index, "correctAnswer", choice)}
                        />
                        <input
                          type="text"
                          placeholder={`Choice ${choiceIndex + 1}`}
                          value={choice}
                          onChange={(e) =>
                            handleQuestionChange(index, "choices", {
                              choiceIndex,
                              choiceValue: e.target.value,
                            })
                          }
                          className="input input-bordered w-full bg-base-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary gap-2"
                disabled={isSubmitting}
              >
                <MdSave className="w-5 h-5" />
                {isSubmitting ? "Submitting..." : "Save Questions"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddQuestions;
