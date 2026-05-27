import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  BarChart2, 
  Settings, 
  LogOut,
  Search,
  Bell,
  User,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './AdminLayout.css';

const AdminLayout = ({ children, activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications for demonstration initially
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to admin panel!', time: new Date().toISOString(), read: false, type: 'system' }
  ]);

  useEffect(() => {
    // Connect to Socket.IO backend
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to notification server');
    });

    socket.on('new_notification', (notification) => {
      setNotifications(prev => [{ ...notification, read: false }, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})));
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'products', label: 'Products', icon: <Package size={20} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'payments', label: 'Transactions', icon: <CreditCard size={20} /> },
    { id: 'settlements', label: 'Settlement', icon: <Wallet size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar-fixed">
        <div className="admin-brand">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-logout">
          <button className="admin-nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-search">
            <Search size={18} />
            <input type="text" placeholder="Search..." />
          </div>
          <div className="admin-topbar-right">
            <div className="admin-notification-wrapper" style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '4px',
                    background: 'var(--danger)',
                    color: 'white',
                    fontSize: '10px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  width: '320px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 50,
                  marginTop: '0.5rem',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none' }}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? notifications.map(notif => (
                      <div key={notif.id} style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid var(--gray-200)',
                        background: notif.read ? 'transparent' : 'var(--primary-50)',
                        color: 'var(--gray-800)',
                        cursor: 'pointer'
                      }}>
                        <div style={{ fontWeight: notif.read ? 'normal' : '600', marginBottom: '0.25rem' }}>{notif.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{notif.time}</div>
                      </div>
                    )) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>No notifications</div>
                    )}
                  </div>
                  <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--gray-200)', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.9rem' }}>
                    View All Notifications
                  </div>
                </div>
              )}
            </div>
            <div className="admin-profile-dropdown">
              <div className="admin-profile-trigger">
                <User size={20} />
                <span>{user?.name || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
