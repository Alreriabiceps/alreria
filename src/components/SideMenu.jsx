import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGuideMode } from '../contexts/GuideModeContext';
import {
  MdDashboard,
  MdBook,
  MdQuiz,
  MdAddCircle,
  MdCalendarToday,
  MdPeople,
  MdSettings,
  MdSportsEsports,
  MdLeaderboard,
  MdDarkMode,
  MdLightMode,
  MdMenu,
  MdClose,
  MdLink,
  MdBarChart,
  MdCloudUpload,
  MdExpandMore,
  MdExpandLess,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
  MdNotifications,
  MdHelp,
} from "react-icons/md";

const SideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { guideMode, setGuideMode } = useGuideMode();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const isActive = (path) => location.pathname === path;
  const isPathInSection = (items) => items?.some(item => isActive(item.path));

  const adminMenuItems = [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: <MdDashboard />,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Content Management",
      icon: <MdBook />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      items: [
        { title: "Subjects", path: "/admin/subjects", icon: <MdBook /> },
        { title: "Add Questions", path: "/admin/addquestions", icon: <MdAddCircle /> },
        { title: "Question List", path: "/admin/questionlist", icon: <MdQuiz /> },
        { title: "Reviewer Links", path: "/admin/reviewer-links", icon: <MdLink /> },
      ],
    },
    {
      title: "Weekly Tests",
      icon: <MdCalendarToday />,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      items: [
        { title: "Create Schedule", path: "/admin/weeks/schedule", icon: <MdAddCircle /> },
        { title: "Current Schedules", path: "/admin/weeks/current", icon: <MdCalendarToday /> },
      ],
    },
    {
      title: "Student Management",
      icon: <MdPeople />,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      items: [
        { title: "Add Student", path: "/admin/addstudent", icon: <MdAddCircle /> },
        { title: "Student List", path: "/admin/studentlist", icon: <MdPeople /> },
        { title: "Bulk Operations", path: "/admin/students/bulk", icon: <MdCloudUpload /> },
      ],
    },
    {
      title: "Analytics & Reports",
      path: "/admin/reports",
      icon: <MdBarChart />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "Settings",
      path: "/admin/settings",
      icon: <MdSettings />,
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
    },
  ];

  const studentMenuItems = [
    { 
      title: "Dashboard", 
      path: "/student/dashboard", 
      icon: <MdDashboard />,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    { 
      title: "Weekly Tests", 
      path: "/student/weeklytest", 
      icon: <MdQuiz />,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Leaderboard",
      path: "/student/leaderboard",
      icon: <MdLeaderboard />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
  ];

  const menuItems = user?.role === "admin" ? adminMenuItems : studentMenuItems;

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate(user?.role === "admin" ? "/alogin" : "/login");
  };

  // Initialize expanded sections based on current path
  useEffect(() => {
    const newExpandedSections = {};
    menuItems.forEach(item => {
      if (item.items && isPathInSection(item.items)) {
        newExpandedSections[item.title] = true;
      }
    });
    setExpandedSections(newExpandedSections);
  }, [location.pathname]);

  const SidebarContent = ({ isMobile = false }) => (
    <div className={`flex flex-col h-full ${isMobile ? 'w-full' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-base-300 ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AGILA
              </span>
              <span className="text-xs text-base-content/60 -mt-1">Learning Platform</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg hover:bg-base-300 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <MdChevronRight className="w-5 h-5" /> : <MdChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-base-300 ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}` : 'A'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-base-100"></div>
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base-content truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/70 capitalize">{user?.role}</span>
                <span className="px-2 py-0.5 bg-success/20 text-success text-xs rounded-full">Online</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              {item.items ? (
                <div className="space-y-1">
                  <button
                    onClick={() => !isCollapsed && toggleSection(item.title)}
                    className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 group
                      ${isPathInSection(item.items) 
                        ? `${item.bgColor} ${item.color} shadow-sm` 
                        : 'hover:bg-base-300/50'}
                      ${isCollapsed && !isMobile ? 'justify-center' : ''}
                    `}
                  >
                    <span className={`text-xl ${isPathInSection(item.items) ? item.color : 'text-base-content/70'} group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </span>
                    {(!isCollapsed || isMobile) && (
                      <>
                        <span className="font-medium flex-1">{item.title}</span>
                        <span className={`transition-transform duration-200 ${expandedSections[item.title] ? 'rotate-180' : ''}`}>
                          <MdExpandMore className="w-5 h-5" />
                        </span>
                      </>
                    )}
                  </button>
                  {(!isCollapsed || isMobile) && (
                    <div className={`overflow-hidden transition-all duration-300 ${expandedSections[item.title] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <ul className="ml-4 pl-4 border-l-2 border-base-300 space-y-1">
                        {item.items.map((subItem, subIdx) => (
                          <li key={subIdx}>
                            <button
                              onClick={() => handleNavigation(subItem.path)}
                              className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-all duration-200 group
                                ${isActive(subItem.path)
                                  ? 'bg-primary text-primary-content shadow-md translate-x-1'
                                  : 'hover:bg-base-300/50 hover:translate-x-1'}
                              `}
                            >
                              <span className={`text-lg ${isActive(subItem.path) ? 'text-primary-content' : 'text-base-content/60'} group-hover:scale-110 transition-transform`}>
                                {subItem.icon}
                              </span>
                              <span className="text-sm font-medium">{subItem.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 group
                    ${isActive(item.path)
                      ? `${item.bgColor} ${item.color} shadow-md scale-105`
                      : 'hover:bg-base-300/50 hover:scale-102'}
                    ${isCollapsed && !isMobile ? 'justify-center' : ''}
                  `}
                >
                  <span className={`text-xl ${isActive(item.path) ? item.color : 'text-base-content/70'} group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </span>
                  {(!isCollapsed || isMobile) && (
                    <span className="font-medium">{item.title}</span>
                  )}
                  {isActive(item.path) && (!isCollapsed || isMobile) && (
                    <div className="ml-auto w-2 h-2 bg-current rounded-full"></div>
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className={`p-4 border-t border-base-300 space-y-3 ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
        {/* Quick Actions */}
        {(!isCollapsed || isMobile) && (
          <div className="flex gap-2">
            <button className="flex-1 p-2 rounded-lg bg-info/10 hover:bg-info/20 text-info transition-colors">
              <MdNotifications className="w-5 h-5 mx-auto" />
            </button>
            <button className="flex-1 p-2 rounded-lg bg-warning/10 hover:bg-warning/20 text-warning transition-colors">
              <MdHelp className="w-5 h-5 mx-auto" />
            </button>
          </div>
        )}

        {/* Theme Toggle */}
        <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
          {(!isCollapsed || isMobile) && (
            <span className="text-sm font-medium text-base-content/70">Theme</span>
          )}
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50
              ${theme === 'dark' ? 'bg-primary' : 'bg-base-300'}`}
            aria-label="Toggle theme"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300
                ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}
            >
              {theme === 'light' ? 
                <MdDarkMode className="w-3 h-3 text-gray-600" /> : 
                <MdLightMode className="w-3 h-3 text-yellow-500" />
              }
            </span>
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full text-left p-3 text-error hover:bg-error/10 rounded-xl transition-all duration-200 group
            ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <MdLogout className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {(!isCollapsed || isMobile) && (
            <span className="font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`drawer-side transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
        <aside className={`hidden lg:flex min-h-screen bg-base-100 text-base-content flex-col shadow-2xl border-r border-base-300/50 backdrop-blur-sm transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-72'}`}>
          <SidebarContent />
        </aside>
      </div>

      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-base-100 text-base-content shadow-lg border border-base-300 hover:scale-105 transition-transform"
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300" 
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-80 bg-base-100 text-base-content shadow-2xl border-r border-base-300/50 backdrop-blur-sm transform transition-transform duration-300 ease-out z-50
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent isMobile={true} />
      </div>
    </>
  );
};

export default SideMenu;
