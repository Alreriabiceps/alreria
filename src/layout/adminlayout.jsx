import React from 'react';
import { Outlet } from 'react-router-dom';
import SideMenu from '../components/SideMenu';
import { useGuideMode } from '../contexts/GuideModeContext';

const AdminLayout = () => {
  const { guideMode, setGuideMode } = useGuideMode();
  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <SideMenu />
      <div className="drawer-content flex flex-col">
        {/* Guide Mode Toggle */}
        <div className="flex items-center justify-end p-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="font-medium text-primary">Guide Mode</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={guideMode}
              onChange={() => setGuideMode((prev) => !prev)}
            />
          </label>
        </div>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;