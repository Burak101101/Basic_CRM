'use client';

import { useState, useEffect } from 'react';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationsByType,
  formatNotificationDate,
  getNotificationTypeIcon,
  getNotificationTypeColor,
  getNotificationTypeLabel,
  getNotificationPriorityColor
} from '@/services/notificationService';
import { NotificationList } from '@/types/notifications';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'reminder' | 'event' | 'email' | 'system'>('all');

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      let notificationsData: NotificationList[];
      
      if (filter === 'all') {
        notificationsData = await getNotifications();
      } else if (filter === 'unread') {
        notificationsData = (await getNotifications()).filter(n => !n.is_read);
      } else {
        notificationsData = await getNotificationsByType(filter);
      }
      
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Bildirimler yüklenirken hata:', err);
      setError('Bildirimler yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
    } catch (err) {
      console.error('Bildirim okundu olarak işaretlenirken hata:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Tüm bildirimler okundu olarak işaretlenirken hata:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Bildirim silinirken hata:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <AppWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title="Bildirimler" 
        subtitle={`${notifications.length} bildirim${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ''}`}
        action={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CheckIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Tümünü Okundu İşaretle
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'unread', label: 'Okunmamış' },
              { key: 'reminder', label: 'Hatırlatmalar' },
              { key: 'event', label: 'Etkinlikler' },
              { key: 'email', label: 'E-postalar' },
              { key: 'system', label: 'Sistem' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Bildirim bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'Henüz hiç bildirim yok.' : 'Bu filtreye uygun bildirim bulunamadı.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all ${!notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-2xl">
                      {getNotificationTypeIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`text-lg font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotificationTypeColor(notification.notification_type)}`}>
                          {getNotificationTypeLabel(notification.notification_type)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotificationPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                      
                      <p className={`text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'} mb-2`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatNotificationDate(notification.created_at)}
                          {notification.is_read && notification.read_at && (
                            <span className="ml-2">• Okundu: {formatNotificationDate(notification.read_at)}</span>
                          )}
                        </span>
                        
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            Görüntüle →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Okundu olarak işaretle"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Sil"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppWrapper>
  );
}
