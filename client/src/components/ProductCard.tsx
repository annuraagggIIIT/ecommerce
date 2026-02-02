import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function ProductCard({ product, onDelete, showActions = false }: ProductCardProps) {
  const tags = product.tags ? product.tags.split(',') : [];

  return (
    <div className="product-card">
      <div className="product-image">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-img" />
        ) : (
          <div className="placeholder-image">No Image</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">${Number(product.price).toFixed(2)}</p>
        <div className="product-tags">
          {tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag.trim()}
            </span>
          ))}
        </div>
        <div className="product-actions">
          <Link to={`/products/${product.id}`} className="btn btn-primary">
            View Details
          </Link>
          {showActions && onDelete && (
            <>
              <Link to={`/admin/products/edit/${product.id}`} className="btn btn-secondary">
                Edit
              </Link>
              <button
                onClick={() => onDelete(product.id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
