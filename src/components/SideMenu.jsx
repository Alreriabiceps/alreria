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

  const isActive = (path) => location.pathname === path;

  const adminMenuItems = [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: <MdDashboard />,
    },
    {
      title: "Content Management",
      items: [
        { title: "Subjects", path: "/admin/subjects", icon: <MdBook /> },
        {
          title: "Add Questions",
          path: "/admin/addquestions",
          icon: <MdAddCircle />,
        },
        {
          title: "Question List",
          path: "/admin/questionlist",
          icon: <MdQuiz />,
        },
        {
          title: "Reviewer Links",
          path: "/admin/reviewer-links",
          icon: <MdLink />,
        },
      ],
    },
    {
      title: "Weekly Tests",
      items: [
        {
          title: "Create Schedule",
          path: "/admin/weeks/schedule",
          icon: <MdAddCircle />,
        },
        {
          title: "Current Schedules",
          path: "/admin/weeks/current",
          icon: <MdCalendarToday />,
        },
      ],
    },
    {
      title: "Student Management",
      items: [
        {
          title: "Add Student",
          path: "/admin/addstudent",
          icon: <MdAddCircle />,
        },
        {
          title: "Student List",
          path: "/admin/studentlist",
          icon: <MdPeople />,
        },
      ],
    },
    {
      title: "Settings",
      path: "/admin/settings",
      icon: <MdSettings />,
    },
  ];

  const studentMenuItems = [
    { title: "Dashboard", path: "/student/dashboard", icon: <MdDashboard /> },
    { title: "Weekly Tests", path: "/student/weeklytest", icon: <MdQuiz /> },
    {
      title: "Leaderboard",
      path: "/student/leaderboard",
      icon: <MdLeaderboard />,
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

  return (
    <div className="drawer-side">
      <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
      <aside className="hidden lg:flex w-64 min-h-screen bg-base-200 text-base-content flex-col shadow-xl rounded-r-2xl border-r border-base-300">
        {/* Text Logo */}
        <div className="flex flex-col items-center px-6 pt-6 pb-2">
          <span className="font-extrabold text-2xl tracking-widest text-primary">AGILA</span>
        </div>
        {/* User Info */}
        <div className="flex items-center gap-3 px-6 pb-4">
          <div className="bg-accent text-accent-content rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
            {user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}` : 'A'}
          </div>
          <div className="flex flex-col">
            <div className="font-semibold text-base-content">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-base-content/60 capitalize">{user?.role}</div>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 px-2 overflow-y-auto py-4">
          <ul className="space-y-1">
            {menuItems.map((item, idx) => (
              <li key={idx}>
                {item.items ? (
                  <details
                    open={item.items.some((subItem) => isActive(subItem.path))}
                    className="group"
                  >
                    <summary className="flex items-center gap-2 px-3 py-2 font-medium cursor-pointer rounded-lg transition-colors hover:bg-base-300 group-open:bg-base-300">
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.title}</span>
                    </summary>
                    <ul className="pl-6 mt-1 space-y-1">
                      {item.items.map((subItem, subIdx) => (
                        <li key={subIdx}>
                          <button
                            onClick={() => handleNavigation(subItem.path)}
                            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                              ${isActive(subItem.path)
                                ? 'bg-primary text-primary-content shadow-md border-l-4 border-primary font-bold'
                                : 'hover:bg-base-200'}
                            `}
                          >
                            <span className="text-lg">{subItem.icon}</span>
                            <span>{subItem.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                      ${isActive(item.path)
                        ? 'bg-primary text-primary-content shadow-md border-l-4 border-primary font-bold'
                        : 'hover:bg-base-200'}
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.title}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>
        {/* Theme Toggle & Logout */}
        <div className="px-6 py-4 border-t border-base-300 bg-base-100 mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-3 justify-between">
            <span className="text-sm text-base-content/70">Theme</span>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none
                ${theme === 'dark' ? 'bg-primary' : 'bg-base-300'}`}
              aria-label="Toggle theme"
            >
              <span
                className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-base-100 shadow-md flex items-center justify-center transition-transform duration-200
                  ${theme === 'dark' ? 'translate-x-7 bg-primary text-primary-content' : 'translate-x-0'}`}
              >
                {theme === 'light' ? <MdDarkMode className="w-4 h-4" /> : <MdLightMode className="w-4 h-4" />}
              </span>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-error hover:bg-error/10 font-semibold rounded-lg text-sm border border-error/30 mt-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-base-200 text-base-content"
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMobileMenu}></div>
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-base-200 text-base-content transform transition-transform duration-300 ease-in-out z-50 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center px-6 pt-6 pb-2">
            <span className="font-extrabold text-2xl tracking-widest text-primary">AGILA</span>
          </div>
          <div className="flex items-center gap-3 px-6 pb-4">
            <div className="bg-accent text-accent-content rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
              {user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}` : 'A'}
            </div>
            <div className="flex flex-col">
              <div className="font-semibold text-base-content">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-base-content/60 capitalize">{user?.role}</div>
            </div>
          </div>
          <nav className="flex-1 px-2 overflow-y-auto py-4">
            <ul className="space-y-1">
              {menuItems.map((item, idx) => (
                <li key={idx}>
                  {item.items ? (
                    <details
                      open={item.items.some((subItem) => isActive(subItem.path))}
                      className="group"
                    >
                      <summary className="flex items-center gap-2 px-3 py-2 font-medium cursor-pointer rounded-lg transition-colors hover:bg-base-300 group-open:bg-base-300">
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.title}</span>
                      </summary>
                      <ul className="pl-6 mt-1 space-y-1">
                        {item.items.map((subItem, subIdx) => (
                          <li key={subIdx}>
                            <button
                              onClick={() => handleNavigation(subItem.path)}
                              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                                ${isActive(subItem.path)
                                  ? 'bg-primary text-primary-content shadow-md border-l-4 border-primary font-bold'
                                  : 'hover:bg-base-200'}
                              `}
                            >
                              <span className="text-lg">{subItem.icon}</span>
                              <span>{subItem.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        ${isActive(item.path)
                          ? 'bg-primary text-primary-content shadow-md border-l-4 border-primary font-bold'
                          : 'hover:bg-base-200'}
                      `}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.title}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-6 py-4 border-t border-base-300 bg-base-100 mt-auto flex flex-col gap-3">
            <div className="flex items-center gap-3 justify-between">
              <span className="text-sm text-base-content/70">Theme</span>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none
                  ${theme === 'dark' ? 'bg-primary' : 'bg-base-300'}`}
                aria-label="Toggle theme"
              >
                <span
                  className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-base-100 shadow-md flex items-center justify-center transition-transform duration-200
                    ${theme === 'dark' ? 'translate-x-7 bg-primary text-primary-content' : 'translate-x-0'}`}
                >
                  {theme === 'light' ? <MdDarkMode className="w-4 h-4" /> : <MdLightMode className="w-4 h-4" />}
                </span>
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-error hover:bg-error/10 font-semibold rounded-lg text-sm border border-error/30 mt-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
