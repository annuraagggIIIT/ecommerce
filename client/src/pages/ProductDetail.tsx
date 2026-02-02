import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '../api/client';
import type { Product } from '../types';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const response = await productsApi.getById(parseInt(id));
        setProduct(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return <div className="loading">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="error-page">
        <h2>Product Not Found</h2>
        <p>{error || 'The product you are looking for does not exist.'}</p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  const tags = product.tags ? product.tags.split(',') : [];

  return (
    <div className="product-detail-page">
      <Link to="/products" className="back-link">
        &larr; Back to Products
      </Link>
      <div className="product-detail">
        <div className="product-detail-image">
          {product.image ? (
            <img src={product.image} alt={product.name} className="product-img large" />
          ) : (
            <div className="placeholder-image large">No Image</div>
          )}
        </div>
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-detail-price">${Number(product.price).toFixed(2)}</p>
          <div className="product-detail-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
          <div className="product-detail-tags">
            <h3>Tags</h3>
            <div className="tags">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-large">Add to Cart</button>
        </div>
      </div>
    </div>
  );
}
