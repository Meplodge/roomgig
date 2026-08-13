import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = () => (
  <div className="shell">
    <Sidebar />
    <div className="shell-main">
      <TopBar />
      <main className="shell-content">
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout;
