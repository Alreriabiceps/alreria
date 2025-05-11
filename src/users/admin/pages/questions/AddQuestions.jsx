import { useState, useEffect } from "react";
import { MdAdd, MdDelete, MdSave } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const BLOOMS_LEVELS = [
  "Remembering",
  "Understanding",
  "Applying",
  "Analyzing",
  "Evaluating",
  "Creating"
];

const AddQuestions = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState([
    { questionText: "", choices: ["", "", "", ""], correctAnswer: "", bloomsLevel: "" }
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSubject, setAISubject] = useState("");
  const [aiBloomsLevel, setAIBloomsLevel] = useState("");
  const [aiTopic, setAITopic] = useState("");
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState("");
  const [aiGeneratedQuestions, setAIGeneratedQuestions] = useState([]);
  const [aiNumQuestions, setAINumQuestions] = useState(2);
  const [showFileAIModal, setShowFileAIModal] = useState(false);
  const [file, setFile] = useState(null);
  const [fileExtractedText, setFileExtractedText] = useState("");
  const [fileAIQuestions, setFileAIQuestions] = useState([]);
  const [fileAILoading, setFileAILoading] = useState(false);
  const [fileAIError, setFileAIError] = useState("");
  const [fileAISubject, setFileAISubject] = useState("");
  const [fileAIBloomsLevel, setFileAIBloomsLevel] = useState("");
  const [fileAINumQuestions, setFileAINumQuestions] = useState(2);
  const [fileAICustomPrompt, setFileAICustomPrompt] = useState("");
  const { guideMode } = useGuideMode();

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

    // Ensure every question has a non-empty bloomsLevel
    const hasEmptyFields = questions.some(
      (q) =>
        !q.questionText ||
        q.choices.some(choice => !choice) ||
        !q.correctAnswer ||
        !q.bloomsLevel
    );

    if (hasEmptyFields) {
      setError("Please fill in all fields for each question, including Bloom's Taxonomy Level.");
      setIsSubmitting(false);
      return;
    }

    const formattedData = {
      subjectId: selectedSubject,
      questions: questions.map((q) => ({
        questionText: q.questionText,
        choices: q.choices,
        correctAnswer: q.correctAnswer,
        bloomsLevel: q.bloomsLevel
      })),
    };
    console.log("Submitting questions:", JSON.stringify(formattedData, null, 2));

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
      setQuestions([{ questionText: "", choices: ["", "", "", ""], correctAnswer: "", bloomsLevel: "" }]);
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
      { questionText: "", choices: ["", "", "", ""], correctAnswer: "", bloomsLevel: "" }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      setError("You must have at least one question.");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // AI Generate Handler
  const handleAIGenerate = async (e) => {
    e.preventDefault();
    setAIError("");
    setAILoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      if (!aiSubject || !aiBloomsLevel || !aiTopic || !aiNumQuestions) {
        setAIError("Please fill all fields.");
        setAILoading(false);
        return;
      }
      const res = await fetch(`${backendurl}/api/generate-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectId: aiSubject,
          bloomsLevel: aiBloomsLevel,
          topic: aiTopic,
          numQuestions: aiNumQuestions
        })
      });
      if (!res.ok) throw new Error("Failed to generate questions");
      const data = await res.json();
      setAIGeneratedQuestions(data);
    } catch (err) {
      setAIError(err.message || "Error generating questions");
    } finally {
      setAILoading(false);
    }
  };

  // Add generated questions to main questions list
  const handleAddAIGenerated = () => {
    setSelectedSubject(aiSubject); // Sync subject
    if (aiGeneratedQuestions.length > 0) {
      setQuestions([
        // Replace first question with the first generated one
        {
          questionText: aiGeneratedQuestions[0].questionText || "",
          choices: aiGeneratedQuestions[0].choices || ["", "", "", ""],
          correctAnswer: aiGeneratedQuestions[0].correctAnswer || "",
          bloomsLevel: aiGeneratedQuestions[0].bloomsLevel || aiBloomsLevel || ""
        },
        // Append the rest
        ...aiGeneratedQuestions.slice(1).map(q => ({
          questionText: q.questionText || "",
          choices: q.choices || ["", "", "", ""],
          correctAnswer: q.correctAnswer || "",
          bloomsLevel: q.bloomsLevel || aiBloomsLevel || ""
        }))
      ]);
    }
    setAIGeneratedQuestions([]);
    setShowAIModal(false);
    setAISubject("");
    setAIBloomsLevel("");
    setAITopic("");
    setAIError("");
    setAINumQuestions(2);
  };

  // File AI Modal handler
  const handleFileAIGenerate = async (e) => {
    e.preventDefault();
    setFileAIError("");
    setFileAILoading(true);
    setFileExtractedText("");
    setFileAIQuestions([]);
    try {
      if (!file) throw new Error("No file selected");
      if (!fileAISubject || !fileAIBloomsLevel) throw new Error("Please select subject and Bloom's level");
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', fileAISubject);
      formData.append('bloomsLevel', fileAIBloomsLevel);
      formData.append('numQuestions', fileAINumQuestions);
      if (fileAICustomPrompt) formData.append('customPrompt', fileAICustomPrompt);
      const res = await fetch(`${backendurl}/api/questions/generate-questions-from-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) throw new Error("Failed to generate questions from file");
      const data = await res.json();
      if (data.extractedText) setFileExtractedText(data.extractedText.slice(0, 3000));
      setFileAIQuestions(data.questions || []);
    } catch (err) {
      setFileAIError(err.message || "Error generating questions from file");
    } finally {
      setFileAILoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {guideMode && (
          <details open className="mb-6 bg-base-200 border border-primary rounded p-3">
            <summary className="cursor-pointer font-medium text-base text-primary mb-1">How to use the Add Questions page?</summary>
            <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
              <li>You can manually add questions, generate them with AI, or upload a file for AI-based question generation.</li>
              <li>To add questions manually, select a subject, fill in the question, choices, correct answer, and Bloom's Taxonomy level for each question.</li>
              <li>To use AI, click <b>Generate with AI</b> and follow the instructions in the modal.</li>
              <li>To generate questions from a file, click <b>Upload File for AI</b> and follow the instructions in the modal.</li>
              <li>Review all questions before saving. You can edit or remove any question before submitting.</li>
            </ol>
          </details>
        )}
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">Add Questions</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAIModal(true)}
                className="btn btn-accent btn-sm gap-2"
              >
                Generate with AI
              </button>
              <label className="btn btn-secondary btn-sm gap-2 cursor-pointer">
                <input
                  type="file"
                  accept=".docx,.pdf,.pptx"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const uploadedFile = e.target.files[0];
                    setFile(uploadedFile);
                    setShowFileAIModal(true);
                  }}
                />
                Upload File for AI
              </label>
              <button
                onClick={handleAddQuestion}
                className="btn btn-primary btn-sm gap-2"
              >
                <MdAdd className="w-5 h-5" />
                Add Question
              </button>
            </div>
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

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Bloom's Taxonomy Level</span>
                    </label>
                    <select
                      className="select select-bordered w-full bg-base-100"
                      value={q.bloomsLevel}
                      onChange={(e) => handleQuestionChange(index, "bloomsLevel", e.target.value)}
                    >
                      <option value="">-- Select Level --</option>
                      {BLOOMS_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
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

          {/* AI Modal */}
          {showAIModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 backdrop-blur-sm bg-black/20 -z-10"></div>
              <div className="bg-base-100 rounded-lg shadow-lg p-6 w-full max-w-lg relative overflow-y-auto max-h-[80vh]">
                <button
                  className="absolute top-2 right-2 btn btn-ghost btn-sm"
                  onClick={() => { setShowAIModal(false); setAIGeneratedQuestions([]); setAIError(""); }}
                >
                  ✕
                </button>
                <h2 className="text-lg font-bold mb-4">Generate Questions with AI</h2>
                <details className="mb-4">
                  <summary className="cursor-pointer font-medium text-primary">How to use this feature?</summary>
                  <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                    <li>Select the subject for your questions.</li>
                    <li>Choose the Bloom's Taxonomy level that matches the type of questions you want.</li>
                    <li>Enter the topic you want questions about (for example, "Photosynthesis").</li>
                    <li>Set how many questions you want to generate (1–5).</li>
                    <li>Click <b>Generate</b>. The AI will create multiple-choice questions for you to review and edit before saving.</li>
                  </ol>
                </details>
                <form onSubmit={handleAIGenerate} className="space-y-4">
                  <div className="form-control">
                    <label className="label">Subject</label>
                    <select
                      className="select select-bordered w-full bg-base-100"
                      value={aiSubject}
                      onChange={e => setAISubject(e.target.value)}
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>{subject.subject}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">Bloom's Taxonomy Level</label>
                    <select
                      className="select select-bordered w-full bg-base-100"
                      value={aiBloomsLevel}
                      onChange={e => setAIBloomsLevel(e.target.value)}
                    >
                      <option value="">-- Select Level --</option>
                      {BLOOMS_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">Topic</label>
                    <input
                      className="input input-bordered w-full bg-base-100"
                      value={aiTopic}
                      onChange={e => setAITopic(e.target.value)}
                      placeholder="e.g. Law of Demand"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">How many questions? (max 10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="input input-bordered w-full bg-base-100"
                      value={aiNumQuestions}
                      onChange={e => setAINumQuestions(Math.max(1, Math.min(10, Number(e.target.value))))}
                    />
                  </div>
                  {aiError && <div className="alert alert-error py-2">{aiError}</div>}
                  <button
                    type="submit"
                    className="btn btn-accent w-full"
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Generating..." : "Generate"}
                  </button>
                </form>
                {/* Show generated questions for review/edit */}
                {aiGeneratedQuestions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Generated Questions</h3>
                    {aiGeneratedQuestions.map((q, idx) => {
                      const choices = Array.isArray(q.choices) && q.choices.length === 4 ? q.choices : ["", "", "", ""];
                      return (
                        <div key={idx} className="card bg-base-200 p-4 mb-3">
                          <div className="form-control mb-2">
                            <label className="label">Question Text</label>
                            <input
                              className="input input-bordered w-full bg-base-100"
                              value={q.questionText}
                              onChange={e => {
                                const updated = [...aiGeneratedQuestions];
                                updated[idx].questionText = e.target.value;
                                setAIGeneratedQuestions(updated);
                              }}
                            />
                          </div>
                          <div className="form-control mb-2">
                            <label className="label">Bloom's Taxonomy Level</label>
                            <select
                              className="select select-bordered w-full bg-base-100"
                              value={q.bloomsLevel || aiBloomsLevel}
                              onChange={e => {
                                const updated = [...aiGeneratedQuestions];
                                updated[idx].bloomsLevel = e.target.value;
                                setAIGeneratedQuestions(updated);
                              }}
                            >
                              <option value="">-- Select Level --</option>
                              {BLOOMS_LEVELS.map(level => (
                                <option key={level} value={level}>{level}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            {choices.map((choice, cidx) => (
                              <div key={cidx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`ai-correct-${idx}`}
                                  className="radio radio-primary"
                                  checked={q.correctAnswer === choice}
                                  onChange={() => {
                                    const updated = [...aiGeneratedQuestions];
                                    updated[idx].correctAnswer = choice;
                                    setAIGeneratedQuestions(updated);
                                  }}
                                />
                                <input
                                  className="input input-bordered w-full bg-base-100"
                                  value={choice}
                                  onChange={e => {
                                    const updated = [...aiGeneratedQuestions];
                                    updated[idx].choices = [...choices];
                                    updated[idx].choices[cidx] = e.target.value;
                                    setAIGeneratedQuestions(updated);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <button
                      className="btn btn-primary w-full mt-2"
                      onClick={handleAddAIGenerated}
                    >
                      Add to Questions
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File AI Modal */}
          {showFileAIModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 backdrop-blur-sm bg-black/20 -z-10"></div>
              <div className="bg-base-100 rounded-lg shadow-lg p-6 w-full max-w-lg relative overflow-y-auto max-h-[80vh]">
                <button
                  className="absolute top-2 right-2 btn btn-ghost btn-sm"
                  onClick={() => {
                    setShowFileAIModal(false);
                    setFile(null);
                    setFileExtractedText("");
                    setFileAIQuestions([]);
                    setFileAIError("");
                  }}
                >
                  ✕
                </button>
                <h2 className="text-lg font-bold mb-4">Generate Questions from File</h2>
                <details className="mb-4">
                  <summary className="cursor-pointer font-medium text-primary">How to use this feature?</summary>
                  <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                    <li>Click <b>Upload File for AI</b> and select a .docx, .pdf, or .pptx file from your computer.</li>
                    <li>Select the subject for your questions.</li>
                    <li>Choose the Bloom's Taxonomy level that matches the type of questions you want.</li>
                    <li>Set how many questions you want to generate (1–5).</li>
                    <li>(Optional) Add custom instructions to guide the AI (for example, "Focus on chapter 2").</li>
                    <li>Click <b>Generate</b>. The AI will extract text from your file and create multiple-choice questions for you to review and edit before saving.</li>
                  </ol>
                </details>
                <form className="space-y-4" onSubmit={handleFileAIGenerate}>
                  <div className="form-control">
                    <label className="label">Subject</label>
                    <select
                      className="select select-bordered w-full bg-base-100"
                      value={fileAISubject}
                      onChange={e => setFileAISubject(e.target.value)}
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>{subject.subject}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">Bloom's Taxonomy Level</label>
                    <select
                      className="select select-bordered w-full bg-base-100"
                      value={fileAIBloomsLevel}
                      onChange={e => setFileAIBloomsLevel(e.target.value)}
                    >
                      <option value="">-- Select Level --</option>
                      {BLOOMS_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">How many questions? (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="input input-bordered w-full bg-base-100"
                      value={fileAINumQuestions}
                      onChange={e => setFileAINumQuestions(Math.max(1, Math.min(5, Number(e.target.value))))}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">Custom Instructions (optional)</label>
                    <textarea
                      className="textarea textarea-bordered w-full bg-base-100"
                      value={fileAICustomPrompt}
                      onChange={e => setFileAICustomPrompt(e.target.value)}
                      placeholder="e.g. Focus on chapter 2, or generate questions about memory management"
                      rows={2}
                    />
                  </div>
                  {file && (
                    <div className="form-control">
                      <label className="label">Selected File</label>
                      <div className="p-2 bg-base-200 rounded">{file.name}</div>
                    </div>
                  )}
                  {fileAIError && <div className="alert alert-error py-2">{fileAIError}</div>}
                  <button
                    type="submit"
                    className="btn btn-accent w-full"
                    disabled={fileAILoading || !file || !fileAISubject || !fileAIBloomsLevel}
                  >
                    {fileAILoading ? "Generating..." : "Generate"}
                  </button>
                </form>
                {/* Show extracted text preview (optional) */}
                {fileExtractedText && (
                  <div className="form-control mt-4">
                    <label className="label">Extracted Text (preview)</label>
                    <textarea
                      className="textarea textarea-bordered w-full bg-base-100"
                      value={fileExtractedText.slice(0, 3000)}
                      rows="4"
                      readOnly
                    />
                  </div>
                )}
                {/* Show generated questions for review/edit */}
                {fileAIQuestions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Generated Questions</h3>
                    {fileAIQuestions.map((q, idx) => {
                      const choices = Array.isArray(q.choices) && q.choices.length === 4 ? q.choices : ["", "", "", ""];
                      return (
                        <div key={idx} className="card bg-base-200 p-4 mb-3">
                          <div className="form-control mb-2">
                            <label className="label">Question Text</label>
                            <input
                              className="input input-bordered w-full bg-base-100"
                              value={q.questionText}
                              onChange={e => {
                                const updated = [...fileAIQuestions];
                                updated[idx].questionText = e.target.value;
                                setFileAIQuestions(updated);
                              }}
                            />
                          </div>
                          <div className="form-control mb-2">
                            <label className="label">Bloom's Taxonomy Level</label>
                            <select
                              className="select select-bordered w-full bg-base-100"
                              value={q.bloomsLevel || fileAIBloomsLevel}
                              onChange={e => {
                                const updated = [...fileAIQuestions];
                                updated[idx].bloomsLevel = e.target.value;
                                setFileAIQuestions(updated);
                              }}
                            >
                              <option value="">-- Select Level --</option>
                              {BLOOMS_LEVELS.map(level => (
                                <option key={level} value={level}>{level}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            {choices.map((choice, cidx) => (
                              <div key={cidx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`file-ai-correct-${idx}`}
                                  className="radio radio-primary"
                                  checked={q.correctAnswer === choice}
                                  onChange={() => {
                                    const updated = [...fileAIQuestions];
                                    updated[idx].correctAnswer = choice;
                                    setFileAIQuestions(updated);
                                  }}
                                />
                                <input
                                  className="input input-bordered w-full bg-base-100"
                                  value={choice}
                                  onChange={e => {
                                    const updated = [...fileAIQuestions];
                                    updated[idx].choices = [...choices];
                                    updated[idx].choices[cidx] = e.target.value;
                                    setFileAIQuestions(updated);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <button
                      className="btn btn-primary w-full mt-2"
                      onClick={() => {
                        setSelectedSubject(fileAISubject);
                        setQuestions([
                          ...fileAIQuestions.map(q => ({
                            questionText: q.questionText || "",
                            choices: q.choices || ["", "", "", ""],
                            correctAnswer: q.correctAnswer || "",
                            bloomsLevel: q.bloomsLevel || fileAIBloomsLevel || ""
                          }))
                        ]);
                        setShowFileAIModal(false);
                        setFile(null);
                        setFileExtractedText("");
                        setFileAIQuestions([]);
                        setFileAIError("");
                      }}
                    >
                      Add to Questions
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddQuestions;
