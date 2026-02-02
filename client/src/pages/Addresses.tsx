import { useState, useEffect } from 'react';
import { usersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Address } from '../types';

export function Addresses() {
  const { user, refreshUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    lineOne: '',
    lineTwo: '',
    city: '',
    country: '',
    pinCode: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await usersApi.listAddresses();
      setAddresses(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const response = await usersApi.addAddress(formData);
      setAddresses((prev) => [...prev, response.data]);
      setFormData({ lineOne: '', lineTwo: '', city: '', country: '', pinCode: '' });
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await usersApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: number, type: 'shipping' | 'billing') => {
    try {
      const updateData = type === 'shipping'
        ? { defaultShippingAddressId: addressId }
        : { defaultBillingAddressId: addressId };
      await usersApi.updateUser(updateData);
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to set default address');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading addresses...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="addresses-page">
      <div className="admin-header">
        <h1>My Addresses</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add New Address'}
        </button>
      </div>

      {showForm && (
        <div className="address-form-container">
          <form onSubmit={handleSubmit} className="product-form">
            <h2>Add New Address</h2>
            {formError && <div className="error-message">{formError}</div>}
            <div className="form-group">
              <label htmlFor="lineOne">Address Line 1 *</label>
              <input
                type="text"
                id="lineOne"
                name="lineOne"
                value={formData.lineOne}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lineTwo">Address Line 2</label>
              <input
                type="text"
                id="lineTwo"
                name="lineTwo"
                value={formData.lineTwo}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country *</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pinCode">Pin Code *</label>
              <input
                type="text"
                id="pinCode"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Address'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <p className="no-products">No addresses found. Add your first address!</p>
      ) : (
        <div className="addresses-grid">
          {addresses.map((address) => (
            <div key={address.id} className="address-card">
              <div className="address-badges">
                {user?.defaultShippingAddressId === address.id && (
                  <span className="badge badge-shipping">Default Shipping</span>
                )}
                {user?.defaultBillingAddressId === address.id && (
                  <span className="badge badge-billing">Default Billing</span>
                )}
              </div>
              <div className="address-content">
                <p className="address-line">{address.lineOne}</p>
                {address.lineTwo && <p className="address-line">{address.lineTwo}</p>}
                <p className="address-line">{address.city}, {address.pinCode}</p>
                <p className="address-line">{address.country}</p>
              </div>
              <div className="address-actions">
                {user?.defaultShippingAddressId !== address.id && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleSetDefault(address.id, 'shipping')}
                  >
                    Set as Shipping
                  </button>
                )}
                {user?.defaultBillingAddressId !== address.id && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleSetDefault(address.id, 'billing')}
                  >
                    Set as Billing
                  </button>
                )}
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDelete(address.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
