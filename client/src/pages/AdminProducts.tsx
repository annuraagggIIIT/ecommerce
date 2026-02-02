import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productsApi.delete(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error-page">{error}</div>;
  }

  return (
    <div className="admin-products-page">
      <div className="admin-header">
        <h1>Manage Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          Add New Product
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="no-products">No products available. Create your first product!</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showActions
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
