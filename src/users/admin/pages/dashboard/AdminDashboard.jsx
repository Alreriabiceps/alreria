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
    topStudents: [
      {
        id: 1,
        name: "John Doe",
        points: 1250,
        rank: "Gold",
        avatar: "JD"
      },
      {
        id: 2,
        name: "Jane Smith",
        points: 1100,
        rank: "Silver",
        avatar: "JS"
      },
      {
        id: 3,
        name: "Mike Johnson",
        points: 950,
        rank: "Silver",
        avatar: "MJ"
      },
      {
        id: 4,
        name: "Sarah Williams",
        points: 800,
        rank: "Bronze",
        avatar: "SW"
      },
      {
        id: 5,
        name: "David Brown",
        points: 750,
        rank: "Bronze",
        avatar: "DB"
      }
    ],
    currentPage: 1,
    totalPages: 3,
    itemsPerPage: 5
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [pendingActions, setPendingActions] = useState([
    {
      id: 1,
      type: 'user_approval',
      title: 'New Student Registration',
      description: '5 new student registrations pending approval',
      timestamp: '2 hours ago',
      priority: 'high',
      icon: <MdPeople className="w-5 h-5" />
    },
    {
      id: 2,
      type: 'content_moderation',
      title: 'Question Review',
      description: '3 new questions need review',
      timestamp: '4 hours ago',
      priority: 'medium',
      icon: <MdQuiz className="w-5 h-5" />
    },
    {
      id: 3,
      type: 'report',
      title: 'User Reports',
      description: '2 new user reports to review',
      timestamp: '1 day ago',
      priority: 'high',
      icon: <MdWarning className="w-5 h-5" />
    }
  ]);

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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-base-200 rounded-lg shadow-lg p-6">
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
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-2 sm:p-4">
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4">Admin Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
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
                  {pendingActions.map((action) => (
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
                  ))}
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
                    <span className="text-xs text-base-content/70">
                      Active Players: {stats.activePlayers}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <div className="min-w-full inline-block align-middle">
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
                                <span className={`badge badge-xs badge-${student.rank.toLowerCase()}`}>
                                  {student.rank}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-3">
                  <div className="join">
                    <button
                      className="join-item btn btn-xs"
                      onClick={() => setLeaderboardData(prev => ({
                        ...prev,
                        currentPage: Math.max(1, prev.currentPage - 1)
                      }))}
                      disabled={leaderboardData.currentPage === 1}
                    >
                      «
                    </button>
                    <button className="join-item btn btn-xs">
                      Page {leaderboardData.currentPage} of {leaderboardData.totalPages}
                    </button>
                    <button
                      className="join-item btn btn-xs"
                      onClick={() => setLeaderboardData(prev => ({
                        ...prev,
                        currentPage: Math.min(prev.totalPages, prev.currentPage + 1)
                      }))}
                      disabled={leaderboardData.currentPage === leaderboardData.totalPages}
                    >
                      »
                    </button>
                  </div>
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