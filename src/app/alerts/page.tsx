'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPriceAlerts, addPriceAlert, removePriceAlert } from '@/utils/localStorage';
import { PriceAlert, Product } from '@/types/product';

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    productId: '',
    targetPrice: '',
    productName: '',
    currentPrice: 0,
    imageUrl: ''
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const userAlerts = getPriceAlerts();
      setAlerts(userAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.productId || !newAlert.targetPrice) return;

    const alert: PriceAlert = {
      id: Date.now().toString(),
      productId: newAlert.productId,
      targetPrice: parseFloat(newAlert.targetPrice),
      isActive: true,
      createdAt: new Date()
    };

    addPriceAlert(alert);
    setAlerts([...alerts, alert]);
    setNewAlert({
      productId: '',
      targetPrice: '',
      productName: '',
      currentPrice: 0,
      imageUrl: ''
    });
    setShowAddAlert(false);
  };

  const handleRemoveAlert = (alertId: string) => {
    removePriceAlert(alertId);
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const toggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: !alert.isActive }
        : alert
    ));
  };

  const getAlertStatus = (alert: PriceAlert) => {
    // This would normally compare with current price from API
    // For now, we'll simulate price comparison
    const currentPrice = 25000; // Mock current price
    const targetReached = currentPrice <= alert.targetPrice;
    
    return {
      targetReached,
      currentPrice,
      savings: targetReached ? currentPrice - alert.targetPrice : 0
    };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Price Alerts</h1>
            <p className="text-gray-600">Get notified when products reach your target price</p>
          </div>
          <button
            onClick={() => setShowAddAlert(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Alert
          </button>
        </div>
      </div>

      {/* Add Alert Modal */}
      {showAddAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Price Alert</h3>
            <form onSubmit={handleAddAlert}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <input
                  type="text"
                  value={newAlert.productId}
                  onChange={(e) => setNewAlert({...newAlert, productId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product ID"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Price (₱)
                </label>
                <input
                  type="number"
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter target price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddAlert(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🔔</span>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No price alerts yet</h3>
          <p className="text-gray-600 mb-6">Set up alerts to get notified when products reach your target price</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {alerts.map((alert) => {
            const status = getAlertStatus(alert);
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                  status.targetReached 
                    ? 'border-green-200 bg-green-50' 
                    : alert.isActive 
                      ? 'border-blue-200' 
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Product ID: {alert.productId}
                      </h3>
                      <p className="text-gray-600">
                        Target: ₱{alert.targetPrice.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {status.targetReached && (
                      <div className="text-center">
                        <div className="text-green-600 font-semibold">🎉 Target Reached!</div>
                        <div className="text-sm text-green-600">
                          Save ₱{status.savings.toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          alert.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleRemoveAlert(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How Price Alerts Work</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• We monitor prices across all platforms 24/7</li>
          <li>• Get instant notifications when your target price is reached</li>
          <li>• Set multiple alerts for the same product on different platforms</li>
          <li>• Alerts remain active until you disable or delete them</li>
        </ul>
      </div>
    </div>
  );
}
