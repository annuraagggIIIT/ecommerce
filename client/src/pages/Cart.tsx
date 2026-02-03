import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cartApi, productsApi } from '../api/client';
import type { CartItem, Product } from '../types';

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export function Cart() {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCart = async () => {
    try {
      const [cartResponse, productsResponse] = await Promise.all([
        cartApi.getCart(),
        productsApi.getAll(),
      ]);

      const products: Product[] = productsResponse.data;
      const items: CartItem[] = cartResponse.data.cartItems;

      const itemsWithProducts = items.map((item) => ({
        ...item,
        product: products.find((p) => p.id === item.productId)!,
      })).filter((item) => item.product);

      setCartItems(itemsWithProducts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch cart');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await cartApi.updateQuantity(itemId, newQuantity);
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemove = async (itemId: number) => {
    if (!confirm('Remove this item from cart?')) return;

    try {
      await cartApi.removeItem(itemId);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  if (isLoading) {
    return <div className="loading">Loading cart...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/products" className="btn btn-primary">
            Browse Specimens
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                <div className="cart-item-details">
                  <Link to={`/products/${item.product.id}`} className="cart-item-name">
                    {item.product.name}
                  </Link>
                  <p className="cart-item-price">
                    ${item.product.price.toLocaleString()}
                  </p>
                  <div className="cart-item-tags">
                    {item.product.tags.split(',').map((tag) => (
                      <span key={tag} className="tag">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
                <div className="cart-item-quantity">
                  <button
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-subtotal">
                  ${(item.product.price * item.quantity).toLocaleString()}
                </div>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleRemove(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-amount">${calculateTotal().toLocaleString()}</span>
            </div>
            <button className="btn btn-primary btn-large">
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
