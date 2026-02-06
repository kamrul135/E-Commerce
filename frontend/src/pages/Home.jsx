import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, Shield, Headphones } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productsAPI.getAll({ featured: true, limit: 8 }),
          categoriesAPI.getAll(),
        ]);
        setFeaturedProducts(productsRes.data.products || []);
        setCategories(categoriesRes.data.categories || []);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <h1>Discover Amazing Products at Great Prices</h1>
            <p>Shop the latest trends with fast delivery and secure checkout. Quality guaranteed on every purchase.</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Shop Now <ArrowRight size={20} />
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Create Account
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600" alt="Shopping" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container features-grid">
          <div className="feature-card">
            <Truck size={32} />
            <h3>Free Shipping</h3>
            <p>Free delivery on orders over $50</p>
          </div>
          <div className="feature-card">
            <Shield size={32} />
            <h3>Secure Payment</h3>
            <p>100% secure payment processing</p>
          </div>
          <div className="feature-card">
            <ShoppingBag size={32} />
            <h3>Quality Products</h3>
            <p>Curated selection of top brands</p>
          </div>
          <div className="feature-card">
            <Headphones size={32} />
            <h3>24/7 Support</h3>
            <p>Dedicated customer service team</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2>Shop by Category</h2>
              <Link to="/products" className="section-link">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="category-card"
                >
                  <h3>{cat.name}</h3>
                  <p>{cat.product_count} products</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {!loading && featuredProducts.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2>Featured Products</h2>
              <Link to="/products" className="section-link">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta">
        <div className="container cta-content">
          <h2>Ready to Start Shopping?</h2>
          <p>Join thousands of happy customers and find exactly what you're looking for.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
