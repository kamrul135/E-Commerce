import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Minus, Plus, Package } from 'lucide-react';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await productsAPI.getById(id);
        setProduct(data.product);
      } catch (error) {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    const success = await addToCart(product.id, quantity);
    if (success) setQuantity(1);
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!product) return null;

  return (
    <div className="page">
      <div className="container">
        <button className="btn btn-outline btn-sm back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="product-detail">
          <div className="product-detail-image">
            <img
              src={product.image_url || 'https://via.placeholder.com/600x600?text=No+Image'}
              alt={product.name}
            />
          </div>

          <div className="product-detail-info">
            <span className="product-detail-category">{product.category_name}</span>
            <h1>{product.name}</h1>
            <p className="product-detail-price">${parseFloat(product.price).toFixed(2)}</p>

            <div className="product-detail-stock">
              <Package size={16} />
              {product.stock > 0 ? (
                <span className="in-stock">{product.stock} in stock</span>
              ) : (
                <span className="no-stock">Out of stock</span>
              )}
            </div>

            <p className="product-detail-desc">{product.description}</p>

            {product.stock > 0 && (
              <div className="product-detail-actions">
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus size={16} />
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                    <Plus size={16} />
                  </button>
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                  <ShoppingCart size={20} /> Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
