'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { PlusIcon, CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { getEvents, getEventTypeLabel, getEventStatusLabel, getEventPriorityLabel } from '@/services/eventService';
import { EventList } from '@/types/events';

export default function EventsPage() {
  const [events, setEvents] = useState<EventList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today' | 'completed'>('all');

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (err) {
      console.error('Etkinlikler yüklenirken hata:', err);
      setError('Etkinlikler yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const now = new Date();
    const eventDate = new Date(event.start_datetime);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'upcoming':
        return eventDate > now && event.status !== 'completed';
      case 'today':
        return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      case 'completed':
        return event.status === 'completed';
      default:
        return true;
    }
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'postponed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <AppWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
        title="Etkinlikler" 
        subtitle="Toplantılar, görüşmeler ve etkinlikleri yönetin"
        action={
          <Link
            href="/events/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Yeni Etkinlik
          </Link>
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
              { key: 'upcoming', label: 'Yaklaşan' },
              { key: 'today', label: 'Bugün' },
              { key: 'completed', label: 'Tamamlanan' },
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

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Etkinlik bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'Henüz hiç etkinlik eklenmemiş.' : 'Bu filtreye uygun etkinlik bulunamadı.'}
            </p>
            <div className="mt-6">
              <Link
                href="/events/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                İlk etkinliği ekle
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href={`/events/${event.id}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {event.title}
                    </h3>
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getEventStatusLabel(event.status)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {getEventPriorityLabel(event.priority)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{getEventTypeLabel(event.event_type)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>{formatDateTime(event.start_datetime)}</span>
                    </div>

                    {event.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    {event.company_name && (
                      <div className="flex items-center">
                        <span className="font-medium">{event.company_name}</span>
                      </div>
                    )}

                    {event.participants_count > 0 && (
                      <div className="text-xs text-gray-500">
                        {event.participants_count} katılımcı
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </AppWrapper>
  );
}
