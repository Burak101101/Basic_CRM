'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { EmailEditor } from '@/components/common/TinyMCEEditor';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EmailComposerProps {
  onSend: (emailData: EmailData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<EmailData>;
  isLoading?: boolean;
}

interface EmailData {
  subject: string;
  content: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  attachments?: File[];
}

interface AttachmentInfo {
  file: File;
  id: string;
}

export default function EmailComposer({
  onSend,
  onCancel,
  initialData,
  isLoading = false
}: EmailComposerProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<EmailData>({
    defaultValues: {
      subject: initialData?.subject || '',
      recipients: initialData?.recipients || [],
      cc: initialData?.cc || [],
      bcc: initialData?.bcc || []
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: AttachmentInfo[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Dosya boyutu kontrolü (10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} dosyası çok büyük. Maksimum 10MB olmalıdır.`);
          continue;
        }
        
        // Desteklenen dosya tiplerini kontrol et
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/gif'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          alert(`${file.name} desteklenmeyen bir dosya tipi.`);
          continue;
        }
        
        newAttachments.push({
          file,
          id: Math.random().toString(36).substr(2, 9)
        });
      }
      
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    
    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const parseEmailList = (emailString: string): string[] => {
    return emailString
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  const onSubmit = async (data: EmailData) => {
    const emailData: EmailData = {
      ...data,
      content,
      recipients: parseEmailList(data.recipients.join(',')),
      cc: showCc ? parseEmailList(data.cc?.join(',') || '') : undefined,
      bcc: showBcc ? parseEmailList(data.bcc?.join(',') || '') : undefined,
      attachments: attachments.map(att => att.file)
    };

    await onSend(emailData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Yeni E-posta</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        {/* Alıcılar */}
        <div>
          <label htmlFor="recipients" className="block text-sm font-medium text-gray-700">
            Alıcılar *
          </label>
          <textarea
            id="recipients"
            {...register('recipients', { 
              required: 'En az bir alıcı belirtilmelidir',
              validate: (value) => {
                const emails = parseEmailList(value.join(','));
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const invalidEmails = emails.filter(email => !emailRegex.test(email));
                if (invalidEmails.length > 0) {
                  return `Geçersiz e-posta adresleri: ${invalidEmails.join(', ')}`;
                }
                return true;
              }
            })}
            rows={2}
            placeholder="E-posta adreslerini virgül, noktalı virgül veya yeni satırla ayırın"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.recipients && (
            <p className="mt-1 text-sm text-red-600">{errors.recipients.message}</p>
          )}
        </div>

        {/* CC/BCC Butonları */}
        <div className="flex space-x-2">
          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              CC Ekle
            </button>
          )}
          {!showBcc && (
            <button
              type="button"
              onClick={() => setShowBcc(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              BCC Ekle
            </button>
          )}
        </div>

        {/* CC */}
        {showCc && (
          <div>
            <label htmlFor="cc" className="block text-sm font-medium text-gray-700">
              CC
            </label>
            <textarea
              id="cc"
              {...register('cc')}
              rows={1}
              placeholder="CC alıcıları"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div>
            <label htmlFor="bcc" className="block text-sm font-medium text-gray-700">
              BCC
            </label>
            <textarea
              id="bcc"
              {...register('bcc')}
              rows={1}
              placeholder="BCC alıcıları"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}

        {/* Konu */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Konu *
          </label>
          <input
            type="text"
            id="subject"
            {...register('subject', { required: 'Konu zorunludur' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="E-posta konusu"
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
          )}
        </div>

        {/* İçerik */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            İçerik *
          </label>
          <EmailEditor
            value={content}
            onChange={setContent}
            height={400}
            placeholder="E-posta içeriğinizi yazın..."
          />
        </div>

        {/* Ek Dosyalar */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Ek Dosyalar
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PaperClipIcon className="h-4 w-4 mr-1" />
              Dosya Ekle
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          />

          {/* Eklenen Dosyalar */}
          {attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center">
                    <PaperClipIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{attachment.file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({formatFileSize(attachment.file.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              İptal
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
}
