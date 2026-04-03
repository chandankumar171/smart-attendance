import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

export default function IPManager() {
  const [ips, setIps]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [label, setLabel]       = useState('');
  const [cidr, setCidr]         = useState('');
  const [adding, setAdding]     = useState(false);

  const fetchIPs = useCallback(async () => {
    try {
      const res = await api.get('/admin/ip-ranges');
      setIps(res.data.ips);
    } catch {
      toast.error('Failed to load IP ranges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIPs(); }, [fetchIPs]);

  const handleAdd = async () => {
    if (!label.trim() || !cidr.trim()) {
      toast.warn('Both label and IP/CIDR are required.');
      return;
    }
    setAdding(true);
    try {
      await api.post('/admin/ip-ranges', { label: label.trim(), cidr: cidr.trim() });
      toast.success('IP range added!');
      setLabel('');
      setCidr('');
      fetchIPs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add IP range');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this IP range?')) return;
    try {
      await api.delete(`/admin/ip-ranges/${id}`);
      toast.success('IP range deleted');
      setIps((prev) => prev.filter((ip) => ip._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/admin/ip-ranges/${id}/toggle`);
      setIps((prev) => prev.map((ip) => ip._id === id ? res.data.ip : ip));
    } catch {
      toast.error('Failed to toggle');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Allowed IP Ranges</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Students can only mark attendance when connected to these networks.
        </p>
      </div>

      {/* Add new IP */}
      <div className="card space-y-3">
        <p className="text-sm font-semibold text-gray-700">Add New IP Range</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Label (e.g. Institute WiFi)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-field flex-1"
          />
          <input
            type="text"
            placeholder="IP or CIDR (e.g. 192.168.1.0/24)"
            value={cidr}
            onChange={(e) => setCidr(e.target.value)}
            className="input-field flex-1"
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-primary whitespace-nowrap"
          >
            {adding ? 'Adding...' : '+ Add'}
          </button>
        </div>
        <div className="text-xs text-gray-400 space-y-0.5">
          <p>Examples: <span className="font-mono">192.168.1.0/24</span> (range) · <span className="font-mono">49.37.112.158/32</span> (single IP) · <span className="font-mono">127.0.0.1/32</span> (localhost)</p>
        </div>
      </div>

      {/* IP list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ips.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500 text-sm">No IP ranges added yet.</p>
          <p className="text-gray-400 text-xs mt-1">Fallback to ENV variable <span className="font-mono">ALLOWED_IP_RANGES</span>.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {ips.map((ip) => (
              <div key={ip._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{ip.label}</p>
                    <p className="font-mono text-xs text-indigo-600 mt-0.5">{ip.cidr}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    ip.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {ip.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggle(ip._id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      ip.isActive
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {ip.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(ip._id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Label</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">IP / CIDR</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ips.map((ip) => (
                  <tr key={ip._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{ip.label}</td>
                    <td className="px-4 py-3 font-mono text-indigo-600 text-xs">{ip.cidr}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                        ip.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ip.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(ip.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => handleToggle(ip._id)}
                          className={`text-xs font-medium hover:underline ${
                            ip.isActive ? 'text-yellow-600' : 'text-green-600'
                          }`}
                        >
                          {ip.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(ip._id)}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}