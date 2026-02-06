import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'created_at',
    order: searchParams.get('order') || 'DESC',
    page: parseInt(searchParams.get('page')) || 1,
  });

  useEffect(() => {
    categoriesAPI.getAll().then((res) => setCategories(res.data.categories || []));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { ...filters, limit: 12 };
        if (!params.search) delete params.search;
        if (!params.category) delete params.category;
        const { data } = await productsAPI.getAll(params);
        setProducts(data.products || []);
        setPagination(data.pagination || {});
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'created_at' && value !== 'DESC' && value !== 1) {
        params[key] = value;
      }
    });
    setSearchParams(params);
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>All Products</h1>
          <p>Browse our collection of quality products</p>
        </div>

        {/* Filters */}
        <div className="products-filters">
          <form onSubmit={handleSearch} className="search-form">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </form>

          <div className="filter-controls">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            <select
              value={`${filters.sort}-${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setFilters({ ...filters, sort, order, page: 1 });
              }}
            >
              <option value="created_at-DESC">Newest First</option>
              <option value="created_at-ASC">Oldest First</option>
              <option value="price-ASC">Price: Low to High</option>
              <option value="price-DESC">Price: High to Low</option>
              <option value="name-ASC">Name: A to Z</option>
              <option value="name-DESC">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <Search size={48} />
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
