'use client';

import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
  toolbar?: string;
  plugins?: string;
  menubar?: boolean;
  statusbar?: boolean;
}

export default function TinyMCEEditor({
  value,
  onChange,
  placeholder = 'İçerik yazın...',
  height = 300,
  disabled = false,
  className = '',
  toolbar = 'undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link image | forecolor backcolor | emoticons | fullscreen',
  plugins = 'advlist autolink lists link image charmap print preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount emoticons',
  menubar = false,
  statusbar = true
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className={`tinymce-wrapper ${className}`}>
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        disabled={disabled}
        init={{
          height: height,
          menubar: menubar,
          statusbar: statusbar,
          plugins: plugins,
          toolbar: toolbar,
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          placeholder: placeholder,
          language: 'tr',
          directionality: 'ltr',
          branding: false,
          promotion: false,
          resize: 'vertical',
          paste_data_images: true,
          automatic_uploads: true,
          file_picker_types: 'image',
          images_upload_handler: (blobInfo: any, success: any, failure: any) => {
            // Resim yükleme işlemi burada yapılabilir
            // Şimdilik base64 olarak embed ediyoruz
            const reader = new FileReader();
            reader.onload = () => {
              success(reader.result);
            };
            reader.readAsDataURL(blobInfo.blob());
          },
          setup: (editor: any) => {
            editor.on('init', () => {
              if (disabled) {
                editor.getBody().setAttribute('contenteditable', false);
              }
            });
          }
        }}
      />
    </div>
  );
}

// Basit metin editörü (fallback)
export function SimpleTextEditor({
  value,
  onChange,
  placeholder = 'İçerik yazın...',
  disabled = false,
  className = '',
  rows = 6
}: {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
    />
  );
}

// Email için özelleştirilmiş editör
export function EmailEditor({
  value,
  onChange,
  placeholder = 'E-posta içeriğinizi yazın...',
  disabled = false,
  className = '',
  height = 400
}: Omit<TinyMCEEditorProps, 'toolbar' | 'plugins'>) {
  return (
    <TinyMCEEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      height={height}
      toolbar="undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link | forecolor backcolor | emoticons | fullscreen"
      plugins="advlist autolink lists link charmap searchreplace visualblocks fullscreen emoticons paste wordcount"
      menubar={false}
      statusbar={true}
    />
  );
}

// Not için özelleştirilmiş editör
export function NoteEditor({
  value,
  onChange,
  placeholder = 'Not içeriğinizi yazın...',
  disabled = false,
  className = '',
  height = 300
}: Omit<TinyMCEEditorProps, 'toolbar' | 'plugins'>) {
  return (
    <TinyMCEEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      height={height}
      toolbar="undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright | bullist numlist outdent indent | link | forecolor backcolor | emoticons"
      plugins="advlist autolink lists link charmap searchreplace visualblocks emoticons paste wordcount"
      menubar={false}
      statusbar={true}
    />
  );
}
