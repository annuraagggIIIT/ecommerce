import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi, productsApi, usersApi, paymentsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { CartItem, Product, Address } from '../types';

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
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

  const fetchAddresses = async () => {
    try {
      const response = await usersApi.listAddresses();
      setAddresses(response.data);
      if (user?.defaultShippingAddressId) {
        setSelectedAddressId(user.defaultShippingAddressId);
      } else if (response.data.length > 0) {
        setSelectedAddressId(response.data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch addresses');
    }
  };

  useEffect(() => {
    fetchCart();
    fetchAddresses();
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

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      alert('Please select a shipping address');
      return;
    }

    setIsCheckingOut(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Check your internet connection.');
        return;
      }

      const { data } = await paymentsApi.createOrder();

      const options: RazorpayOptions = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'My Store',
        description: 'Order Payment',
        order_id: data.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        handler: async (response) => {
          try {
            await paymentsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              addressId: selectedAddressId,
            });
            navigate('/orders');
          } catch {
            alert('Payment verification failed. Contact support.');
          }
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => setIsCheckingOut(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
      setIsCheckingOut(false);
    }
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

            {!showCheckout ? (
              <button
                className="btn btn-primary btn-large"
                onClick={() => setShowCheckout(true)}
              >
                Proceed to Checkout
              </button>
            ) : (
              <div className="checkout-section">
                <h3>Select Shipping Address</h3>
                {addresses.length === 0 ? (
                  <div className="no-address">
                    <p>No addresses found.</p>
                    <Link to="/addresses" className="btn btn-secondary">
                      Add Address
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="address-selection">
                      {addresses.map((address) => (
                        <label key={address.id} className="address-option">
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                          />
                          <div className="address-details">
                            <p>{address.lineOne}</p>
                            {address.lineTwo && <p>{address.lineTwo}</p>}
                            <p>{address.city}, {address.pinCode}</p>
                            <p>{address.country}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="checkout-actions">
                      <button
                        className="btn btn-primary btn-large"
                        onClick={handleCheckout}
                        disabled={isCheckingOut || !selectedAddressId}
                      >
                        {isCheckingOut ? 'Opening Payment...' : 'Pay Now'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowCheckout(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
