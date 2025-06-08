import React, { useState, useEffect } from 'react';
import { 
  MdTrendingUp, 
  MdPeople, 
  MdQuiz, 
  MdAssessment, 
  MdFileDownload,
  MdDateRange,
  MdBarChart,
  MdPieChart,
  MdShowChart
} from 'react-icons/md';
import { useAuth } from '../../../../contexts/AuthContext';
import { useGuideMode } from '../../../../contexts/GuideModeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');
  const [customReportBuilder, setCustomReportBuilder] = useState({
    isOpen: false,
    selectedMetrics: [],
    selectedFilters: {},
    chartType: 'bar'
  });
  const [savedReports, setSavedReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    students: {},
    questions: {},
    subjects: {},
    tests: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');
  const { token } = useAuth();
  const { guideMode } = useGuideMode();

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const availableMetrics = [
    { key: 'totalStudents', label: 'Total Students', category: 'students' },
    { key: 'activeStudents', label: 'Active Students', category: 'students' },
    { key: 'averageScore', label: 'Average Score', category: 'performance' },
    { key: 'completionRate', label: 'Completion Rate', category: 'performance' },
    { key: 'totalQuestions', label: 'Total Questions', category: 'content' },
    { key: 'totalTests', label: 'Total Tests', category: 'content' }
  ];

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' },
    { value: 'doughnut', label: 'Doughnut Chart', icon: '🍩' }
  ];

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token) return;
      
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${backendUrl}/api/admin/analytics?range=${dateRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
        // Generate mock data for demo
        setAnalyticsData(generateMockData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [token, dateRange, backendUrl]);

  // Generate mock data for demonstration
  const generateMockData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return {
      overview: {
        totalStudents: 156,
        activeStudents: 134,
        totalQuestions: 450,
        totalTests: 24,
        averageScore: 78.5,
        completionRate: 85.2
      },
      students: {
        registrationTrend: {
          labels: last30Days.slice(-7),
          data: [5, 8, 3, 12, 6, 9, 4]
        },
        performanceByTrack: {
          labels: ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL-ICT'],
          data: [82.3, 79.1, 75.8, 77.4, 73.2]
        },
        topPerformers: [
          { name: 'Juan Dela Cruz', track: 'STEM', score: 95.2 },
          { name: 'Maria Santos', track: 'ABM', score: 93.8 },
          { name: 'Jose Garcia', track: 'STEM', score: 91.5 },
          { name: 'Ana Rodriguez', track: 'HUMSS', score: 89.7 },
          { name: 'Pedro Martinez', track: 'GAS', score: 88.3 }
        ],
        activityHeatmap: last30Days.map(date => ({
          date,
          count: Math.floor(Math.random() * 50) + 10
        }))
      },
      questions: {
        difficultyDistribution: {
          labels: ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'],
          data: [85, 102, 87, 76, 54, 46]
        },
        accuracyBySubject: {
          labels: ['Math', 'Science', 'English', 'History', 'Filipino'],
          data: [74.2, 68.9, 82.1, 79.3, 76.8]
        },
        mostMissedQuestions: [
          { question: 'What is the quadratic formula?', subject: 'Math', accuracy: 45.2 },
          { question: 'Explain photosynthesis process', subject: 'Science', accuracy: 52.1 },
          { question: 'Identify the main theme in the story', subject: 'English', accuracy: 58.7 }
        ]
      },
      subjects: {
        popularity: {
          labels: ['Mathematics', 'Science', 'English', 'History', 'Filipino'],
          data: [89, 76, 92, 65, 71]
        },
        performance: {
          labels: ['Mathematics', 'Science', 'English', 'History', 'Filipino'],
          data: [74.2, 68.9, 82.1, 79.3, 76.8]
        }
      },
      tests: {
        completionTrend: {
          labels: last30Days.slice(-7),
          data: [78, 82, 75, 88, 85, 79, 83]
        },
        averageScoreTrend: {
          labels: last30Days.slice(-7),
          data: [76.2, 78.1, 74.8, 79.5, 77.3, 78.9, 80.1]
        }
      }
    };
  };

  // Export functionality
  const handleExport = async (type) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/analytics/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          format: exportFormat,
          dateRange,
          activeTab
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // For demo, just download a sample report
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${type}-${Date.now()}.${exportFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export functionality not implemented yet');
    }
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  // Custom Report Builder Functions
  const openReportBuilder = () => {
    setCustomReportBuilder({
      ...customReportBuilder,
      isOpen: true
    });
  };

  const buildCustomReport = () => {
    const reportConfig = {
      id: Date.now(),
      name: `Custom Report ${new Date().toLocaleDateString()}`,
      metrics: customReportBuilder.selectedMetrics,
      filters: customReportBuilder.selectedFilters,
      chartType: customReportBuilder.chartType,
      dateRange,
      createdAt: new Date().toISOString()
    };
    
    setSavedReports(prev => [reportConfig, ...prev]);
    setCustomReportBuilder({ isOpen: false, selectedMetrics: [], selectedFilters: {}, chartType: 'bar' });
  };

  const scheduleReport = (reportId, frequency) => {
    const newSchedule = {
      id: Date.now(),
      reportId,
      frequency, // daily, weekly, monthly
      nextRun: getNextRunDate(frequency),
      isActive: true
    };
    
    setScheduledReports(prev => [...prev, newSchedule]);
  };

  const getNextRunDate = (frequency) => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      default:
        return now;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-base-200 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-3 sm:p-6">
          {/* Enhanced Header with Comparison Toggle */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
                <MdBarChart className="w-6 h-6 sm:w-8 sm:h-8" />
                Analytics & Reports
              </h1>
              <p className="text-sm sm:text-base text-base-content/70 mt-1">Comprehensive insights into your learning platform</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <label className="label cursor-pointer">
                  <span className="label-text mr-2 text-sm">Compare</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-sm toggle-primary"
                    checked={comparisonMode}
                    onChange={(e) => setComparisonMode(e.target.checked)}
                  />
                </label>
                {comparisonMode && (
                  <select
                    className="select select-bordered select-sm bg-base-100"
                    value={comparisonPeriod}
                    onChange={(e) => setComparisonPeriod(e.target.value)}
                  >
                    <option value="previous">vs Previous Period</option>
                    <option value="year">vs Same Period Last Year</option>
                  </select>
                )}
              </div>
              
              <select
                className="select select-bordered select-sm bg-base-100"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
              
              <button
                className="btn btn-outline btn-sm gap-2"
                onClick={openReportBuilder}
              >
                🔧 Custom Report
              </button>
              
              <div className="flex gap-2">
                <select
                  className="select select-bordered select-sm bg-base-100"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
                <button
                  className="btn btn-primary btn-sm gap-2"
                  onClick={() => handleExport(activeTab)}
                >
                  <MdFileDownload className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {guideMode && (
            <details className="mb-6 bg-info/10 border border-info rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-info mb-1">How to use Analytics & Reports?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>Use the tabs to switch between different analytics views.</li>
                <li>Change the date range to view data for different time periods.</li>
                <li>Export reports in PDF, Excel, or CSV format for offline analysis.</li>
                <li>Hover over charts for detailed information about data points.</li>
              </ol>
            </details>
          )}

          {error && (
            <div className="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Tabs with Report Management */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div className="tabs tabs-boxed bg-base-100 flex-wrap">
              <button
                className={`tab tab-sm sm:tab-lg ${activeTab === 'overview' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <MdTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Over</span>
              </button>
              <button
                className={`tab tab-sm sm:tab-lg ${activeTab === 'students' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <MdPeople className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Students</span>
                <span className="sm:hidden">Stud</span>
              </button>
              <button
                className={`tab tab-sm sm:tab-lg ${activeTab === 'questions' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                <MdQuiz className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Questions</span>
                <span className="sm:hidden">Ques</span>
              </button>
              <button
                className={`tab tab-sm sm:tab-lg ${activeTab === 'subjects' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('subjects')}
              >
                <MdAssessment className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Subjects</span>
                <span className="sm:hidden">Subj</span>
              </button>
              <button
                className={`tab tab-sm sm:tab-lg ${activeTab === 'tests' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('tests')}
              >
                <MdShowChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tests</span>
                <span className="sm:hidden">Test</span>
              </button>
              <button
                className={`tab tab-sm sm:tab-lg ${activeTab === 'custom' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('custom')}
              >
                🔧 <span className="hidden sm:inline ml-1">Custom Reports</span>
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                <div className="card bg-base-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-base-content/70">Total Students</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.totalStudents}</p>
                      <p className="text-xs text-success">+12% from last month</p>
                    </div>
                    <MdPeople className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="card bg-base-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-base-content/70">Active Students</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.activeStudents}</p>
                      <p className="text-xs text-success">+8% from last month</p>
                    </div>
                    <MdTrendingUp className="w-8 h-8 text-success" />
                  </div>
                </div>
                <div className="card bg-base-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-base-content/70">Average Score</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.averageScore}%</p>
                      <p className="text-xs text-success">+2.3% from last month</p>
                    </div>
                    <MdBarChart className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <div className="card bg-base-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-base-content/70">Total Questions</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.totalQuestions}</p>
                      <p className="text-xs text-info">+45 new this month</p>
                    </div>
                    <MdQuiz className="w-8 h-8 text-secondary" />
                  </div>
                </div>
                <div className="card bg-base-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-base-content/70">Completion Rate</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.completionRate}%</p>
                      <p className="text-xs text-success">+5.2% from last month</p>
                    </div>
                    <MdAssessment className="w-8 h-8 text-warning" />
                  </div>
                </div>
                <div className="card bg-base-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-base-content/70">Total Tests</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.totalTests}</p>
                      <p className="text-xs text-info">+3 new this week</p>
                    </div>
                    <MdDateRange className="w-8 h-8 text-error" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Registration Trend */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Student Registration Trend</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: analyticsData.students.registrationTrend?.labels || [],
                        datasets: [
                          {
                            label: 'New Registrations',
                            data: analyticsData.students.registrationTrend?.data || [],
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>

                {/* Performance by Track */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Performance by Track</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: analyticsData.students.performanceByTrack?.labels || [],
                        datasets: [
                          {
                            label: 'Average Score (%)',
                            data: analyticsData.students.performanceByTrack?.data || [],
                            backgroundColor: [
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(245, 158, 11, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                              'rgba(139, 92, 246, 0.8)',
                            ],
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="card bg-base-100 p-4">
                <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Track</th>
                        <th>Average Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.students.topPerformers?.map((student, index) => (
                        <tr key={index}>
                          <td className="font-bold">#{index + 1}</td>
                          <td>{student.name}</td>
                          <td>
                            <span className="badge badge-outline">{student.track}</span>
                          </td>
                          <td>
                            <span className="font-bold text-success">{student.score}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Difficulty Distribution */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Questions by Bloom's Taxonomy</h3>
                  <div className="h-64">
                    <Doughnut
                      data={{
                        labels: analyticsData.questions.difficultyDistribution?.labels || [],
                        datasets: [
                          {
                            data: analyticsData.questions.difficultyDistribution?.data || [],
                            backgroundColor: [
                              '#3B82F6',
                              '#10B981',
                              '#F59E0B',
                              '#EF4444',
                              '#8B5CF6',
                              '#06B6D4',
                            ],
                          },
                        ],
                      }}
                      options={pieChartOptions}
                    />
                  </div>
                </div>

                {/* Accuracy by Subject */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Question Accuracy by Subject</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: analyticsData.questions.accuracyBySubject?.labels || [],
                        datasets: [
                          {
                            label: 'Accuracy (%)',
                            data: analyticsData.questions.accuracyBySubject?.data || [],
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
              </div>

              {/* Most Missed Questions */}
              <div className="card bg-base-100 p-4">
                <h3 className="text-lg font-semibold mb-4">Most Challenging Questions</h3>
                <div className="space-y-3">
                  {analyticsData.questions.mostMissedQuestions?.map((question, index) => (
                    <div key={index} className="p-3 bg-base-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{question.question}</p>
                          <span className="badge badge-outline badge-sm mt-1">{question.subject}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-base-content/70">Accuracy</span>
                          <p className="font-bold text-error">{question.accuracy}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subjects Tab */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Popularity */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Subject Popularity</h3>
                  <div className="h-64">
                    <Pie
                      data={{
                        labels: analyticsData.subjects.popularity?.labels || [],
                        datasets: [
                          {
                            data: analyticsData.subjects.popularity?.data || [],
                            backgroundColor: [
                              '#3B82F6',
                              '#10B981',
                              '#F59E0B',
                              '#EF4444',
                              '#8B5CF6',
                            ],
                          },
                        ],
                      }}
                      options={pieChartOptions}
                    />
                  </div>
                </div>

                {/* Subject Performance */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Average Performance by Subject</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: analyticsData.subjects.performance?.labels || [],
                        datasets: [
                          {
                            label: 'Average Score (%)',
                            data: analyticsData.subjects.performance?.data || [],
                            backgroundColor: 'rgba(139, 92, 246, 0.8)',
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Completion Trend */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Test Completion Rate Trend</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: analyticsData.tests.completionTrend?.labels || [],
                        datasets: [
                          {
                            label: 'Completion Rate (%)',
                            data: analyticsData.tests.completionTrend?.data || [],
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>

                {/* Average Score Trend */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Average Score Trend</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: analyticsData.tests.averageScoreTrend?.labels || [],
                        datasets: [
                          {
                            label: 'Average Score (%)',
                            data: analyticsData.tests.averageScoreTrend?.data || [],
                            borderColor: 'rgb(245, 158, 11)',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Reports Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Saved Reports */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Saved Reports</h3>
                  {savedReports.length === 0 ? (
                    <p className="text-center text-base-content/70 py-8">No saved reports yet</p>
                  ) : (
                    <div className="space-y-3">
                      {savedReports.map(report => (
                        <div key={report.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                          <div>
                            <h4 className="font-medium">{report.name}</h4>
                            <p className="text-sm text-base-content/70">
                              {report.metrics.length} metrics • {report.chartType}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button className="btn btn-xs btn-primary">Run</button>
                            <button 
                              className="btn btn-xs btn-outline"
                              onClick={() => scheduleReport(report.id, 'weekly')}
                            >
                              Schedule
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduled Reports */}
                <div className="card bg-base-100 p-4">
                  <h3 className="text-lg font-semibold mb-4">Scheduled Reports</h3>
                  {scheduledReports.length === 0 ? (
                    <p className="text-center text-base-content/70 py-8">No scheduled reports</p>
                  ) : (
                    <div className="space-y-3">
                      {scheduledReports.map(schedule => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                          <div>
                            <h4 className="font-medium">Report #{schedule.reportId}</h4>
                            <p className="text-sm text-base-content/70">
                              {schedule.frequency} • Next: {schedule.nextRun.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`badge badge-sm ${schedule.isActive ? 'badge-success' : 'badge-error'}`}>
                              {schedule.isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Report Builder Modal */}
          {customReportBuilder.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 backdrop-blur-sm bg-black/40 -z-10"></div>
              <div className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-primary">🔧 Custom Report Builder</h2>
                  <button
                    className="btn btn-ghost btn-circle"
                    onClick={() => setCustomReportBuilder({...customReportBuilder, isOpen: false})}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Metrics Selection */}
                  <div>
                    <h3 className="font-semibold mb-3">Select Metrics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {availableMetrics.map(metric => (
                        <label key={metric.key} className="cursor-pointer label">
                          <span className="label-text">{metric.label}</span>
                          <input 
                            type="checkbox" 
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={customReportBuilder.selectedMetrics.includes(metric.key)}
                            onChange={(e) => {
                              const metrics = e.target.checked 
                                ? [...customReportBuilder.selectedMetrics, metric.key]
                                : customReportBuilder.selectedMetrics.filter(m => m !== metric.key);
                              setCustomReportBuilder({
                                ...customReportBuilder,
                                selectedMetrics: metrics
                              });
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Chart Type Selection */}
                  <div>
                    <h3 className="font-semibold mb-3">Chart Type</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {chartTypes.map(chart => (
                        <label key={chart.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="chartType"
                            value={chart.value}
                            checked={customReportBuilder.chartType === chart.value}
                            onChange={(e) => setCustomReportBuilder({
                              ...customReportBuilder,
                              chartType: e.target.value
                            })}
                            className="radio radio-primary radio-sm mr-2"
                          />
                          <span>{chart.icon} {chart.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button 
                      className="btn btn-primary flex-1"
                      onClick={buildCustomReport}
                      disabled={customReportBuilder.selectedMetrics.length === 0}
                    >
                      💾 Save Report
                    </button>
                    <button 
                      className="btn btn-outline flex-1"
                      onClick={buildCustomReport}
                      disabled={customReportBuilder.selectedMetrics.length === 0}
                    >
                      ▶️ Run Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 