import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id);
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-image">
        <img
          src={product.image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
          alt={product.name}
          loading="lazy"
        />
        {product.stock <= 0 && <span className="out-of-stock-badge">Out of Stock</span>}
        {product.featured && <span className="featured-badge">Featured</span>}
      </div>
      <div className="product-card-body">
        <p className="product-card-category">{product.category_name}</p>
        <h3 className="product-card-title">{product.name}</h3>
        <div className="product-card-footer">
          <span className="product-card-price">${parseFloat(product.price).toFixed(2)}</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            <ShoppingCart size={16} />
            Add
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
