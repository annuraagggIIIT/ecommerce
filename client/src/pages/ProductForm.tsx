import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { productsApi } from '../api/client';

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      const fetchProduct = async () => {
        try {
          const response = await productsApi.getById(parseInt(id));
          const product = response.data;
          setName(product.name);
          setDescription(product.description);
          setPrice(String(product.price));
          setTags(product.tags || '');
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch product');
        } finally {
          setIsFetching(false);
        }
      };

      fetchProduct();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    const productData = {
      name,
      description,
      price: parseFloat(price),
      tags: tagsArray,
    };

    try {
      if (isEditing && id) {
        await productsApi.update(parseInt(id), productData);
      } else {
        await productsApi.create(productData);
      }
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="loading">Loading product...</div>;
  }

  return (
    <div className="product-form-page">
      <Link to="/admin/products" className="back-link">
        &larr; Back to Products
      </Link>
      <h1>{isEditing ? 'Edit Product' : 'Create New Product'}</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">Product Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter product name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Enter product description"
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="price">Price ($)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., electronics, gadget, new"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/admin/products" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
