import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Send, User, MessageSquare, Search, Clock, CheckCheck } from 'lucide-react';

const UserMessages = () => {
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (location.state?.partnerId && !loading) {
            const existingConv = conversations.find(c => c.partnerId === location.state.partnerId);
            if (existingConv) {
                setActiveConv(existingConv);
                fetchMessages(existingConv.partnerId);
            } else {
                // Create a temporary conversation object for the UI
                const tempConv = {
                    partnerId: location.state.partnerId,
                    partnerName: location.state.partnerName || 'New Seller',
                    lastMessage: 'Starting a new conversation...',
                    lastTimestamp: new Date(),
                    unreadCount: 0
                };
                setConversations([tempConv, ...conversations]);
                setActiveConv(tempConv);
                setMessages([]);
            }
        }
    }, [location.state, loading]);

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/message/conversations');
            const data = await res.json();
            if (data.success) {
                setConversations(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (partnerId) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/message/${partnerId}`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
                // Update unread count in UI
                setConversations(prev => prev.map(c =>
                    c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
                ));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSelectConv = (conv) => {
        setActiveConv(conv);
        fetchMessages(conv.partnerId);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConv) return;

        try {
            const res = await fetch('/api/message/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: activeConv.partnerId,
                    content: newMessage
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessages([...messages, data.data]);
                setNewMessage('');
                // Update last message in conv list
                setConversations(prev => prev.map(c =>
                    c.partnerId === activeConv.partnerId
                        ? { ...c, lastMessage: data.data.content, lastTimestamp: data.data.createdAt }
                        : c
                ).sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp)));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400">Loading Conversations...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 h-[calc(100vh-120px)]">
            <div className="bg-white h-full rounded-[2.5rem] shadow-2xl border border-slate-100 flex overflow-hidden">

                {/* Sidebar */}
                <div className="w-1/3 border-r border-slate-100 flex flex-col">
                    <div className="p-8 border-b border-slate-50">
                        <h1 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                            <MessageSquare className="text-blue-600" />
                            Messages
                        </h1>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl text-sm focus:outline-none focus:border-blue-300"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-10 text-center">
                                <p className="text-slate-400 font-bold text-sm">No conversations yet.</p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.partnerId}
                                    onClick={() => handleSelectConv(conv)}
                                    className={`p-6 cursor-pointer flex gap-4 transition-all hover:bg-slate-50 ${activeConv?.partnerId === conv.partnerId ? 'bg-blue-50/50 border-r-4 border-blue-600' : ''}`}
                                >
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center overflow-hidden">
                                            {conv.partnerAvatar ? <img src={conv.partnerAvatar} alt="" /> : <User className="text-slate-400" />}
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-black text-slate-800 truncate">{conv.partnerName}</p>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {new Date(conv.lastTimestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 truncate font-medium">{conv.lastMessage}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-50/30">
                    {activeConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                                        {activeConv.partnerAvatar ? <img src={activeConv.partnerAvatar} alt="" /> : <User />}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800">{activeConv.partnerName}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Online Now
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-6">
                                {loadingMessages ? (
                                    <div className="text-center text-slate-400 font-bold uppercase text-xs tracking-widest py-20">Syncing with LandSolutions servers...</div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.sender === currentUser?.rest?._id;
                                        return (
                                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-5 rounded-[1.5rem] shadow-sm font-medium leading-relaxed ${isMe
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                                    }`}>
                                                    <p>{msg.content}</p>
                                                    <div className={`mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-60 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <Clock size={10} />
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && msg.readAt && <CheckCheck size={10} />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-8 bg-white border-t border-slate-100">
                                <form onSubmit={handleSendMessage} className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message to seller..."
                                        className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl font-medium focus:outline-none focus:border-blue-400 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-blue-600 text-white p-5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                                    >
                                        <Send size={24} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 border border-slate-50">
                                <MessageSquare className="text-blue-600 w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Your LandSolutions Inbox</h2>
                            <p className="text-slate-400 font-medium max-w-sm">Select a conversation from the list to start discussing property details and secure your next investment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserMessages;
