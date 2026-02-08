import { useState, useEffect } from 'react';
import { adminOrdersApi } from '../api/client';
import type { Order, OrderStatus } from '../types';

interface OrderWithUser extends Order {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

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

const statusFlow: OrderStatus[] = ['PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await adminOrdersApi.getAll(filterStatus || undefined);
      setOrders(response.data.orders);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const getLatestStatus = (order: OrderWithUser): OrderStatus => {
    return order.events[0]?.status || 'PENDING';
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
      return null;
    }
    return statusFlow[currentIndex + 1];
  };

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await adminOrdersApi.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setUpdatingOrderId(orderId);
    try {
      await adminOrdersApi.updateStatus(orderId, 'CANCELLED');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading orders...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-orders-page">
      <div className="admin-header">
        <h1>Manage Orders</h1>
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => {
            const status = getLatestStatus(order);
            const nextStatus = getNextStatus(status);
            const isUpdating = updatingOrderId === order.id;
            const canModify = status !== 'DELIVERED' && status !== 'CANCELLED';

            return (
              <div key={order.id} className="admin-order-card">
                <div className="admin-order-header">
                  <div className="order-info">
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className="order-status"
                    style={{ backgroundColor: statusColors[status] }}
                  >
                    {statusLabels[status]}
                  </span>
                </div>

                <div className="admin-order-customer">
                  <strong>Customer:</strong> {order.user.name} ({order.user.email})
                </div>

                <div className="admin-order-products">
                  {order.products.map((item) => (
                    <div key={item.id} className="admin-order-product">
                      <span className="product-name">{item.product.name}</span>
                      <span className="product-qty">x{item.quantity}</span>
                      <span className="product-price">
                        ${Number(item.product.price).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="admin-order-details">
                  <div className="order-address">
                    <strong>Ship to:</strong> {order.address}
                  </div>
                  <div className="order-total">
                    <strong>Total:</strong> ${Number(order.netAmount).toLocaleString()}
                  </div>
                </div>

                {canModify && (
                  <div className="admin-order-actions">
                    {nextStatus && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleUpdateStatus(order.id, nextStatus)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Updating...' : `Mark as ${statusLabels[nextStatus]}`}
                      </button>
                    )}
                    <button
                      className="btn btn-danger"
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={isUpdating}
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                <div className="order-history">
                  <strong>Status History:</strong>
                  <div className="status-timeline">
                    {order.events.map((event) => (
                      <div key={event.id} className="timeline-item">
                        <span
                          className="timeline-status"
                          style={{ color: statusColors[event.status] }}
                        >
                          {statusLabels[event.status]}
                        </span>
                        <span className="timeline-date">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
