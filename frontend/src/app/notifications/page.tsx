"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import UserLayout from '@/components/Layout/UserLayout';

interface Notification {
  id: string;
  type: 'support_ticket' | 'support_reply' | 'kyc_update' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  supportTicketId?: string;
}

const NotificationsPage = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'support'>('all');

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // Get auth token from localStorage
        const token = localStorage.getItem('access_token');
        
        const response = await fetch('http://localhost:8000/api/notifications/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Transform backend data to match frontend interface
          const transformedNotifications = data.notifications?.map((notif: any) => ({
            id: notif.id.toString(),
            type: notif.type,
            title: notif.title,
            message: notif.message,
            timestamp: notif.created_at,
            read: notif.is_read, // Map is_read to read
            supportTicketId: notif.support_ticket_id
          })) || [];
          setNotifications(transformedNotifications);
        } else {
          // Fallback to mock data if API fails
          const mockNotifications: Notification[] = [
            {
              id: '1',
              type: 'support_reply',
              title: 'Support Ticket Response',
              message: 'We have responded to your technical support ticket. Please check your ticket for our response.',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
              read: false,
              supportTicketId: 'ST-001'
            },
            {
              id: '2',
              type: 'support_ticket',
              title: 'Support Ticket Submitted',
              message: 'Your support ticket has been received and assigned to our team. You will receive a response within 24 hours.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
              read: true,
              supportTicketId: 'ST-001'
            },
            {
              id: '3',
              type: 'kyc_update',
              title: 'KYC Status Update',
              message: 'Your KYC verification documents have been reviewed and approved. You are now verified!',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
              read: true
            },
            {
              id: '4',
              type: 'general',
              title: 'Welcome to QFS Ledger',
              message: 'Thank you for joining QFS Ledger. Complete your profile and KYC verification to unlock all features.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
              read: true
            }
          ];
          
          setNotifications(mockNotifications);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        // Fallback to mock data on network error
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'support_reply',
            title: 'Support Ticket Response',
            message: 'We have responded to your technical support ticket. Please check your ticket for our response.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false,
            supportTicketId: 'ST-001'
          }
        ];
        setNotifications(mockNotifications);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'support') return notification.type === 'support_ticket' || notification.type === 'support_reply';
    return true;
  });

  const markAsRead = async (notificationId: string) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/notifications/mark-read/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        toast.success('Notification marked as read');
      } else {
        // Still update UI even if API fails
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Still update UI even if there's a network error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/notifications/mark-all-read/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        toast.success('All notifications marked as read');
      } else {
        // Still update UI even if API fails
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Still update UI even if there's a network error
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'support_ticket':
      case 'support_reply':
        return (
          <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
            </svg>
          </div>
        );
      case 'kyc_update':
        return (
          <div className="w-10 h-10 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8 mb-20">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
              <p className="text-muted">Stay updated with your account activities and support responses</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-primary text-darkmode px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Filter Tabs */}
          <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-1 mb-6">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Notifications' },
                { key: 'unread', label: `Unread (${unreadCount})` },
                { key: 'support', label: 'Support' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-primary text-darkmode'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-section bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No notifications found</h3>
                <p className="text-muted">
                  {filter === 'unread' 
                    ? 'You have no unread notifications'
                    : filter === 'support'
                    ? 'No support notifications yet'
                    : 'You have no notifications at this time'
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-section bg-opacity-10 border border-section border-opacity-20 rounded-lg p-6 transition-all hover:bg-opacity-20 ${
                    !notification.read ? 'border-primary border-opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {getNotificationIcon(notification.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`text-lg font-medium ${
                            notification.read ? 'text-white' : 'text-primary'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-muted text-sm mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-primary hover:text-primary-dark text-sm"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-white mt-3 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      {notification.supportTicketId && (
                        <div className="mt-4">
                          <button
                            onClick={() => router.push(`/support?ticket=${notification.supportTicketId}`)}
                            className="bg-primary text-darkmode px-4 py-2 rounded text-sm font-medium hover:bg-primary-dark transition-colors"
                          >
                            View Support Ticket
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default NotificationsPage;