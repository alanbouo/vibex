import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, Chrome, Download, ExternalLink } from 'lucide-react';

const Settings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('extension');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        {['profile', 'extension', 'subscription'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'extension' ? 'Chrome Extension' : tab}
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

      {activeTab === 'extension' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Chrome className="w-5 h-5" />
              Chrome Extension
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Extension Status */}
            {user?.extensionDataImportedAt ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Extension Connected</p>
                    <p className="text-sm text-green-700">
                      {user?.importedTweetsCount || 0} posts & {user?.importedLikesCount || 0} likes imported
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Last sync: {new Date(user.extensionDataImportedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">No data synced yet</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Install the Chrome extension and sync your X data to enable AI features.
                  </p>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">How it works</h3>
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium text-gray-900">Install the extension</p>
                    <p className="text-sm text-gray-600">Add Vibex to Chrome from the Chrome Web Store</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium text-gray-900">Collect your posts & likes</p>
                    <p className="text-sm text-gray-600">Visit x.com and use the extension to scrape your content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium text-gray-900">Sync to Vibex</p>
                    <p className="text-sm text-gray-600">Click "Sync" in the extension to import your data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">4</div>
                  <div>
                    <p className="font-medium text-gray-900">AI learns your style</p>
                    <p className="text-sm text-gray-600">Our AI analyzes your content to generate personalized replies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="pt-4 border-t">
              <Button 
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Get Chrome Extension
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Free • No X API required • Your data stays private
              </p>
            </div>
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
