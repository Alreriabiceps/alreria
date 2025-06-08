import React, { useState, useEffect } from 'react';
import { MdPeople, MdQuiz, MdBook, MdCalendarToday, MdWarning, MdCheckCircle, MdPendingActions } from 'react-icons/md';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalQuestions: 0,
    totalSubjects: 0,
    totalWeeklyTests: 0,
    activePlayers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState({
    topStudents: [],
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 5
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!token) {
          console.error('No token found in AuthContext');
          navigate('/admin/login');
          return;
        }

        if (!user || user.role !== 'admin') {
          console.error('User is not an admin:', user);
          navigate('/admin/login');
          return;
        }

        console.log('Fetching dashboard data with token:', token);

        // Fetch statistics
        const statsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Stats response status:', statsResponse.status);
        console.log('Stats response headers:', Object.fromEntries(statsResponse.headers.entries()));

        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          console.error('Stats response error text:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText };
          }
          console.error('Stats response error:', errorData);
          throw new Error(errorData.error || `Failed to fetch dashboard statistics (${statsResponse.status})`);
        }

        const statsData = await statsResponse.json();
        console.log('Stats data received:', statsData);
        setStats(statsData);

        // Fetch recent activity
        const activityResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/dashboard/activity`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!activityResponse.ok) {
          const errorData = await activityResponse.json();
          console.error('Activity response error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch recent activity');
        }

        const activityData = await activityResponse.json();
        console.log('Activity data received:', activityData);
        setRecentActivity(activityData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
        if (err.message.includes('token') || err.message.includes('unauthorized')) {
          navigate('/admin/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, user, navigate]);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <MdPeople className="w-8 h-8" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Total Questions',
      value: stats.totalQuestions,
      icon: <MdQuiz className="w-8 h-8" />,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Subjects',
      value: stats.totalSubjects,
      icon: <MdBook className="w-8 h-8" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: 'Weekly Tests',
      value: stats.totalWeeklyTests,
      icon: <MdCalendarToday className="w-8 h-8" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-base-200 rounded-lg shadow-lg p-3 sm:p-6">
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-base-200 rounded-lg shadow-lg p-3 sm:p-6">
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 17a9 9 0 100-18 9 9 0 000 18z" />
              </svg>
              <span>{error}</span>
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Admin Dashboard</h1>
              <p className="text-sm text-base-content/70">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge badge-success gap-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                Live
              </div>
              <span className="text-xs text-base-content/70">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button 
              onClick={() => navigate('/admin/addquestion')}
              className="btn btn-outline btn-sm gap-2 h-auto p-3 flex-col"
            >
              <MdQuiz className="w-4 h-4" />
              <span className="text-xs">Add Questions</span>
            </button>
            <button 
              onClick={() => navigate('/admin/addstudent')}
              className="btn btn-outline btn-sm gap-2 h-auto p-3 flex-col"
            >
              <MdPeople className="w-4 h-4" />
              <span className="text-xs">Add Student</span>
            </button>
            <button 
              onClick={() => navigate('/admin/subjects')}
              className="btn btn-outline btn-sm gap-2 h-auto p-3 flex-col"
            >
              <MdBook className="w-4 h-4" />
              <span className="text-xs">Manage Subjects</span>
            </button>
            <button 
              onClick={() => navigate('/admin/weekschedule')}
              className="btn btn-outline btn-sm gap-2 h-auto p-3 flex-col"
            >
              <MdCalendarToday className="w-4 h-4" />
              <span className="text-xs">Schedule Test</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="card bg-base-100 p-2 sm:p-3 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold mb-1">{stat.title}</h3>
                    <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-1 sm:p-2 rounded-full ${stat.bgColor} ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Left Column - Pending Actions and Recent Activity */}
            <div className="lg:col-span-1 space-y-3 sm:space-y-4">
              {/* Pending Actions */}
              <div className="card bg-base-100 p-2 sm:p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <MdPendingActions className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                  <h2 className="text-base sm:text-lg font-semibold">Pending Actions</h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {pendingActions.length === 0 ? (
                    <div className="text-center text-xs sm:text-sm text-base-content/70">No pending actions (or not implemented)</div>
                  ) : (
                    pendingActions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                      >
                        <div className={`p-1 sm:p-2 rounded-full ${action.priority === 'high' ? 'bg-error/20 text-error' :
                          action.priority === 'medium' ? 'bg-warning/20 text-warning' :
                            'bg-success/20 text-success'
                          }`}>
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-xs sm:text-sm truncate">{action.title}</h3>
                            <span className="text-[10px] sm:text-xs text-base-content/70 ml-2">{action.timestamp}</span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-base-content/70 mt-1 line-clamp-2">{action.description}</p>
                          <div className="mt-2 flex gap-1 sm:gap-2">
                            <button className="btn btn-xs btn-primary">Review</button>
                            <button className="btn btn-xs btn-ghost">Dismiss</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card bg-base-100 p-2 sm:p-4 rounded-lg">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Recent Activity</h2>
                <div className="space-y-2 sm:space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-xs sm:text-sm text-base-content/70">No recent activity</p>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200 rounded-lg">
                        <div className={`p-1 sm:p-2 rounded-full ${activity.iconBgColor} ${activity.iconColor}`}>
                          {activity.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{activity.description}</p>
                          <p className="text-[10px] sm:text-xs text-base-content/70">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Charts and Leaderboard */}
            <div className="lg:col-span-3 space-y-3 sm:space-y-4">
              {/* Leaderboard Section */}
              <div className="card bg-base-100 p-2 sm:p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                  <h2 className="text-base sm:text-lg font-semibold">Top Students</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.location.href = '/admin/reports'}
                      className="btn btn-primary btn-xs gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Analytics
                    </button>
                    <span className="text-xs text-base-content/70">
                      Active Players: {stats.activePlayers}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  {/* Only show leaderboard if real data is available */}
                  {leaderboardData.topStudents.length === 0 ? (
                    <div className="text-center text-xs sm:text-sm text-base-content/70">Leaderboard not implemented or no data</div>
                  ) : (
                    <div className="overflow-hidden">
                      <table className="table table-xs w-full">
                        <thead>
                          <tr>
                            <th className="whitespace-nowrap">Rank</th>
                            <th className="whitespace-nowrap">Student</th>
                            <th className="whitespace-nowrap">Points</th>
                            <th className="whitespace-nowrap">Rank</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardData.topStudents.map((student, index) => (
                            <tr key={student.id} className="hover:bg-base-200">
                              <td className="font-bold whitespace-nowrap">#{index + 1}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="avatar placeholder">
                                    <div className="bg-neutral text-neutral-content rounded-full w-6">
                                      <span className="text-xs">{student.avatar}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs truncate max-w-[100px] sm:max-w-none">{student.name}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap">{student.points}</td>
                              <td className="whitespace-nowrap">
                                <span className={`badge badge-xs badge-${student.rank?.toLowerCase?.() || 'default'}`}>
                                  {student.rank}
                                </span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;