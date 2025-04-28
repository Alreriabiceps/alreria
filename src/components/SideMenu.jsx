import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
} from "react-icons/md";

const SideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
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
    { title: "PvP Challenge", path: "/student/pvp", icon: <MdSportsEsports /> },
    {
      title: "Leaderboard",
      path: "/student/leaderboard",
      icon: <MdLeaderboard />,
    },
  ];

  const menuItems = user?.role === "admin" ? adminMenuItems : studentMenuItems;

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate(user?.role === "admin" ? "/alogin" : "/login");
  };

  return (
    <div className="drawer-side">
      <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
      <aside className="w-56 min-h-screen bg-base-200 text-base-content">
        {/* Header */}
        <div className="px-4 py-3 border-b border-base-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {user?.role === "admin" ? "Admin Panel" : "Student Portal"}
            </h2>
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <MdDarkMode className="w-4 h-4" />
              ) : (
                <MdLightMode className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 overflow-y-auto space-y-2 py-2">
          <ul className="menu menu-sm bg-base-200 w-full">
            {menuItems.map((item, idx) => (
              <li key={idx}>
                {item.items ? (
                  <details
                    open={item.items.some((subItem) => isActive(subItem.path))}
                  >
                    <summary className="flex items-center gap-2 px-2 py-1.5 font-medium cursor-pointer hover:bg-base-300 rounded-lg">
                      {item.icon}
                      {item.title}
                    </summary>
                    <ul className="pl-4 mt-1 space-y-1">
                      {item.items.map((subItem, subIdx) => (
                        <li key={subIdx}>
                          <button
                            onClick={() => handleNavigation(subItem.path)}
                            className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-sm ${
                              isActive(subItem.path)
                                ? "bg-primary text-primary-content"
                                : "hover:bg-base-300"
                            }`}
                          >
                            {subItem.icon}
                            {subItem.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-sm ${
                      isActive(item.path)
                        ? "bg-primary text-primary-content"
                        : "hover:bg-base-300"
                    }`}
                  >
                    {item.icon}
                    {item.title}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-base-300">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-error hover:bg-error/10 font-medium rounded-lg text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v3a1 1 0 102 0V9z"
                clipRule="evenodd"
              />
            </svg>
            Logoutsss
          </button>
        </div>
      </aside>
    </div>
  );
};

export default SideMenu;
