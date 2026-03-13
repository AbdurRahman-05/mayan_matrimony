import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getChatList, getChatMessages, sendChatMessage, startChat, editChatMessage, unsendChatMessage, globalCache } from '../services/api';
import { Loader2, Send, ArrowLeft, MessageSquare, Edit2, Trash2, X } from 'lucide-react';
import './Chat.css';

const Chat = () => {
    const { uniqueId } = useParams();
    const navigate = useNavigate();
    
    const [chatList, setChatList] = useState(globalCache.chatList || []);
    const [messages, setMessages] = useState(uniqueId ? (globalCache.chatMessages[uniqueId] || []) : []);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [inputValue, setInputValue] = useState('');
    
    const [loadingList, setLoadingList] = useState(!globalCache.chatList);
    const [loadingMessages, setLoadingMessages] = useState(uniqueId ? !globalCache.chatMessages[uniqueId] : false);
    
    // Message context menu state
    const [selectedMessage, setSelectedMessage] = useState(null); // the message id currently having context menu open
    const [editingMessage, setEditingMessage] = useState(null); // the message currently being edited
    const [editInputValue, setEditInputValue] = useState('');
    
    const chatMessagesRef = useRef(null);
    const isMutatingRef = useRef(false);
    const mutationCountRef = useRef(0);

    useEffect(() => {
        let isMounted = true;
        let timeoutId;
        
        const loopChatList = async () => {
            if (isMounted) {
                await loadChatListSilently();
                timeoutId = setTimeout(loopChatList, 2500); // Wait for response, then delay 2.5s
            }
        };

        loadChatList().then(() => {
            if (isMounted) timeoutId = setTimeout(loopChatList, 2500);
        });
        
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        let timeoutId;

        const loopMessages = async () => {
            if (isMounted && uniqueId) {
                await loadMessagesSilently(uniqueId);
                timeoutId = setTimeout(loopMessages, 2500);
            }
        };

        if (uniqueId) {
            loadMessages(uniqueId).then(() => {
                if (isMounted) timeoutId = setTimeout(loopMessages, 2500);
            });
        } else {
            setMessages([]);
            setActiveChatUser(null);
        }

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [uniqueId]);

    const prevMessagesLength = useRef(0);

    useEffect(() => {
        // Only scroll to bottom if new messages were added
        if (messages.length > prevMessagesLength.current) {
            scrollToBottom();
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    };

    const loadChatList = async () => {
        if (!globalCache.chatList) setLoadingList(true);
        try {
            const list = await getChatList();
            globalCache.chatList = list;
            setChatList(list);
            
            // If we came with a uniqueId, ensure it's in the list or initialized
            if (uniqueId) {
                const existing = list.find(c => c.unique_id === uniqueId);
                if (!existing) {
                    // Initialize chat with this new user
                    await startChat(uniqueId);
                    // Reload list
                    const updatedList = await getChatList();
                    setChatList(updatedList);
                }
            }
        } catch (error) {
            console.error('Failed to load chat list:', error);
        } finally {
            setLoadingList(false);
        }
    };

    const loadChatListSilently = async () => {
        try {
            const list = await getChatList();
            globalCache.chatList = list;
            setChatList(list);
        } catch (error) {
            console.error('Failed to load chat list quietly:', error);
        }
    };

    const loadMessages = async (userId) => {
        if (!globalCache.chatMessages[userId]) setLoadingMessages(true);
        try {
            const data = await getChatMessages(userId);
            globalCache.chatMessages[userId] = data.messages;
            setMessages(data.messages);
            setActiveChatUser(data.otherUser);
            
            // Re-fetch chat list to update read status or latest message
            loadChatListSilently();
        } catch (error) {
            console.error('Failed to load messages:', error);
            if (error.message.includes('cannot chat')) {
                 navigate('/chat');
            }
        } finally {
            setLoadingMessages(false);
        }
    };

    const loadMessagesSilently = async (userId) => {
        if (isMutatingRef.current) return;
        const currentMutation = mutationCountRef.current;
        try {
            const data = await getChatMessages(userId);
            if (isMutatingRef.current || currentMutation !== mutationCountRef.current) return;
            globalCache.chatMessages[userId] = data.messages;
            setMessages(prev => {
                // Check if there are any actual changes (new messages, edits, deletions)
                if (JSON.stringify(prev) !== JSON.stringify(data.messages)) {
                    return data.messages;
                }
                return prev;
            });
            setActiveChatUser(data.otherUser);
        } catch (error) {
            console.error('Failed to load messages quietly:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (editingMessage) {
            handleSaveEdit();
            return;
        }
        
        if (!inputValue.trim() || !activeChatUser) return;

        const currentInput = inputValue;
        setInputValue('');
        
        // 1. Optimistic UI update (immediate display)
        const tempMsgId = 'temp-' + Date.now();
        const optimisticMsg = {
            id: tempMsgId,
            content: currentInput,
            isSender: true,
            createdAt: new Date().toISOString(),
            isRead: false,
            isEdited: false
        };
        
        setMessages(prev => [...prev, optimisticMsg]);
        
        // Optimistic chat list update
        setChatList(prev => {
            const updated = prev.map(chat => {
                if (chat.unique_id === activeChatUser.uniqueId) {
                    return {
                        ...chat,
                        last_message: currentInput,
                        last_message_time: optimisticMsg.createdAt
                    };
                }
                return chat;
            });
            return updated.sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0));
        });

        // 2. Background Sync
        isMutatingRef.current = true;
        mutationCountRef.current += 1;
        try {
            const res = await sendChatMessage(activeChatUser.uniqueId, currentInput);
            setMessages(prev => prev.map(m => m.id === tempMsgId ? res.data : m));
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempMsgId));
            setInputValue(currentInput); 
        } finally {
            setTimeout(() => {
                isMutatingRef.current = false;
            }, 300);
        }
    };
    
    const handleContextMenu = (e, msg) => {
        e.preventDefault(); // Prevent native right-click menu
        if (msg.isSender) {
            setSelectedMessage(selectedMessage === msg.id ? null : msg.id);
        }
    };
    
    const touchTimerRef = useRef(null);
    
    const handleTouchStart = (e, msg) => {
        if (!msg.isSender) return;
        touchTimerRef.current = setTimeout(() => {
            setSelectedMessage(selectedMessage === msg.id ? null : msg.id);
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
        }
    };
    
    const startEditing = (msg) => {
        setEditingMessage(msg);
        setInputValue(msg.content);
        setSelectedMessage(null);
    };
    
    const handleSaveEdit = async () => {
        if (!inputValue.trim() || !editingMessage) return;
        const tempMsgId = editingMessage.id;
        const newContent = inputValue;
        
        // Optimistic update for immediate UI feedback
        setMessages(prev => prev.map(m => m.id === tempMsgId ? { ...m, content: newContent, isEdited: true } : m));
        setEditingMessage(null);
        setInputValue('');
        
        isMutatingRef.current = true;
        mutationCountRef.current += 1;
        try {
            const res = await editChatMessage(tempMsgId, newContent);
            setMessages(prev => prev.map(m => m.id === tempMsgId ? res.data : m));
        } catch (err) {
            console.error('Failed to edit:', err);
        } finally {
            setTimeout(() => {
                isMutatingRef.current = false;
            }, 300);
        }
    };
    
    const cancelEdit = () => {
        setEditingMessage(null);
        setInputValue('');
    };
    
    const handleDeleteMessage = async (msgId) => {
        setSelectedMessage(null);
        
        // Optimistic update for immediate UI feedback
        setMessages(prev => prev.filter(m => m.id !== msgId));
        
        isMutatingRef.current = true;
        mutationCountRef.current += 1;
        try {
            await unsendChatMessage(msgId);
        } catch(err) {
            console.error('Failed to unsend:', err);
        } finally {
            setTimeout(() => {
                isMutatingRef.current = false;
            }, 300);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-page">
            <Navbar />
            
            <div className="chat-container">
                <div className="chat-layout glass-panel">
                    
                    {/* Chat List Sidebar */}
                    <div className={`chat-sidebar ${uniqueId ? 'hidden-mobile' : ''}`}>
                        <div className="chat-sidebar-header">
                            <h2>Messages</h2>
                        </div>
                        
                        <div className="chat-list">
                            {loadingList ? (
                                <div className="chat-loading">
                                    <Loader2 className="animate-spin" />
                                </div>
                            ) : chatList.length === 0 ? (
                                <div className="chat-empty-list">
                                    <MessageSquare size={48} color="#cbd5e1" />
                                    <p>No conversations yet.</p>
                                </div>
                            ) : (
                                chatList.map((chat) => (
                                    <div 
                                        key={chat.unique_id}
                                        className={`chat-list-item ${uniqueId === chat.unique_id ? 'active' : ''}`}
                                        onClick={() => navigate(`/chat/${chat.unique_id}`)}
                                    >
                                        <div className="chat-avatar">
                                            {chat.photo ? (
                                                <img src={chat.photo} alt={chat.full_name} />
                                            ) : (
                                                <div className="avatar-placeholder">{chat.full_name?.charAt(0) || '?'}</div>
                                            )}
                                        </div>
                                        <div className="chat-list-info">
                                            <div className="chat-list-name">{chat.full_name}</div>
                                            <div className="chat-list-preview">
                                                {chat.last_message || 'Start chatting...'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={`chat-window ${!uniqueId ? 'hidden-mobile' : ''}`}>
                        {!uniqueId ? (
                            <div className="chat-empty-window">
                                <MessageSquare size={64} color="#e2e8f0" />
                                <h3>Select a conversation</h3>
                                <p>Choose a profile from the left to start chatting.</p>
                            </div>
                        ) : loadingMessages ? (
                            <div className="chat-loading">
                                <Loader2 className="animate-spin" size={32} />
                            </div>
                        ) : activeChatUser ? (
                            <>
                                <div className="chat-header">
                                    <button className="chat-back-btn desktop-hide" onClick={() => navigate('/chat')}>
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="chat-header-info" onClick={() => navigate(`/profile/${activeChatUser.uniqueId}`)} style={{cursor: 'pointer'}}>
                                        <div className="chat-avatar small">
                                            {activeChatUser.photo ? (
                                                <img src={activeChatUser.photo} alt={activeChatUser.fullName} />
                                            ) : (
                                                <div className="avatar-placeholder">{activeChatUser.fullName?.charAt(0) || '?'}</div>
                                            )}
                                        </div>
                                        <h3>{activeChatUser.fullName}</h3>
                                    </div>
                                </div>

                                <div className="chat-messages" onClick={() => setSelectedMessage(null)} ref={chatMessagesRef}>
                                    {messages.map((msg, index) => {
                                        return (
                                            <React.Fragment key={msg.id}>
                                                <div className={`chat-bubble-wrapper ${msg.isSender ? 'sent' : 'received'}`}>
                                                    <div 
                                                        className={`chat-bubble ${selectedMessage === msg.id ? 'selected' : ''}`}
                                                        onContextMenu={(e) => handleContextMenu(e, msg)}
                                                        onTouchStart={(e) => handleTouchStart(e, msg)}
                                                        onTouchEnd={handleTouchEnd}
                                                        onTouchMove={handleTouchEnd}
                                                    >
                                                        <div className="chat-text">
                                                            {msg.content}
                                                            {msg.isEdited && <span className="edited-label">(edited)</span>}
                                                        </div>
                                                        <div className="chat-time">{formatTime(msg.createdAt)}</div>
                                                        
                                                        {selectedMessage === msg.id && msg.isSender && (
                                                            <div className="chat-context-menu">
                                                                <button type="button" onPointerDown={(e) => { e.stopPropagation(); startEditing(msg); }} onClick={(e) => e.stopPropagation()}>
                                                                    Edit
                                                                </button>
                                                                <button type="button" className="delete-opt" onPointerDown={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }} onClick={(e) => e.stopPropagation()}>
                                                                    Unsend
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>

                                <form className="chat-input-area" onSubmit={handleSendMessage}>
                                    {editingMessage && (
                                        <div className="edit-badge">
                                            <span>Editing message...</span>
                                            <button type="button" onClick={cancelEdit}><X size={14} /></button>
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="chat-input"
                                        style={{ marginTop: editingMessage ? '10px' : '0' }}
                                    />
                                    <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
                                        <Send size={20} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="chat-empty-window">
                                <p>User not found.</p>
                            </div>
                        )}
                    </div>
                    
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default Chat;
