import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sparkles, 
  MessageCircle,
  Calendar, 
  BarChart3, 
  Settings,
  Twitter,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ai-writer', icon: Sparkles, label: 'AI Writer' },
  { to: '/reply-helper', icon: MessageCircle, label: 'Reply Helper' },
  { to: '/scheduler', icon: Calendar, label: 'Scheduler' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Twitter className="w-8 h-8 text-blue-500" />
            <span className="ml-2 text-xl font-bold text-gray-900">Vibex</span>
          </div>
          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Upgrade CTA */}
        <div className="p-4 m-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <h3 className="text-white font-semibold mb-1">Upgrade to Pro</h3>
          <p className="text-blue-100 text-xs mb-3">Unlock unlimited AI features</p>
          <button className="w-full bg-white text-blue-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
