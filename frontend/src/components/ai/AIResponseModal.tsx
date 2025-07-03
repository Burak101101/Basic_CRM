'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, CheckIcon, PencilIcon } from '@heroicons/react/24/outline';
import { EmailEditor } from '@/components/common/TinyMCEEditor';

interface AIResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onApprove: (content: string) => void;
  onReject?: () => void;
  loading?: boolean;
  type?: 'email' | 'text';
}

export default function AIResponseModal({
  isOpen,
  onClose,
  title,
  content,
  onApprove,
  onReject,
  loading = false,
  type = 'email'
}: AIResponseModalProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedContent(content);
    setIsEditing(false);
  }, [content]);

  const handleApprove = () => {
    onApprove(editedContent);
  };

  const handleReject = () => {
    if (onReject) {
      onReject();
    } else {
      onClose();
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleEdit}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      {isEditing ? 'Önizleme' : 'Düzenle'}
                    </button>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  {isEditing ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İçeriği Düzenle
                      </label>
                      {type === 'email' ? (
                        <EmailEditor
                          value={editedContent}
                          onChange={setEditedContent}
                          height={400}
                        />
                      ) : (
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          rows={12}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI Tarafından Oluşturulan İçerik
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                        {type === 'email' ? (
                          <div className="ai-preview-content" dangerouslySetInnerHTML={{ __html: editedContent }} />
                        ) : (
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {editedContent}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <CheckIcon className="h-4 w-4 mr-2" />
                    )}
                    Onayla ve Kullan
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
