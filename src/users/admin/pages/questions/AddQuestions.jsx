import { useState, useEffect } from "react";
import { MdAdd, MdDelete, MdSave } from "react-icons/md";
import { FaRegLightbulb, FaFileAlt, FaComments } from 'react-icons/fa';
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const BLOOMS_LEVELS = [
  "Remembering",
  "Understanding",
  "Applying",
  "Analyzing",
  "Evaluating",
  "Creating"
];

const AI_GENERATION_METHODS = {
  TOPIC: 'topic',
  FILE: 'file',
  CHAT: 'chat'
};

const AddQuestions = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState([
    { questionText: "", questionType: "multiple_choice", choices: ["", "", "", ""], correctAnswer: "", bloomsLevel: "" }
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerationMethod, setAIGenerationMethod] = useState(AI_GENERATION_METHODS.TOPIC);
  const [aiSubject, setAISubject] = useState("");
  const [aiBloomsLevel, setAIBloomsLevel] = useState("");
  const [aiTopic, setAITopic] = useState("");
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState("");
  const [aiGeneratedQuestions, setAIGeneratedQuestions] = useState([]);
  const [aiNumQuestions, setAINumQuestions] = useState(2);
  const [aiQuestionType, setAIQuestionType] = useState("multiple_choice");
  const [file, setFile] = useState(null);
  const [fileExtractedText, setFileExtractedText] = useState("");
  const [aiPrompt, setAIPrompt] = useState("");
  const [fileAICustomPrompt, setFileAICustomPrompt] = useState("");
  const [showFileAIModal, setShowFileAIModal] = useState(false);
  const [fileAIQuestions, setFileAIQuestions] = useState([]);
  const [fileAILoading, setFileAILoading] = useState(false);
  const [fileAIError, setFileAIError] = useState("");
  const [fileAISubject, setFileAISubject] = useState("");
  const [fileAIBloomsLevel, setFileAIBloomsLevel] = useState("");
  const [fileAINumQuestions, setFileAINumQuestions] = useState(2);
  const [showChatAIModal, setShowChatAIModal] = useState(false);
  const [chatAIPrompt, setChatAIPrompt] = useState("");
  const [chatAILoading, setChatAILoading] = useState(false);
  const [chatAIError, setChatAIError] = useState("");
  const [chatAIGeneratedQuestions, setChatAIGeneratedQuestions] = useState([]);
  const [chatAISubject, setChatAISubject] = useState("");
  const [chatAINumQuestions, setChatAINumQuestions] = useState(2);
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
      setQuestions([{ questionText: "", questionType: "multiple_choice", choices: ["", "", "", ""], correctAnswer: "", bloomsLevel: "" }]);
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
    } else if (field === "questionType") {
      updatedQuestions[index].questionType = value;
      if (value === "true_false") {
        updatedQuestions[index].choices = ["True", "False"];
      } else {
        updatedQuestions[index].choices = ["", "", "", ""];
      }
    } else {
      updatedQuestions[index][field] = value;
    }
    setQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", questionType: "multiple_choice", choices: ["", "", "", ""], correctAnswer: "", bloomsLevel: "" }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      setError("You must have at least one question.");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Unified AI Generate Handler
  const handleAIGenerate = async (e) => {
    e.preventDefault();
    setAIError("");
    setAILoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      if (!aiSubject) {
        setAIError("Please select a subject.");
        setAILoading(false);
        return;
      }
      
      // Validation based on selected method
      if (aiGenerationMethod === AI_GENERATION_METHODS.TOPIC) {
        if (!aiTopic || !aiBloomsLevel) {
          setAIError("Please fill all required fields for Topic Based generation.");
          setAILoading(false);
          return;
        }
      } else if (aiGenerationMethod === AI_GENERATION_METHODS.FILE) {
        if (!file || !aiBloomsLevel) {
          setAIError("Please select a file and Bloom's level for File Upload generation.");
          setAILoading(false);
          return;
        }
      } else if (aiGenerationMethod === AI_GENERATION_METHODS.CHAT) {
         if (!aiPrompt || !aiBloomsLevel) { // Add check for aiBloomsLevel
          setAIError("Please fill all required fields for Chat Style generation.");
          setAILoading(false);
          return;
        }
      }

      let endpoint = '';
      let body = {};

      switch (aiGenerationMethod) {
        case AI_GENERATION_METHODS.TOPIC:
          endpoint = `${backendurl}/api/generate-questions`;
          body = {
            subjectId: aiSubject,
            bloomsLevel: aiBloomsLevel,
            topic: aiTopic,
            numQuestions: aiNumQuestions,
            questionType: aiQuestionType
          };
          break;
        case AI_GENERATION_METHODS.FILE: {
          endpoint = `${backendurl}/api/questions/generate-questions-from-file`;
          const formData = new FormData();
          formData.append('file', file);
          formData.append('subjectId', aiSubject);
          formData.append('bloomsLevel', aiBloomsLevel); // Ensure using unified state
          formData.append('numQuestions', aiNumQuestions);
          formData.append('questionType', aiQuestionType);
          if (fileAICustomPrompt) formData.append('customPrompt', fileAICustomPrompt);
          body = formData;
          break;
        }
        case AI_GENERATION_METHODS.CHAT:
          endpoint = `${backendurl}/api/generate-questions-chat`;
          body = {
            subjectId: chatAISubject,
            bloomsLevel: aiBloomsLevel, // Add bloomsLevel for Chat
            prompt: aiPrompt,
            numQuestions: aiNumQuestions,
            questionType: aiQuestionType
          };
          break;
      }

      const headers = {
        "Authorization": `Bearer ${token}`
      };

      if (aiGenerationMethod !== AI_GENERATION_METHODS.FILE) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: aiGenerationMethod === AI_GENERATION_METHODS.FILE ? body : JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Failed to generate questions");
      const data = await res.json();

      if (aiGenerationMethod === AI_GENERATION_METHODS.FILE && data.extractedText) {
        setFileExtractedText(data.extractedText.slice(0, 3000));
      } else {
         setFileExtractedText(""); // Clear extracted text if not file method
      }

      // Ensure the generated questions match the selected question type
      const processedQuestions = (data.questions || data).map(q => {
        if (aiQuestionType === 'true_false') {
          let correct = (q.correctAnswer === true || q.correctAnswer === 'True') ? 'True' : 'False';
          // If the questionText itself is a statement, keep as is, else try to extract
          return {
            ...q,
            choices: ["True", "False"],
            correctAnswer: correct
          };
        }
        return q;
      });

      setAIGeneratedQuestions(processedQuestions);
    } catch (err) {
      setAIError(err.message || "Error generating questions");
    } finally {
      setAILoading(false);
    }
  };

  // Add generated questions to main questions list
  const handleAddAIGenerated = () => {
    setSelectedSubject(aiSubject);
    if (aiGeneratedQuestions.length > 0) {
      setQuestions([
        ...questions,
        ...aiGeneratedQuestions.map(q => {
          if (aiQuestionType === 'true_false') {
            return {
              questionText: q.questionText || "",
              choices: ["True", "False"],
              correctAnswer: (q.correctAnswer === true || q.correctAnswer === 'True') ? 'True' : 'False',
              bloomsLevel: q.bloomsLevel || aiBloomsLevel || ""
            };
          }
          return {
            questionText: q.questionText || "",
            choices: q.choices || ["", "", "", ""],
            correctAnswer: q.correctAnswer || "",
            bloomsLevel: q.bloomsLevel || aiBloomsLevel || ""
          };
        })
      ]);
    }
    setAIGeneratedQuestions([]);
    setShowAIModal(false);
    setAISubject("");
    setAIBloomsLevel("");
    setAITopic("");
    setAIPrompt("");
    setFileAICustomPrompt("");
    setFile(null);
    setFileExtractedText("");
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
      formData.append('questionType', aiQuestionType);
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
      // Ensure the generated questions match the selected question type
      const processedQuestions = (data.questions || data).map(q => {
        if (aiQuestionType === 'true_false') {
          let correct = (q.correctAnswer === true || q.correctAnswer === 'True') ? 'True' : 'False';
          return {
            ...q,
            choices: ["True", "False"],
            correctAnswer: correct
          };
        }
        return q;
      });
      setFileAIQuestions(processedQuestions);
    } catch (err) {
      setFileAIError(err.message || "Error generating questions from file");
    } finally {
      setFileAILoading(false);
    }
  };

  // Chat AI Generate Handler
  const handleChatAIGenerate = async (e) => {
    e.preventDefault();
    setChatAIError("");
    setChatAILoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      if (!chatAISubject || !chatAIPrompt) {
        setChatAIError("Please fill all required fields.");
        setChatAILoading(false);
        return;
      }
      const res = await fetch(`${backendurl}/api/generate-questions-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectId: chatAISubject,
          prompt: chatAIPrompt,
          numQuestions: chatAINumQuestions
        })
      });
      if (!res.ok) throw new Error("Failed to generate questions");
      const data = await res.json();
      // Ensure the generated questions match the selected question type
      const processedQuestions = (data.questions || data).map(q => {
        if (aiQuestionType === 'true_false') {
          let correct = (q.correctAnswer === true || q.correctAnswer === 'True') ? 'True' : 'False';
          return {
            ...q,
            choices: ["True", "False"],
            correctAnswer: correct
          };
        }
        return q;
      });
      setChatAIGeneratedQuestions(processedQuestions);
    } catch (err) {
      setChatAIError(err.message || "Error generating questions");
    } finally {
      setChatAILoading(false);
    }
  };

  // Add chat AI generated questions to main questions list
  const handleAddChatAIGenerated = () => {
    setSelectedSubject(chatAISubject);
    if (chatAIGeneratedQuestions.length > 0) {
      setQuestions([
        ...chatAIGeneratedQuestions.map(q => ({
          questionText: q.questionText || "",
          choices: q.choices || ["", "", "", ""],
          correctAnswer: q.correctAnswer || "",
          bloomsLevel: q.bloomsLevel || ""
        }))
      ]);
    }
    setChatAIGeneratedQuestions([]);
    setShowChatAIModal(false);
    setChatAISubject("");
    setChatAIPrompt("");
    setChatAIError("");
    setChatAINumQuestions(2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          {guideMode && (
            <details className="mb-6 bg-base-200 border border-primary rounded p-3">
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">Add Questions</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAIModal(true)}
                className="btn btn-accent btn-sm gap-2"
              >
                Generate with AI
              </button>
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
                      <span className="label-text font-medium">Question Type</span>
                    </label>
                    <select
                      className="select select-bordered w-full bg-base-100"
                      value={q.questionType}
                      onChange={(e) => handleQuestionChange(index, "questionType", e.target.value)}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True or False</option>
                    </select>
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

          {/* Unified AI Modal */}
          {showAIModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 backdrop-blur-sm bg-black/40 -z-10"></div>
              <div className="bg-base-100 rounded-2xl shadow-2xl p-0 w-full max-w-2xl relative overflow-y-auto max-h-[90vh] border border-primary/30">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-base-200">
                  <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                      <FaRegLightbulb className="text-accent" /> AI Question Generator
                    </h2>
                    <p className="text-base-content/70 text-sm mt-1">Use AI to quickly generate multiple-choice questions. Choose a method below.</p>
                  </div>
                  <button
                    className="btn btn-ghost btn-circle text-xl"
                    onClick={() => {
                      setShowAIModal(false);
                      setAIGeneratedQuestions([]);
                      setAIError("");
                    }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 px-6 pt-4 pb-2 border-b border-base-200">
                  <button
                    className={`flex-1 tab tab-lg ${aiGenerationMethod === AI_GENERATION_METHODS.TOPIC ? 'tab-active bg-accent/10 border-accent text-accent' : 'bg-base-200'}`}
                    onClick={() => setAIGenerationMethod(AI_GENERATION_METHODS.TOPIC)}
                  >
                    <FaRegLightbulb className="inline mr-2" /> Topic
                  </button>
                  <button
                    className={`flex-1 tab tab-lg ${aiGenerationMethod === AI_GENERATION_METHODS.FILE ? 'tab-active bg-secondary/10 border-secondary text-secondary' : 'bg-base-200'}`}
                    onClick={() => setAIGenerationMethod(AI_GENERATION_METHODS.FILE)}
                  >
                    <FaFileAlt className="inline mr-2" /> File
                  </button>
                  <button
                    className={`flex-1 tab tab-lg ${aiGenerationMethod === AI_GENERATION_METHODS.CHAT ? 'tab-active bg-info/10 border-info text-info' : 'bg-base-200'}`}
                    onClick={() => setAIGenerationMethod(AI_GENERATION_METHODS.CHAT)}
                  >
                    <FaComments className="inline mr-2" /> Chat
                  </button>
                </div>
                {/* Tab Content */}
                <div className="px-6 py-4 space-y-4">
                  <details className="mb-2">
                    <summary className="cursor-pointer font-medium text-primary">How to use this feature?</summary>
                    <div className="mt-2 text-sm text-base-content space-y-2">
                      {aiGenerationMethod === AI_GENERATION_METHODS.TOPIC && (
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Select the subject for your questions.</li>
                          <li>Choose the Bloom's Taxonomy level.</li>
                          <li>Enter the topic you want questions about.</li>
                          <li>Set how many questions you want to generate (1–5).</li>
                        </ol>
                      )}
                      {aiGenerationMethod === AI_GENERATION_METHODS.FILE && (
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Select a .docx, .pdf, or .pptx file from your computer.</li>
                          <li>Choose the subject and Bloom's Taxonomy level.</li>
                          <li>Set how many questions you want to generate (1–5).</li>
                          <li>Optionally add custom instructions to guide the AI.</li>
                        </ol>
                      )}
                      {aiGenerationMethod === AI_GENERATION_METHODS.CHAT && (
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Select the subject for your questions.</li>
                          <li>Write your prompt in natural language. <span className="tooltip tooltip-info ml-1" data-tip="Describe what kind of questions you want.">ℹ️</span></li>
                          <li>Set how many questions you want to generate (1–5).</li>
                        </ol>
                      )}
                    </div>
                  </details>
                  <form onSubmit={handleAIGenerate} className="space-y-4">
                    <div className="form-control">
                      <label className="label font-semibold">Subject</label>
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
                      <label className="label font-semibold">Question Type</label>
                      <select
                        className="select select-bordered w-full bg-base-100"
                        value={aiQuestionType}
                        onChange={e => setAIQuestionType(e.target.value)}
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True or False</option>
                      </select>
                    </div>

                    {aiGenerationMethod === AI_GENERATION_METHODS.TOPIC && (
                      <>
                        <div className="form-control">
                          <label className="label font-semibold">Bloom's Taxonomy Level</label>
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
                          <label className="label font-semibold">Topic</label>
                          <input
                            className="input input-bordered w-full bg-base-100"
                            value={aiTopic}
                            onChange={e => setAITopic(e.target.value)}
                            placeholder="e.g. Law of Demand"
                          />
                        </div>
                      </>
                    )}

                    {aiGenerationMethod === AI_GENERATION_METHODS.FILE && (
                      <>
                        <div className="form-control">
                          <label className="label font-semibold">Bloom's Taxonomy Level</label>
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
                          <label className="label font-semibold">Upload File</label>
                          <input
                            type="file"
                            accept=".docx,.pdf,.pptx"
                            className="file-input file-input-bordered w-full bg-base-100"
                            onChange={(e) => setFile(e.target.files[0])}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label font-semibold">Custom Instructions <span className="tooltip tooltip-info ml-1" data-tip="Optional: e.g. Focus on chapter 2">ℹ️</span></label>
                          <textarea
                            className="textarea textarea-bordered w-full bg-base-100"
                            value={fileAICustomPrompt}
                            onChange={e => setFileAICustomPrompt(e.target.value)}
                            placeholder="e.g. Focus on chapter 2, or generate questions about memory management"
                            rows={2}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label font-semibold">Bloom's Taxonomy Level</label>
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
                      </>
                    )}

                    {aiGenerationMethod === AI_GENERATION_METHODS.CHAT && (
                      <>
                        <div className="form-control">
                          <label className="label font-semibold">Your Prompt</label>
                          <textarea
                            className="textarea textarea-bordered w-full bg-base-100"
                            value={aiPrompt}
                            onChange={e => setAIPrompt(e.target.value)}
                            placeholder="Describe what kind of questions you want to generate..."
                            rows={4}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label font-semibold">Bloom's Taxonomy Level</label>
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
                      </>
                    )}

                    <div className="form-control">
                      <label className="label font-semibold">How many questions? (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="input input-bordered w-full bg-base-100"
                        value={aiNumQuestions}
                        onChange={e => setAINumQuestions(Math.max(1, Math.min(5, Number(e.target.value))))}
                      />
                    </div>

                    {aiError && <div className="alert alert-error py-2">{aiError}</div>}

                    <button
                      type="submit"
                      className="btn btn-accent w-full mt-2"
                      disabled={aiLoading}
                    >
                      {aiLoading ? "Generating..." : "Generate"}
                    </button>
                  </form>

                  {/* Show extracted text preview for file upload */}
                  {aiGenerationMethod === AI_GENERATION_METHODS.FILE && fileExtractedText && (
                    <div className="form-control mt-4">
                      <label className="label font-semibold">Extracted Text (preview)</label>
                      <textarea
                        className="textarea textarea-bordered w-full bg-base-100"
                        value={fileExtractedText}
                        rows="4"
                        readOnly
                      />
                    </div>
                  )}

                  {/* Generated Questions Section */}
                  {aiGeneratedQuestions.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2 text-lg text-primary">Generated Questions</h3>
                      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {aiGeneratedQuestions.map((q, idx) => {
                          const choices = Array.isArray(q.choices) && q.choices.length === 4 ? q.choices : ["", "", "", ""];
                          return (
                            <div key={idx} className="card bg-base-200 p-4 mb-1 shadow border border-base-300">
                              <div className="form-control mb-2">
                                <label className="label font-semibold">Question Text</label>
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
                                <label className="label font-semibold">Bloom's Taxonomy Level</label>
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
                      </div>
                      <button
                        className="btn btn-primary w-full mt-4"
                        onClick={handleAddAIGenerated}
                      >
                        Add to Questions
                      </button>
                    </div>
                  )}
                </div>
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

          {/* Chat AI Modal */}
          {showChatAIModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 backdrop-blur-sm bg-black/20 -z-10"></div>
              <div className="bg-base-100 rounded-lg shadow-lg p-6 w-full max-w-lg relative overflow-y-auto max-h-[80vh]">
                <button
                  className="absolute top-2 right-2 btn btn-ghost btn-sm"
                  onClick={() => {
                    setShowChatAIModal(false);
                    setChatAIGeneratedQuestions([]);
                    setChatAIError("");
                  }}
                >
                  ✕
                </button>
                <h2 className="text-lg font-bold mb-4">Chat AI Question Generator</h2>
                <details className="mb-4">
                  <summary className="cursor-pointer font-medium text-primary">How to use this feature?</summary>
                  <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                    <li>Select the subject for your questions.</li>
                    <li>Write your prompt in natural language. For example:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>"Generate questions about photosynthesis focusing on the light-dependent reactions"</li>
                        <li>"Create questions testing understanding of Newton's laws with real-world examples"</li>
                        <li>"Make questions about the water cycle suitable for middle school students"</li>
                      </ul>
                    </li>
                    <li>Set how many questions you want to generate (1–5).</li>
                    <li>Click <b>Generate</b>. The AI will create questions based on your prompt.</li>
                  </ol>
                </details>
                <form onSubmit={handleChatAIGenerate} className="space-y-4">
                  <div className="form-control">
                    <label className="label">Subject</label>
                    <select
                      className="select select-bordered w-full bg-base-100"
                      value={chatAISubject}
                      onChange={e => setChatAISubject(e.target.value)}
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>{subject.subject}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">Your Prompt</label>
                    <textarea
                      className="textarea textarea-bordered w-full bg-base-100"
                      value={chatAIPrompt}
                      onChange={e => setChatAIPrompt(e.target.value)}
                      placeholder="Describe what kind of questions you want to generate..."
                      rows={4}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">How many questions? (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="input input-bordered w-full bg-base-100"
                      value={chatAINumQuestions}
                      onChange={e => setChatAINumQuestions(Math.max(1, Math.min(5, Number(e.target.value))))}
                    />
                  </div>
                  {chatAIError && <div className="alert alert-error py-2">{chatAIError}</div>}
                  <button
                    type="submit"
                    className="btn btn-info w-full"
                    disabled={chatAILoading}
                  >
                    {chatAILoading ? "Generating..." : "Generate"}
                  </button>
                </form>
                {/* Show generated questions for review/edit */}
                {chatAIGeneratedQuestions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Generated Questions</h3>
                    {chatAIGeneratedQuestions.map((q, idx) => {
                      const choices = Array.isArray(q.choices) && q.choices.length === 4 ? q.choices : ["", "", "", ""];
                      return (
                        <div key={idx} className="card bg-base-200 p-4 mb-3">
                          <div className="form-control mb-2">
                            <label className="label">Question Text</label>
                            <input
                              className="input input-bordered w-full bg-base-100"
                              value={q.questionText}
                              onChange={e => {
                                const updated = [...chatAIGeneratedQuestions];
                                updated[idx].questionText = e.target.value;
                                setChatAIGeneratedQuestions(updated);
                              }}
                            />
                          </div>
                          <div className="form-control mb-2">
                            <label className="label">Bloom's Taxonomy Level</label>
                            <select
                              className="select select-bordered w-full bg-base-100"
                              value={q.bloomsLevel}
                              onChange={e => {
                                const updated = [...chatAIGeneratedQuestions];
                                updated[idx].bloomsLevel = e.target.value;
                                setChatAIGeneratedQuestions(updated);
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
                                  name={`chat-ai-correct-${idx}`}
                                  className="radio radio-primary"
                                  checked={q.correctAnswer === choice}
                                  onChange={() => {
                                    const updated = [...chatAIGeneratedQuestions];
                                    updated[idx].correctAnswer = choice;
                                    setChatAIGeneratedQuestions(updated);
                                  }}
                                />
                                <input
                                  className="input input-bordered w-full bg-base-100"
                                  value={choice}
                                  onChange={e => {
                                    const updated = [...chatAIGeneratedQuestions];
                                    updated[idx].choices = [...choices];
                                    updated[idx].choices[cidx] = e.target.value;
                                    setChatAIGeneratedQuestions(updated);
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
                      onClick={handleAddChatAIGenerated}
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
