import { useState } from 'react';
import { Product } from '@/types/product';
import { productAffiliateService } from '@/services/productAffiliateService';

export function ManualProductAddition({ onProductAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    category: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const product = await productAffiliateService.addProduct(formData);
      onProductAdded(product);
      setFormData({ name: '', description: '', price: 0, imageUrl: '', category: '' });
    } catch (err) {
      setError('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}
      <div>
        <label>Product Name:</label>
        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
      </div>
      <div>
        <label>Description:</label>
        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
      </div>
      <div>
        <label>Price:</label>
        <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} required />
      </div>
      <div>
        <label>Image URL:</label>
        <input type="url" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} required />
      </div>
      <div>
        <label>Category:</label>
        <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Product'}
      </button>
    </form>
  );
}
