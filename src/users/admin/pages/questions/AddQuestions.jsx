import { useState, useEffect, useMemo, useCallback } from "react";
import { MdAdd, MdDelete, MdSave, MdAnalytics, MdViewList, MdQuiz, MdSchedule, MdBookmark, MdBarChart, MdAutorenew, MdCloud, MdCloudDone, MdWarning, MdInfo, MdCheckCircle, MdError, MdClear } from "react-icons/md";
import { FaRegLightbulb, FaFileAlt, FaComments, FaChartPie, FaHistory } from 'react-icons/fa';
import { useGuideMode } from '../../../../contexts/GuideModeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dashboard & Analytics States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Auto-save States
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [lastSaved, setLastSaved] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
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
  const [chatAINumQuestions, setChatAINumQuestions] = useState(2);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { guideMode } = useGuideMode();

  const backendurl = import.meta.env.VITE_BACKEND_URL;

  // Constants for colors and styling
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
  
  // Auto-save functionality
  const saveToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('addQuestions_draft', JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
      setHasDraft(true);
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, []);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const draft = localStorage.getItem('addQuestions_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        setQuestions(parsed.questions || questions);
        setSelectedSubject(parsed.selectedSubject || "");
        setHasDraft(true);
        setLastSaved(new Date(parsed.timestamp));
        return true;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return false;
  }, [questions]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem('addQuestions_draft');
    setHasDraft(false);
    setLastSaved(null);
  }, []);

  // Enhanced question change handler with auto-validation and auto-save
  const handleQuestionChange = useCallback((index, field, value) => {
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
      updatedQuestions[index].correctAnswer = ""; // Reset correct answer
    } else {
      updatedQuestions[index][field] = value;
    }
    
    setQuestions(updatedQuestions);
    setCurrentQuestionIndex(index);
    setAutoSaveStatus('unsaved');
    
    // Auto-save after 2 seconds of inactivity
    setTimeout(() => {
      setAutoSaveStatus('saving');
      saveToLocalStorage({
        questions: updatedQuestions,
        selectedSubject
      });
    }, 2000);
  }, [questions, selectedSubject, saveToLocalStorage]);

  // Question quality scoring
  const calculateQuestionQuality = useCallback((question) => {
    let score = 0;
    let feedback = [];

    // Check question text length and clarity
    if (question.questionText.length > 20) score += 20;
    else feedback.push("Question text could be more detailed");

    // Check choices quality
    const validChoices = question.choices.filter(c => c.trim().length > 0);
    if (validChoices.length >= 3) score += 20;
    else feedback.push("Need at least 3 valid choices");

    // Check for duplicate choices
    if (new Set(validChoices).size === validChoices.length) score += 15;
    else feedback.push("Duplicate choices detected");

    // Check correct answer selection
    if (question.correctAnswer) score += 20;
    else feedback.push("No correct answer selected");

    // Check Bloom's level assignment
    if (question.bloomsLevel) score += 15;
    else feedback.push("Bloom's taxonomy level not assigned");

    // Check for question clarity (basic grammar)
    if (question.questionText.includes('?')) score += 10;
    else feedback.push("Consider ending with a question mark");

    return { score, feedback, grade: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs_improvement' };
  }, []);

  // Duplicate detection
  const findSimilarQuestions = useCallback((newQuestion) => {
    return recentQuestions.filter(q => {
      const similarity = calculateSimilarity(q.questionText, newQuestion.questionText);
      return similarity > 0.7; // 70% similarity threshold
    });
  }, [recentQuestions]);

  const calculateSimilarity = (str1, str2) => {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const totalQuestions = questions.length;
    const completedQuestions = questions.filter(q => 
      q.questionText && q.correctAnswer && q.bloomsLevel && 
      q.choices.every(c => c.trim().length > 0)
    ).length;
    
    const bySubject = subjects.map(subject => ({
      name: subject.subject,
      count: recentQuestions.filter(q => q.subject?._id === subject._id).length
    }));

    const byBloom = BLOOMS_LEVELS.map(level => ({
      name: level,
      count: questions.filter(q => q.bloomsLevel === level).length
    }));

    const qualityScores = questions.map(q => calculateQuestionQuality(q));
    const avgQuality = qualityScores.length > 0 ? 
      qualityScores.reduce((sum, q) => sum + q.score, 0) / qualityScores.length : 0;

    return {
      total: totalQuestions,
      completed: completedQuestions,
      progress: totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0,
      bySubject: bySubject.filter(s => s.count > 0),
      byBloom: byBloom.filter(b => b.count > 0),
      recentlyAdded: recentQuestions.length,
      averageQuality: Math.round(avgQuality),
      qualityScores
    };
  }, [questions, subjects, recentQuestions, calculateQuestionQuality]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch subjects
        const subjectsRes = await fetch(`${backendurl}/api/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!subjectsRes.ok) throw new Error("Failed to fetch subjects");
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData);

        // Fetch recent questions for analytics
        const questionsRes = await fetch(`${backendurl}/api/questions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          setRecentQuestions(questionsData.slice(0, 50)); // Last 50 questions
        }

        // Load draft if exists
        loadFromLocalStorage();
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError(err.message);
        if (err.message.includes('token') || err.message.includes('authentication')) {
          window.location.href = '/admin/login';
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [backendurl, loadFromLocalStorage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    // Advanced validation
    const validationErrors = [];
    
    if (!selectedSubject) {
      validationErrors.push("Please select a subject.");
    }

    questions.forEach((q, index) => {
      if (!q.questionText.trim()) {
        validationErrors.push(`Question ${index + 1}: Question text is required.`);
      }
      if (q.choices.some(choice => !choice.trim())) {
        validationErrors.push(`Question ${index + 1}: All choices must be filled.`);
      }
      if (!q.correctAnswer) {
        validationErrors.push(`Question ${index + 1}: Please select a correct answer.`);
      }
      if (!q.bloomsLevel) {
        validationErrors.push(`Question ${index + 1}: Bloom's taxonomy level is required.`);
      }

      // Check for duplicate detection
      const similarQuestions = findSimilarQuestions(q);
      if (similarQuestions.length > 0) {
        validationErrors.push(`Question ${index + 1}: Similar question already exists.`);
      }

      // Quality check
      const quality = calculateQuestionQuality(q);
      if (quality.score < 50) {
        validationErrors.push(`Question ${index + 1}: Quality score too low (${quality.score}/100).`);
      }
    });

    if (validationErrors.length > 0) {
      setError(`Validation failed:\n${validationErrors.join('\n')}`);
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

      if (!response.ok) throw new Error("Failed to submit questions");

      setSuccess(`Successfully submitted ${questions.length} questions!`);
      setQuestions([{ questionText: "", questionType: "multiple_choice", choices: ["", "", "", ""], correctAnswer: "", bloomsLevel: "" }]);
      setSelectedSubject("");
      clearDraft();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error(err);
      setError("An error occurred while submitting questions: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
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
            subjectId: aiSubject,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-2 text-base-content/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Question Creator</h1>
          <p className="text-base-content/70">Create and manage questions with AI assistance</p>
          
          {/* Auto-save Status */}
          <div className="flex items-center gap-2 mt-2">
            {autoSaveStatus === 'saving' && (
              <div className="flex items-center gap-1 text-warning">
                <MdAutorenew className="w-4 h-4 animate-spin" />
                <span className="text-xs">Saving draft...</span>
              </div>
            )}
            {autoSaveStatus === 'saved' && lastSaved && (
              <div className="flex items-center gap-1 text-success">
                <MdCloudDone className="w-4 h-4" />
                <span className="text-xs">Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            {autoSaveStatus === 'unsaved' && (
              <div className="flex items-center gap-1 text-warning">
                <MdCloud className="w-4 h-4" />
                <span className="text-xs">Unsaved changes</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {hasDraft && (
            <button
              className="btn btn-outline btn-sm"
              onClick={clearDraft}
            >
              <MdClear className="w-4 h-4" />
              Clear Draft
            </button>
          )}
              <button
            className="btn btn-primary btn-sm"
                onClick={() => setShowAIModal(true)}
              >
            <FaRegLightbulb className="w-4 h-4" />
            AI Generate
              </button>
        </div>
      </div>

      {/* Guide Mode */}
      {guideMode && (
        <div className="alert alert-info mb-6">
          <MdInfo />
          <div>
            <h4 className="font-semibold">Question Creator Guide</h4>
            <p className="text-sm">Use the dashboard to monitor your progress, create questions manually, or leverage AI for quick generation. All changes are auto-saved as drafts.</p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="alert alert-error mb-4">
          <MdError />
          <span className="whitespace-pre-line">{error}</span>
          <button onClick={() => setError('')} className="btn btn-ghost btn-xs">
            <MdClear />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <MdCheckCircle />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="btn btn-ghost btn-xs">
            <MdClear />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs tabs-boxed mb-6 bg-base-200">
              <button
          className={`tab tab-lg ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <MdAnalytics className="w-4 h-4 mr-2" />
          Dashboard
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'create' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('create')}
              >
          <MdViewList className="w-4 h-4 mr-2" />
          Create Questions ({questions.length})
              </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure text-primary">
                <MdQuiz className="w-8 h-8" />
              </div>
              <div className="stat-title">Current Questions</div>
              <div className="stat-value text-primary">{stats.total}</div>
              <div className="stat-desc">{stats.completed} completed</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure text-secondary">
                <MdSchedule className="w-8 h-8" />
              </div>
              <div className="stat-title">Progress</div>
              <div className="stat-value text-secondary">{Math.round(stats.progress)}%</div>
              <div className="stat-desc">Completion rate</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure text-accent">
                <MdBookmark className="w-8 h-8" />
              </div>
              <div className="stat-title">Quality Score</div>
              <div className="stat-value text-accent">{stats.averageQuality}</div>
              <div className="stat-desc">Average quality</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure text-info">
                <MdBarChart className="w-8 h-8" />
              </div>
              <div className="stat-title">Database Total</div>
              <div className="stat-value text-info">{stats.recentlyAdded}</div>
              <div className="stat-desc">Questions in system</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloom's Taxonomy Distribution */}
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Current Questions by Bloom's Level</h3>
                {stats.byBloom.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.byBloom}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {stats.byBloom.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-base-content/50">
                    No questions created yet
            </div>
          )}
              </div>
            </div>

            {/* Question Quality Scores */}
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Question Quality Analysis</h3>
                <div className="space-y-3">
                  {stats.qualityScores.map((score, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-16 text-xs">Q{index + 1}</span>
                      <div className="flex-1 bg-base-300 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            score.grade === 'excellent' ? 'bg-success' :
                            score.grade === 'good' ? 'bg-warning' : 'bg-error'
                          }`}
                          style={{ width: `${score.score}%` }}
                        ></div>
                      </div>
                      <span className="w-12 text-xs text-right">{score.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Database Questions */}
          {recentQuestions.length > 0 && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Recent Questions in Database</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentQuestions.slice(0, 6).map(question => (
                    <div key={question._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <h4 className="font-medium text-sm line-clamp-2 mb-2">{question.questionText}</h4>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="badge badge-xs badge-outline">
                            {question.subject?.subject || 'Unknown'}
                          </span>
                          <span className="badge badge-xs badge-primary">
                            {question.bloomsLevel}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/70">
                          {question.choices?.length || 0} choices
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Questions Tab */}
      {activeTab === 'create' && (
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

          {selectedSubject && (
            <>
              {/* Question Cards */}
              <div className="space-y-6">
                {questions.map((question, index) => {
                  const quality = calculateQuestionQuality(question);
                  const similarQuestions = findSimilarQuestions(question);
                  
                  return (
                <div
                  key={index}
                      className={`card p-4 sm:p-6 transition-all border-2 ${
                        currentQuestionIndex === index ? 'bg-primary/5 border-primary/20' : 
                        quality.grade === 'excellent' ? 'bg-success/5 border-success/20' :
                        quality.grade === 'good' ? 'bg-warning/5 border-warning/20' :
                        'bg-error/5 border-error/20'
                      }`}
                >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="badge badge-primary">
                            Question {index + 1}
                          </div>
                          <div className={`badge ${
                            quality.grade === 'excellent' ? 'badge-success' :
                            quality.grade === 'good' ? 'badge-warning' : 'badge-error'
                          }`}>
                            Quality: {quality.score}/100
                          </div>
                          {similarQuestions.length > 0 && (
                            <div className="badge badge-warning">
                              <MdWarning className="w-3 h-3 mr-1" />
                              Similar Found
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                              onClick={() => handleRemoveQuestion(index)}
                      >
                              <MdDelete className="w-4 h-4" />
                      </button>
                    )}
                        </div>
                  </div>

                      {/* Quality Feedback */}
                      {quality.feedback.length > 0 && (
                        <div className="alert alert-warning mb-4 py-2">
                          <MdWarning className="w-4 h-4" />
                          <div>
                            <ul className="text-xs list-disc list-inside">
                              {quality.feedback.map((fb, idx) => (
                                <li key={idx}>{fb}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Question Content */}
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Question Text</span>
                          </label>
                    <textarea
                            className="textarea textarea-bordered h-20 bg-base-100"
                            placeholder="Enter your question here..."
                            value={question.questionText}
                      onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)}
                            onFocus={() => setCurrentQuestionIndex(index)}
                    />
                  </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Question Type</span>
                    </label>
                    <select
                              className="select select-bordered bg-base-100"
                              value={question.questionType}
                      onChange={(e) => handleQuestionChange(index, "questionType", e.target.value)}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                              <option value="true_false">True/False</option>
                    </select>
                  </div>

                          <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Bloom's Taxonomy Level</span>
                    </label>
                    <select
                              className="select select-bordered bg-base-100"
                              value={question.bloomsLevel}
                      onChange={(e) => handleQuestionChange(index, "bloomsLevel", e.target.value)}
                    >
                              <option value="">Select Level</option>
                              {BLOOMS_LEVELS.map((level) => (
                                <option key={level} value={level}>
                                  {level}
                                </option>
                      ))}
                    </select>
                          </div>
                  </div>

                        {/* Answer Choices */}
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Answer Choices</span>
                          </label>
                          <div className={`grid ${question.questionType === "true_false" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"} gap-3`}>
                            {question.choices.map((choice, choiceIndex) => (
                              <div key={choiceIndex} className="flex items-center gap-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="badge badge-outline">
                                    {String.fromCharCode(65 + choiceIndex)}
                                  </span>
                        <input
                          type="text"
                                    className="input input-bordered flex-1 bg-base-100"
                                    placeholder={`Choice ${String.fromCharCode(65 + choiceIndex)}`}
                          value={choice}
                          onChange={(e) =>
                            handleQuestionChange(index, "choices", {
                              choiceIndex,
                              choiceValue: e.target.value,
                            })
                          }
                                    disabled={question.questionType === "true_false"}
                                  />
                                  <input
                                    type="radio"
                                    name={`correct-${index}`}
                                    className="radio radio-primary"
                                    checked={question.correctAnswer === choice}
                                    onChange={() => handleQuestionChange(index, "correctAnswer", choice)}
                                    disabled={!choice}
                                  />
                                </div>
                      </div>
                    ))}
                  </div>
                          <div className="label">
                            <span className="label-text-alt text-base-content/70">
                              Select the radio button next to the correct answer
                            </span>
                </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                {/* AI Generation Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    className="btn btn-accent gap-2 flex-1"
                    onClick={() => setShowAIModal(true)}
                  >
                    🤖 Generate with AI
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-outline gap-2"
                    onClick={handleAddQuestion}
                  >
                    <MdAdd className="w-4 h-4" />
                    Add Manual Question
                  </button>
                </div>

                {/* Save Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                    className="btn btn-primary gap-2 flex-1"
                disabled={isSubmitting}
              >
                    <MdSave className="w-4 h-4" />
                    {isSubmitting ? "Submitting..." : "Submit All Questions"}
              </button>
            </div>
              </div>
            </>
                    )}
          </form>
      )}

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
                          <li>Set how many questions you want to generate (1–15).</li>
                        </ol>
                      )}
                      {aiGenerationMethod === AI_GENERATION_METHODS.FILE && (
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Select a .docx, .pdf, or .pptx file from your computer.</li>
                          <li>Choose the subject and Bloom's Taxonomy level.</li>
                          <li>Set how many questions you want to generate (1–15).</li>
                          <li>Optionally add custom instructions to guide the AI.</li>
                        </ol>
                      )}
                      {aiGenerationMethod === AI_GENERATION_METHODS.CHAT && (
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Select the subject for your questions.</li>
                          <li>Write your prompt in natural language. <span className="tooltip tooltip-info ml-1" data-tip="Describe what kind of questions you want.">ℹ️</span></li>
                          <li>Set how many questions you want to generate (1–15).</li>
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
                      <label className="label font-semibold">How many questions? (1-15)</label>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        className="input input-bordered w-full bg-base-100"
                        value={aiNumQuestions}
                        onChange={e => setAINumQuestions(Math.max(1, Math.min(15, Number(e.target.value))))}
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
    </div>
  );
};

export default AddQuestions;
