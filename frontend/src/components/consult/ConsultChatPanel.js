import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Paperclip, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DocumentViewerModal } from '../ui/DocumentViewer';
import { appointmentConsultService } from '../../services/appointmentConsultService';
import { resolveApiUrl } from '../../utils/apiUrl';

export const resolveAttachmentUrl = (url) => resolveApiUrl(url);

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const ConsultChatPanel = ({ appointmentId, userId, role, userName, socket }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const [viewerDoc, setViewerDoc] = useState(null);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  const appendMessage = useCallback(
    (message) => {
      if (!message?._id) return;
      setMessages((prev) => {
        if (prev.some((item) => item._id === message._id)) return prev;
        return [...prev, message];
      });
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await appointmentConsultService.getChatMessages(appointmentId);
        if (mounted) setMessages(res?.data || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to load chat');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket) return undefined;

    const onMessage = (message) => appendMessage(message);
    const onError = ({ message }) => toast.error(message || 'Chat error');

    socket.on('consult-chat-message', onMessage);
    socket.on('consult-chat-error', onError);

    return () => {
      socket.off('consult-chat-message', onMessage);
      socket.off('consult-chat-error', onError);
    };
  }, [socket, appendMessage]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      if (socket?.connected) {
        socket.emit('consult-chat-message', { appointmentId, text: trimmed });
        setText('');
      } else {
        const res = await appointmentConsultService.sendChatMessage(appointmentId, trimmed);
        appendMessage(res?.data);
        setText('');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploading) return;

    setUploading(true);
    try {
      const res = await appointmentConsultService.uploadChatFile(appointmentId, file);
      appendMessage(res?.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to upload file');
    } finally {
      setUploading(false);
    }
  };

  const renderAttachment = (attachment, isOwn) => {
    if (!attachment?.url) return null;
    const url = resolveAttachmentUrl(attachment.url);
    const isImage = attachment.mimeType?.startsWith('image/');
    const openViewer = () =>
      setViewerDoc({
        url,
        fileName: attachment.fileName,
        fileType: attachment.mimeType
      });

    if (isImage) {
      return (
        <button type="button" onClick={openViewer} className="mt-2 block text-left">
          <img
            src={url}
            alt={attachment.fileName || 'Shared image'}
            className="max-h-40 rounded-xl border border-ink-100 object-cover"
          />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={openViewer}
        className={`mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
          isOwn ? 'border-brand-200 bg-white text-brand-700' : 'border-ink-200 bg-ink-50 text-ink-700'
        }`}
      >
        <FileText size={14} />
        {attachment.fileName || 'View file'}
      </button>
    );
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-2xl border border-ink-200/70 bg-white shadow-sm">
      <div className="border-b border-ink-100 px-4 py-3">
        <p className="text-sm font-bold text-ink-900">Consultation chat</p>
        <p className="text-xs text-ink-500">Messages sync in real time · PDF & images supported</p>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-500">Loading chat…</p>
        ) : messages.length ? (
          messages.map((message) => {
            const isOwn = message.senderId === userId;
            return (
              <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    isOwn ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-800'
                  }`}
                >
                  {!isOwn ? (
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                      {message.senderName || message.senderRole}
                    </p>
                  ) : null}
                  {message.text ? <p className="whitespace-pre-wrap text-sm">{message.text}</p> : null}
                  {renderAttachment(message.attachment, isOwn)}
                  <p className={`mt-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-ink-400'}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-ink-400">
            <ImageIcon size={28} className="mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="mt-1 text-xs">Say hello or share a document</p>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="border-t border-ink-100 p-3">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,application/pdf,image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-ink-200 p-2.5 text-ink-600 hover:bg-ink-50 disabled:opacity-50"
            aria-label="Attach file"
          >
            <Paperclip size={18} className={uploading ? 'animate-pulse' : ''} />
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="min-w-0 flex-1 rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="rounded-xl bg-brand-500 p-2.5 text-white hover:bg-brand-600 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-ink-400">Signed in as {userName || role}</p>
      </form>

      <DocumentViewerModal
        open={Boolean(viewerDoc)}
        document={viewerDoc}
        onClose={() => setViewerDoc(null)}
      />
    </div>
  );
};

export default ConsultChatPanel;
