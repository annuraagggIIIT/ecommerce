import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/client';
import type { Order, OrderStatus } from '../types';

const statusColors: Record<OrderStatus, string> = {
  PENDING: '#f59e0b',
  ACCEPTED: '#3b82f6',
  OUT_FOR_DELIVERY: '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const response = await ordersApi.getAll();
      setOrders(response.data.orders);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await ordersApi.cancel(orderId);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getLatestStatus = (order: Order): OrderStatus => {
    return order.events[0]?.status || 'PENDING';
  };

  if (isLoading) {
    return <div className="loading">Loading orders...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <p>You haven't placed any orders yet</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const status = getLatestStatus(order);
            const canCancel = status === 'PENDING' || status === 'ACCEPTED';

            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className="order-status"
                    style={{ backgroundColor: statusColors[status] }}
                  >
                    {statusLabels[status]}
                  </span>
                </div>

                <div className="order-products">
                  {order.products.map((item) => (
                    <div key={item.id} className="order-product">
                      <div className="product-image">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} />
                        ) : (
                          <div className="placeholder-image">No Image</div>
                        )}
                      </div>
                      <div className="product-details">
                        <Link to={`/products/${item.product.id}`} className="product-name">
                          {item.product.name}
                        </Link>
                        <span className="product-quantity">Qty: {item.quantity}</span>
                        <span className="product-price">
                          ${Number(item.product.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-address">
                    <strong>Shipping to:</strong> {order.address}
                  </div>
                  <div className="order-total">
                    <strong>Total:</strong> ${Number(order.netAmount).toLocaleString()}
                  </div>
                  {canCancel && (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleCancel(order.id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
