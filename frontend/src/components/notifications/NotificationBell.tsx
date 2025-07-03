'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { 
  getUnreadNotificationCount, 
  getUnreadNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatNotificationDate,
  getNotificationTypeIcon,
  getNotificationTypeColor
} from '@/services/notificationService';
import { NotificationList } from '@/types/notifications';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationList[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Bildirim sayısını yükle
  const loadUnreadCount = async () => {
    try {
      const { unread_count } = await getUnreadNotificationCount();
      setUnreadCount(unread_count);
    } catch (error) {
      console.error('Bildirim sayısı yüklenirken hata:', error);
    }
  };

  // Okunmamış bildirimleri yükle
  const loadUnreadNotifications = async () => {
    try {
      setIsLoading(true);
      const unreadNotifications = await getUnreadNotifications();
      setNotifications(unreadNotifications.slice(0, 10)); // Son 10 bildirim
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Bildirimi okundu olarak işaretle
  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenirken hata:', error);
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Tüm bildirimler okundu olarak işaretlenirken hata:', error);
    }
  };

  // Dropdown açıldığında bildirimleri yükle
  const handleToggleDropdown = () => {
    if (!isOpen) {
      loadUnreadNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Dışarı tıklandığında dropdown'u kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sayfa yüklendiğinde bildirim sayısını yükle
  useEffect(() => {
    loadUnreadCount();
    
    // Her 30 saniyede bir bildirim sayısını güncelle
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bildirim Bell */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-indigo-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Bildirim Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Bildirimler</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Tümünü okundu işaretle
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Yükleniyor...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Yeni bildirim yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">
                        {getNotificationTypeIcon(notification.notification_type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNotificationTypeColor(notification.notification_type)}`}>
                            {notification.notification_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <Link
              href="/notifications"
              className="block text-center text-sm text-indigo-600 hover:text-indigo-800"
              onClick={() => setIsOpen(false)}
            >
              Tüm bildirimleri görüntüle
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
