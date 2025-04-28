import React from 'react';
import { Outlet } from 'react-router-dom';
import SideMenu from '../components/SideMenu';

const AdminLayout = () => {
  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <SideMenu />
      <div className="drawer-content flex flex-col">
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;