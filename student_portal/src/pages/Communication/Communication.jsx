import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Paperclip, X, ArrowLeft } from 'lucide-react';
import BAvatar from 'boring-avatars';
import EmojiPicker from 'emoji-picker-react';
import { chatService } from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { formatTime, formatDate, formatBytes } from '../../utils/formatters';
import MessageContent from './MessageContent';


export default function Communication({ student, onUnreadChange }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [search, setSearch]               = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [typing, setTyping]               = useState(false);
  const [onlineUsers, setOnlineUsers]     = useState(new Set());
  const [showEmoji, setShowEmoji]         = useState(false);
  const [attachedFile, setAttachedFile]   = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef      = useRef(null);
  const selectedRef    = useRef(null);
  const typingTimer    = useRef(null);
  const fileInputRef   = useRef(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Bubble up total unread count whenever conversations change
  useEffect(() => {
    const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    onUnreadChange?.(total);
  }, [conversations, onUnreadChange]);

  const markReadLocally = useCallback((senderId) => {
    setConversations(p => p.map(c =>
      c.userId?.toString() === senderId?.toString() ? { ...c, unreadCount: 0 } : c
    ));
  }, []);

  // Socket setup
  useEffect(() => {
    if (!student?._id) return;
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('online_users', ids => setOnlineUsers(new Set(ids)));
    socket.on('user_online',  ({ userId }) => setOnlineUsers(p => new Set([...p, userId])));
    socket.on('user_offline', ({ userId }) => setOnlineUsers(p => { const n = new Set(p); n.delete(userId); return n; }));

    socket.on('receive_message', msg => {
      const cur      = selectedRef.current;
      const senderId = msg.senderId?.toString();
      if (cur && senderId === cur.userId?.toString()) {
        setMessages(p => [...p, msg]);
        socket.emit('message_read', { senderId: msg.senderId, receiverId: student._id });
        chatService.markRead(msg.senderId, student._id).catch(() => {});
        setConversations(p => p.map(c =>
          c.userId?.toString() === senderId
            ? { ...c, lastMessage: msg.message, lastTime: msg.timestamp, unreadCount: 0 }
            : c
        ));
      } else {
        setConversations(p => p.map(c =>
          c.userId?.toString() === senderId
            ? { ...c, lastMessage: msg.message, lastTime: msg.timestamp, unreadCount: (c.unreadCount || 0) + 1 }
            : c
        ));
      }
    });

    socket.on('message_sent', ({ _id, tempId, timestamp }) => {
      setMessages(p => p.map(m => m._id === tempId ? { ...m, _id, timestamp } : m));
    });

    socket.on('user_typing', ({ senderId }) => {
      if (selectedRef.current?.userId?.toString() === senderId?.toString()) {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 2000);
      }
    });

    socket.on('messages_read', () => {
      setMessages(p => p.map(m => ({ ...m, read: true })));
    });

    return () => {
      disconnectSocket();
      clearTimeout(typingTimer.current);
    };
  }, [student._id, markReadLocally]);

  // Load conversations + pre-seed assigned mentors
  useEffect(() => {
    if (!student?._id) return;
    chatService.getConversations(student._id)
      .then(res => {
        const convos = res.data || [];
        const convoIds = new Set(convos.map(c => c.userId?.toString()));
        (student.mentors || []).forEach(({ mentor }) => {
          if (mentor?._id && !convoIds.has(mentor._id.toString())) {
            convos.unshift({ userId: mentor._id, name: mentor.name, email: mentor.email, lastMessage: '', unreadCount: 0 });
            convoIds.add(mentor._id.toString());
          }
        });
        setConversations(convos);
      })
      .catch(console.error);
  }, [student?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when selected contact changes
  useEffect(() => {
    if (!selected?.userId || !student?._id) return;
    chatService.getMessages(student._id, selected.userId)
      .then(res => setMessages(res.data))
      .catch(() => setMessages([]));
    socketRef.current?.emit('message_read', { senderId: selected.userId, receiverId: student._id });
    chatService.markRead(selected.userId, student._id)
      .then(() => markReadLocally(selected.userId))
      .catch(() => markReadLocally(selected.userId));
  }, [selected?.userId, student._id, markReadLocally]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!search.trim()) { setSearchResults([]); return; }
      chatService.searchUsers(search).then(res => setSearchResults(res.data)).catch(console.error);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (file.type.startsWith('image/') && file.size <= 500 * 1024) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachedFile({ name: file.name, type: file.type, size: file.size, dataUrl: ev.target.result });
      reader.readAsDataURL(file);
    } else {
      setAttachedFile({ name: file.name, type: file.type, size: file.size, dataUrl: null });
    }
  };

  const handleSend = () => {
    if (!input.trim() && !attachedFile) return;
    if (!selected || !student?._id) return;

    let messageContent = input.trim();

    if (attachedFile) {
      if (attachedFile.type.startsWith('image/') && attachedFile.dataUrl) {
        messageContent = `[IMG:${attachedFile.dataUrl}]${messageContent ? '\n' + messageContent : ''}`;
      } else {
        messageContent = `[FILE:${attachedFile.name}||${attachedFile.size}||${attachedFile.type}]${messageContent ? '\n' + messageContent : ''}`;
      }
      setAttachedFile(null);
    }

    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      _id: tempId, senderId: student._id, receiverId: selected.userId,
      message: messageContent, timestamp: new Date().toISOString(), read: false,
    };
    setMessages(p => [...p, optimistic]);
    socketRef.current?.emit('send_message', {
      senderId: student._id, receiverId: selected.userId,
      message: messageContent, tempId,
    });
    setConversations(p => {
      const exists = p.find(c => c.userId?.toString() === selected.userId?.toString());
      const preview = attachedFile ? (attachedFile.type.startsWith('image/') ? '📷 Image' : `📎 ${attachedFile.name}`) : messageContent;
      if (exists) return p.map(c =>
        c.userId?.toString() === selected.userId?.toString()
          ? { ...c, lastMessage: preview, lastTime: new Date().toISOString() }
          : c
      );
      return [{ userId: selected.userId, name: selected.name, email: selected.email, lastMessage: preview, lastTime: new Date().toISOString(), unreadCount: 0 }, ...p];
    });
    setInput('');
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); return; }
    if (selected && student?._id) {
      socketRef.current?.emit('typing', { senderId: student._id, receiverId: selected.userId });
    }
  };

  const handleSelectContact = contact => {
    setSelected(contact);
    setSearch('');
    setSearchResults([]);
    setMobileShowChat(true);
  };

  const contactList = search
    ? searchResults.map(u => ({ userId: u._id, name: u.name, email: u.email, lastMessage: '', unreadCount: 0 }))
    : conversations;

  const grouped = messages.reduce((acc, msg) => {
    const d = formatDate(msg.timestamp);
    (acc[d] = acc[d] || []).push(msg);
    return acc;
  }, {});

  const lastMsgPreview = (msg) => {
    if (!msg) return '';
    if (msg.startsWith('[IMG:')) return '📷 Image';
    if (msg.startsWith('[FILE:')) {
      const end = msg.indexOf(']', 6);
      const filename = end > -1 ? msg.slice(6, end).split('||')[0] : 'File';
      return `📎 ${filename}`;
    }
    return msg;
  };

  return (
    <div className="page-content pb-0">
      <div className="flex h-[calc(100vh-184px)] md:h-[calc(100vh-120px)] bg-white rounded-[14px] border border-slate-200 overflow-hidden">

        {/* ── Contact list ── */}
        <div className={`border-r border-slate-200 flex-col flex-shrink-0 w-full md:w-[280px]
          ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-[18px] border-b border-slate-200">
            <h3 className="text-[15px] font-bold text-slate-900 mb-2.5">Messages</h3>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-[7px]">
              <Search size={14} color="#94a3b8" />
              <input
                placeholder="Search people..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 border-none bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {contactList.length === 0 ? (
              <div className="py-6 px-4 text-center text-slate-400 text-[13px]">
                {search ? 'No users found' : 'No conversations yet'}
              </div>
            ) : (
              contactList.map(contact => (
                <div
                  key={contact.userId}
                  onClick={() => handleSelectContact(contact)}
                  className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-all border-b border-slate-50
                    ${selected?.userId?.toString() === contact.userId?.toString()
                      ? 'bg-indigo-600/[0.06] border-r-[3px] border-r-indigo-600'
                      : 'hover:bg-slate-50'
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <BAvatar size={40} name={contact.name || 'User'} variant="beam" />
                    </div>
                    {onlineUsers.has(contact.userId?.toString()) && (
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 right-0" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-[13px] font-semibold text-slate-900 mb-0.5">{contact.name}</div>
                    <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                      {lastMsgPreview(contact.lastMessage) || contact.email}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {contact.lastTime && (
                      <span className="text-[10px] text-slate-400">{formatTime(contact.lastTime)}</span>
                    )}
                    {contact.unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-[2px] rounded-[10px] min-w-[18px] text-center">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Chat window ── */}
        {selected ? (
          <div className={`flex-1 flex-col min-w-0 ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
            {/* Header */}
            <div className="px-3 md:px-5 py-4 border-b border-slate-200 flex items-center gap-3 flex-shrink-0">
              {/* Back button — mobile only */}
              <button
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0"
                onClick={() => setMobileShowChat(false)}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <BAvatar size={40} name={selected.name || 'User'} variant="beam" />
                </div>
                {onlineUsers.has(selected.userId?.toString()) && (
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 right-0" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-slate-900">{selected.name}</h4>
                <p className="text-xs font-medium">
                  {typing
                    ? <span className="text-indigo-500">typing...</span>
                    : <span className={onlineUsers.has(selected.userId?.toString()) ? 'text-emerald-500' : 'text-slate-400'}>
                        {onlineUsers.has(selected.userId?.toString()) ? 'Online' : 'Offline'}
                      </span>
                  }
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {[{ icon: Phone, title: 'Voice call' }, { icon: Video, title: 'Video call' }, { icon: MoreVertical, title: 'More options' }].map(({ icon: Icon, title }) => (
                  <button key={title} title={title}
                    className="w-9 h-9 border border-slate-200 rounded-lg bg-white flex items-center justify-center cursor-pointer text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900">
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1 bg-[#f0f2f5]">
              {Object.entries(grouped).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center gap-4 py-1 my-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap bg-[#f0f2f5] px-2">{date}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  {msgs.map(msg => {
                    const isSelf = msg.senderId?.toString() === student._id?.toString();
                    return (
                      <div key={msg._id} className={`flex mb-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[65%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3.5 py-2 text-sm leading-relaxed
                            ${isSelf
                              ? 'bg-[#d9fdd3] text-slate-900 rounded-[10px] rounded-tr-[2px]'
                              : 'bg-white text-slate-900 rounded-[10px] rounded-tl-[2px] shadow-sm'
                            }`}>
                            <MessageContent text={msg.message} />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-[2px] flex items-center gap-1 px-1">
                            {formatTime(msg.timestamp)}
                            {isSelf && <span className="text-slate-400">{msg.read ? '✓✓' : '✓'}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {typing && (
                <div className="flex justify-start mb-1">
                  <div className="bg-white rounded-[10px] rounded-tl-[2px] shadow-sm px-3.5 py-2 text-slate-400 text-sm italic">
                    typing...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* File preview bar */}
            {attachedFile && (
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-2.5">
                {attachedFile.dataUrl ? (
                  <img src={attachedFile.dataUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Paperclip size={16} className="text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 truncate">{attachedFile.name}</p>
                  <p className="text-[11px] text-slate-500">{formatBytes(attachedFile.size)}</p>
                </div>
                <button onClick={() => setAttachedFile(null)} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors flex-shrink-0">
                  <X size={11} />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2.5 bg-white flex-shrink-0">
              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 border border-slate-200 rounded-lg bg-white flex items-center justify-center cursor-pointer text-slate-500 transition-all hover:bg-slate-100 flex-shrink-0"
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>

              {/* Emoji button */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowEmoji(p => !p)}
                  className={`w-9 h-9 border border-slate-200 rounded-lg bg-white flex items-center justify-center cursor-pointer text-[18px] transition-all ${showEmoji ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-slate-100'}`}
                  title="Emoji"
                >
                  😊
                </button>
                {showEmoji && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
                    <div className="absolute bottom-[calc(100%+6px)] left-0 z-50">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => { setInput(p => p + emojiData.emoji); setShowEmoji(false); }}
                        width={300}
                        height={380}
                        previewConfig={{ showPreview: false }}
                        searchPlaceholder="Search emoji..."
                      />
                    </div>
                  </>
                )}
              </div>

              <textarea
                className="flex-1 border-[1.5px] border-slate-200 rounded-[10px] px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all resize-none max-h-[100px] focus:border-indigo-600"
                placeholder={`Message ${selected.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                onClick={handleSend}
                style={{ opacity: (input.trim() || attachedFile) ? 1 : 0.5 }}
                className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-500 text-white border-none rounded-[10px] flex items-center justify-center cursor-pointer transition-all hover:opacity-90 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-slate-500 gap-2.5 bg-[#f0f2f5]">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
              <Search size={28} />
            </div>
            <p className="text-[15px] font-medium text-slate-500">Select someone to start chatting</p>
            <p className="text-[13px] text-slate-400">Your mentor is shown above — click to chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
