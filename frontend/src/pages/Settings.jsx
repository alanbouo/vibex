import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        {['profile', 'twitter', 'preferences', 'subscription'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                defaultValue={user?.name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue={user?.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'subscription' && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold capitalize">{user?.subscription?.tier} Plan</h3>
                <p className="text-sm text-gray-600">Current plan status</p>
              </div>
              <Button>Upgrade Plan</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
