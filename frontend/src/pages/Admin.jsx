import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Plus, Edit, Trash2, X, Users } from 'lucide-react';
import { productsAPI, categoriesAPI, ordersAPI, authAPI, paymentsAPI, withdrawalsAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [analytics, setAnalytics] = useState({ totalSales: 0, monthlyRevenue: [], topProducts: [] });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bank_method: '', account_number: '' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', stock: '', category_id: '', image_url: '', imageUpload: null, featured: false,
  });

  const [themeForm, setThemeForm] = useState({
    mode: localStorage.getItem('theme-mode') || 'light',
    primary: localStorage.getItem('theme-primary') || '#3b82f6'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyTheme = () => {
    localStorage.setItem('theme-mode', themeForm.mode);
    localStorage.setItem('theme-primary', themeForm.primary);
    
    // Apply Mode
    if (themeForm.mode === 'dark' || (themeForm.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Apply primary color variable setup
    document.documentElement.style.setProperty('--primary', themeForm.primary);
    
    // Create dark variant based on selection simply by opacity or a slightly darker hex 
    // In a real app we'd convert hex to hsl and adjust
    toast.success('Theme applied successfully!');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, categoriesRes, usersRes, paymentsRes, withdrawalsRes, analyticsRes] = await Promise.all([
        productsAPI.getAll({ limit: 100 }),
        ordersAPI.getAll(),
        categoriesAPI.getAll(),
        authAPI.getAllUsers().catch(() => ({ data: { users: [] } })),
        paymentsAPI.getAll({ limit: 100 }).catch(() => ({ data: { payments: [] } })),
        withdrawalsAPI.getAll().catch(() => ({ data: { withdrawals: [] } })),
        analyticsAPI.getDashboardStats().catch(() => ({ data: { totalSales: 0, monthlyRevenue: [], topProducts: [] } }))
      ]);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setCategories(categoriesRes.data.categories || []);
      setCustomers(usersRes.data.users || []);
      setTransactions(paymentsRes.data.payments || []);
      setWithdrawals(withdrawalsRes.data.withdrawals || []);
      setAnalytics(analyticsRes.data || { totalSales: 0, monthlyRevenue: [], topProducts: [] });
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category_id: product.category_id || '',
        image_url: product.image_url || '',
        featured: product.featured || false,
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', stock: '', category_id: '', image_url: '', imageUpload: null, featured: false });
    }
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', parseFloat(productForm.price));
      formData.append('stock', parseInt(productForm.stock));
      if (productForm.category_id) {
        formData.append('category_id', parseInt(productForm.category_id));
      }
      formData.append('featured', productForm.featured);
      
      if (productForm.imageUpload) {
        formData.append('image', productForm.imageUpload); // Append local file
      } else if (productForm.image_url) {
        formData.append('image_url', productForm.image_url); // Or string URL
      }

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
        toast.success('Product updated');
      } else {
        await productsAPI.create(formData);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleWithdrawRequest = async () => {
    try {
      if (!withdrawForm.amount || !withdrawForm.bank_method || !withdrawForm.account_number) {
        return toast.error("Please fill all fields");
      }
      const amount = parseFloat(withdrawForm.amount);
      if (amount < 500) {
         return toast.error("Minimum withdrawal amount is ৳500");
      }
      if (amount > (analytics?.availableBalance || 0)) {
         return toast.error("Insufficient available balance");
      }
      await withdrawalsAPI.create({
        amount,
        bank_method: withdrawForm.bank_method,
        account_number: withdrawForm.account_number
      });
      toast.success('Withdrawal requested successfully');
      setWithdrawForm({ amount: '', bank_method: '', account_number: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to request withdrawal');
    }
  };

  const handleUpdateWithdrawalStatus = async (id, status) => {
    try {
      await withdrawalsAPI.updateStatus(id, status);
      toast.success(`Withdrawal marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update withdrawal status');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="admin-page-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={{ marginBottom: '1.5rem' }}>Dashboard Overview</h1>
            <div className="dashboard-stats-grid">
              <div className="admin-card stat-card">
                <div className="stat-header">
                  <span>Total Sales</span>
                  <ShoppingBag size={20} color="#10b981" />
                </div>
                <div className="stat-value">৳{analytics?.totalSales || 0}</div>
              </div>
              <div className="admin-card stat-card">
                <div className="stat-header">
                  <span>Total Orders</span>
                  <Package size={20} color="#3b82f6" />
                </div>
                <div className="stat-value">{orders.length}</div>
              </div>
              <div className="admin-card stat-card">
                <div className="stat-header">
                  <span>Total Customers</span>
                  <Users size={20} color="#f59e0b" />
                </div>
                <div className="stat-value">{customers.length}</div>
              </div>
              <div className="admin-card stat-card">
                <div className="stat-header">
                  <span>Pending Orders</span>
                  <ShoppingBag size={20} color="#ef4444" />
                </div>
                <div className="stat-value">
                  {orders.filter(o => o.status === 'pending').length}
                </div>
              </div>
            </div>
            {/* Add chart here later */}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Products Management</h2>
              <button className="btn btn-primary" onClick={() => openModal()}>
                <Plus size={16} /> Add Product
              </button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <th style={{ padding: '0.75rem 0' }}>Product</th>
                    <th style={{ padding: '0.75rem 0' }}>Category</th>
                    <th style={{ padding: '0.75rem 0' }}>Price</th>
                    <th style={{ padding: '0.75rem 0' }}>Stock</th>
                    <th style={{ padding: '0.75rem 0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={product.image_url || 'https://via.placeholder.com/40'} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                          <span style={{ fontWeight: 500 }}>{product.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>{product.category_name || '-'}</td>
                      <td style={{ padding: '0.75rem 0' }}>৳{parseFloat(product.price).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0' }}>{product.stock}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openModal(product)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="admin-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Orders Management</h2>
            <div className="admin-table-wrapper">
              <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <th style={{ padding: '0.75rem 0' }}>Order ID</th>
                    <th style={{ padding: '0.75rem 0' }}>Customer</th>
                    <th style={{ padding: '0.75rem 0' }}>Total</th>
                    <th style={{ padding: '0.75rem 0' }}>Status</th>
                    <th style={{ padding: '0.75rem 0' }}>Date</th>
                    <th style={{ padding: '0.75rem 0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>#{order.id.slice(0, 8)}</td>
                      <td style={{ padding: '0.75rem 0' }}>{order.customer_name || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 0' }}>৳{parseFloat(order.total_amount).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          style={{ padding: '0.375rem 0.5rem', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: '0.8125rem' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="admin-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Customers</h2>
            <div className="admin-table-wrapper">
              <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <th style={{ padding: '0.75rem 0' }}>Name</th>
                    <th style={{ padding: '0.75rem 0' }}>Email</th>
                    <th style={{ padding: '0.75rem 0' }}>Phone</th>
                    <th style={{ padding: '0.75rem 0' }}>Orders</th>
                    <th style={{ padding: '0.75rem 0' }}>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>{customer.name}</td>
                      <td style={{ padding: '0.75rem 0' }}>{customer.email}</td>
                      <td style={{ padding: '0.75rem 0' }}>{customer.phone || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 0' }}>{customer.total_orders || 0}</td>
                      <td style={{ padding: '0.75rem 0' }}>৳{parseFloat(customer.total_spent || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="admin-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Transactions</h2>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                  <option value="">All Payment Methods</option>
                  <option value="card">Card</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}>
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <th style={{ padding: '0.75rem 0' }}>TXN ID</th>
                    <th style={{ padding: '0.75rem 0' }}>Order ID</th>
                    <th style={{ padding: '0.75rem 0' }}>Amount</th>
                    <th style={{ padding: '0.75rem 0' }}>Method</th>
                    <th style={{ padding: '0.75rem 0' }}>Status</th>
                    <th style={{ padding: '0.75rem 0' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 0', fontFamily: 'monospace' }}>{txn.transaction_id || '-'}</td>
                      <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>#{txn.order_id ? String(txn.order_id).substring(0, 8) : 'N/A'}</td>
                      <td style={{ padding: '0.75rem 0' }}>৳{parseFloat(txn.amount).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0', textTransform: 'capitalize' }}>{txn.payment_method?.replace(/_/g, ' ') || 'Unknown'}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span className={`badge badge-${txn.status === 'completed' ? 'success' : txn.status === 'failed' ? 'danger' : 'warning'}`}>
                          {txn.status === 'completed' ? 'Success ✅' : txn.status === 'failed' ? 'Failed ❌' : 'Pending ⏳'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>{new Date(txn.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settlements Tab */}
        {activeTab === 'settlements' && (
          <div className="admin-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Settlement (Withdraw)</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '2rem', marginBottom: '2rem' }}>
              {/* Balance Section */}
              <div style={{ background: 'var(--gray-50)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }}>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Available Balance</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '1rem' }}>৳{analytics?.availableBalance?.toLocaleString() || '0'}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  Minimum Withdraw: <span style={{ fontWeight: 500 }}>৳500</span>
                </div>
              </div>

              {/* Withdraw Form */}
              <div style={{ background: 'var(--gray-50)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Request Withdraw</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Amount (৳)</label>
                    <input type="number" 
                           placeholder="Enter amount" 
                           value={withdrawForm.amount}
                           onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                           style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Bank / Method</label>
                      <select style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                              value={withdrawForm.bank_method}
                              onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_method: e.target.value })}>
                        <option value="">Select Bank / Method</option>
                        <optgroup label="Mobile Banking">
                          <option value="bkash">bKash</option>
                          <option value="nagad">Nagad</option>
                          <option value="rocket">Rocket</option>
                          <option value="upay">Upay</option>
                        </optgroup>
                        <optgroup label="Banks">
                          <option value="ab_bank">AB Bank</option>
                          <option value="brac_bank">BRAC Bank</option>
                          <option value="city_bank">City Bank (CBL)</option>
                          <option value="dbbl">Dutch-Bangla Bank (DBBL)</option>
                          <option value="ebl">Eastern Bank PLC (EBL)</option>
                          <option value="islami_bank">Islami Bank</option>
                          <option value="bank_asia">Bank Asia</option>
                          <option value="mtb">Mutual Trust Bank (MTB)</option>
                          <option value="prime_bank">Prime Bank</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Account Number</label>
                      <input type="text" 
                             placeholder="Enter account details" 
                             value={withdrawForm.account_number}
                             onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                             style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                    </div>
                  </div>
                  <button className="btn-primary" 
                          onClick={handleWithdrawRequest}
                          style={{ marginTop: '0.5rem', justifySelf: 'start', padding: '0.5rem 1.5rem', border: 'none', cursor: 'pointer' }}>
                    Request Withdraw
                  </button>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Withdrawal History</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <th style={{ padding: '0.75rem 0' }}>Request ID</th>
                    <th style={{ padding: '0.75rem 0' }}>Amount</th>
                    <th style={{ padding: '0.75rem 0' }}>Bank</th>
                    <th style={{ padding: '0.75rem 0' }}>Status</th>
                    <th style={{ padding: '0.75rem 0' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 0', fontFamily: 'monospace' }}>{withdrawal.request_id}</td>
                      <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>৳{parseFloat(withdrawal.amount).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <div>{withdrawal.bank_method}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Acc: {withdrawal.account_number}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>User: {withdrawal.user_email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <select 
                          value={withdrawal.status}
                          onChange={(e) => handleUpdateWithdrawalStatus(withdrawal.id, e.target.value)}
                          style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        >
                          <option value="processing">Processing ⏳</option>
                          <option value="completed">Completed ✅</option>
                          <option value="rejected">Rejected ❌</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                        No withdrawal history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="admin-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Sales Reports</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ background: 'var(--gray-50)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }}>
                 <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Monthly Revenue</h3>
                 <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '1rem', paddingTop: '2rem' }}>
                   {analytics?.monthlyRevenue?.length > 0 ? analytics.monthlyRevenue.map((item, index) => {
                     const maxRev = Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
                     const heightPercentage = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
                     const bgColors = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'];
                     return (
                       <div key={index} style={{ flex: 1, background: bgColors[index % bgColors.length], height: `${Math.max(10, heightPercentage)}%`, borderRadius: '4px 4px 0 0', position: 'relative' }}>
                         <span style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', fontWeight: 'bold' }}>৳{item.revenue?.toLocaleString()}</span>
                         <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem' }}>{item.month}</span>
                       </div>
                     );
                   }) : <div style={{width: '100%', textAlign: 'center', color: 'var(--gray-500)'}}>No revenue data</div>}
                 </div>
              </div>
              <div style={{ background: 'var(--gray-50)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }}>
                 <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Top Products</h3>
                 <ul style={{ listStyle: 'none', padding: 0 }}>
                   {analytics?.topProducts?.length > 0 ? analytics.topProducts.map((product, index) => (
                     <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: index < analytics.topProducts.length - 1 ? '1px solid var(--gray-200)' : 'none' }}>
                       <span>{index + 1}. {product.name}</span>
                       <span style={{ fontWeight: 'bold' }}>{product.sold} sold</span>
                     </li>
                   )) : <div style={{width: '100%', textAlign: 'center', color: 'var(--gray-500)'}}>No products sold</div>}
                 </ul>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="admin-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Settings</h2>
            
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>
              {/* Admin Profile */}
              <div style={{ padding: '1.5rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   Admin Profile
                </h3>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" defaultValue="Super Admin" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Email Address</label>
                  <input type="email" defaultValue="admin@khnexa.com" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                </div>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Profile</button>
              </div>

              {/* Password */}
              <div style={{ padding: '1.5rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Change Password</h3>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>New Password</label>
                  <input type="password" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                </div>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Update Password</button>
              </div>

              {/* Gateway Config */}
              <div style={{ padding: '1.5rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Payment Gateway Configuration</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>bKash</h4>
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label>Merchant Number</label>
                    <input type="text" defaultValue="01608418807" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>SSLCommerz</h4>
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label>Store ID</label>
                    <input type="text" defaultValue="khnexa_store" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                  </div>
                </div>

                <div>
                  <h4>Stripe</h4>
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label>Publishable Key</label>
                    <input type="text" defaultValue="pk_test_..." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                  </div>
                </div>

                <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Configuration</button>
              </div>

              {/* Theme Preferences */}
              <div style={{ padding: '1.5rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Appearance Settings</h3>
                <div className="form-group">
                  <label>Color Theme</label>
                  <select 
                    value={themeForm.mode} 
                    onChange={(e) => setThemeForm({...themeForm, mode: e.target.value})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-200)' }}
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="system">System Preference</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Primary Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                        <div 
                          key={color}
                          onClick={() => setThemeForm({...themeForm, primary: color})}
                          style={{ 
                            width: '30px', 
                            height: '30px', 
                            borderRadius: '50%', 
                            backgroundColor: color, 
                            cursor: 'pointer', 
                            border: themeForm.primary === color ? '2px solid #000' : '2px solid transparent' 
                          }}
                        ></div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleApplyTheme} style={{ marginTop: '1.5rem' }}>Apply Theme</button>
              </div>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 1000 }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveProduct} className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (৳)</label>
                    <input type="number" step="0.01" min="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input type="number" min="0" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Product Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setProductForm({ ...productForm, imageUpload: e.target.files[0] })}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--gray-300)', padding: '0.4rem', borderRadius: 'var(--radius)' }}
                  />
                  {!productForm.imageUpload && editingProduct?.image_url && (
                    <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--gray-500)' }}>
                      Current image: <a href={editingProduct.image_url} target="_blank" rel="noreferrer">View</a>
                    </small>
                  )}
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="featured" checked={productForm.featured} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} />
                  <label htmlFor="featured" style={{ marginBottom: 0 }}>Featured Product</label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Update' : 'Create'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Admin;
