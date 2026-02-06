import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Plus, Edit, Trash2, X } from 'lucide-react';
import { productsAPI, categoriesAPI, ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', stock: '', category_id: '', image_url: '', featured: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, categoriesRes] = await Promise.all([
        productsAPI.getAll({ limit: 100 }),
        ordersAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setCategories(categoriesRes.data.categories || []);
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
      setProductForm({ name: '', description: '', price: '', stock: '', category_id: '', image_url: '', featured: false });
    }
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
      };
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        toast.success('Product updated');
      } else {
        await productsAPI.create(data);
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

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <Package size={24} />
            <div>
              <h3>{products.length}</h3>
              <p>Products</p>
            </div>
          </div>
          <div className="stat-card">
            <ShoppingBag size={24} />
            <div>
              <h3>{orders.length}</h3>
              <p>Orders</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            Products
          </button>
          <button className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            Orders
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => openModal()}>
                <Plus size={16} /> Add Product
              </button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={product.image_url || 'https://via.placeholder.com/40'} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                          <span style={{ fontWeight: 500 }}>{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category_name || '-'}</td>
                      <td>${parseFloat(product.price).toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.featured ? '⭐' : '-'}</td>
                      <td>
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
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 500 }}>#{order.id.slice(0, 8)}</td>
                    <td>{order.customer_name || 'N/A'}</td>
                    <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
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
        )}

        {/* Product Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
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
                    <label>Price ($)</label>
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
                  <label>Image URL</label>
                  <input value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} placeholder="https://..." />
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
    </div>
  );
};

export default Admin;
