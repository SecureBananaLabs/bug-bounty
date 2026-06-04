'use client';

import React, { useState } from 'react';

interface Participant {
  name: string;
  avatar?: string;
  role: string;
}

interface Thread {
  id: string;
  participant: Participant;
  project: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  status: 'active' | 'archived' | 'pending';
}

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
}

export default function MessagingPage() {
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: 'thr-1',
      participant: { name: 'Alice Chen', role: 'Client' },
      project: 'E-commerce Frontend Audit',
      lastMessage: 'Let me review the revoking logic on the smart contract before we sign off.',
      timestamp: '10:42 AM',
      unread: true,
      status: 'active',
    },
    {
      id: 'thr-2',
      participant: { name: 'Bob Smith', role: 'Freelancer' },
      project: 'Solana Frontier Hackathon Sentinel',
      lastMessage: 'All Vitest test runs are completely green (79/79) on the PR now.',
      timestamp: 'Yesterday',
      unread: false,
      status: 'active',
    },
    {
      id: 'thr-3',
      participant: { name: 'Carol King', role: 'Client' },
      project: 'Forensic Simulation Spec Draft',
      lastMessage: 'Can we schedule a whale tracking alert integration audit tomorrow?',
      timestamp: 'May 28',
      unread: false,
      status: 'archived',
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>('thr-1');
  const [replyText, setReplyText] = useState('');
  
  const [conversationHistory, setConversationHistory] = useState<Record<string, Message[]>>({
    'thr-1': [
      { id: 'm-1', sender: 'them', text: 'Hi Michael, I saw the new Logic Audit service you posted on Agoragentic.', timestamp: '9:30 AM' },
      { id: 'm-2', sender: 'me', text: 'Hey Alice! Yes, it supports direct x402 settlement. Perfect for infrastructure audits.', timestamp: '9:35 AM' },
      { id: 'm-3', sender: 'them', text: 'Let me review the revoking logic on the smart contract before we sign off.', timestamp: '10:42 AM' },
    ],
    'thr-2': [
      { id: 'm-4', sender: 'me', text: 'Bob, did we finalize the sentinel test suite coverage?', timestamp: 'May 29, 3:15 PM' },
      { id: 'm-5', sender: 'them', text: 'All Vitest test runs are completely green (79/79) on the PR now.', timestamp: 'May 29, 3:20 PM' },
    ],
    'thr-3': [
      { id: 'm-6', sender: 'them', text: 'The PACT specification draft looks incredibly solid.', timestamp: 'May 28, 11:00 AM' },
      { id: 'm-7', sender: 'me', text: 'Excellent, let us integrate the feedback from praxisagent directly.', timestamp: 'May 28, 11:05 AM' },
      { id: 'm-8', sender: 'them', text: 'Can we schedule a whale tracking alert integration audit tomorrow?', timestamp: 'May 28, 11:15 AM' },
    ],
  });

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const messages = conversationHistory[activeThread.id] || [];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg: Message = {
      id: `m-new-${Date.now()}`,
      sender: 'me',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation history
    setConversationHistory(prev => ({
      ...prev,
      [activeThread.id]: [...(prev[activeThread.id] || []), newMsg]
    }));

    // Update last message in thread list
    setThreads(prev =>
      prev.map(t =>
        t.id === activeThread.id
          ? { ...t, lastMessage: replyText, timestamp: 'Just now', unread: false }
          : t
      )
    );

    setReplyText('');
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setThreads(prev =>
      prev.map(t => (t.id === id ? { ...t, unread: false } : t))
    );
  };

  return (
    <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 0' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#f2f5ff', fontWeight: 600 }}>
        Inbox & Messaging
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '1.5rem',
        background: '#151c35',
        border: '1px solid #2a3765',
        borderRadius: '12px',
        height: '600px',
        overflow: 'hidden'
      }}>
        
        {/* Sidebar / Threads List */}
        <div style={{
          borderRight: '1px solid #2a3765',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: '#0d1326'
        }}>
          <div style={{
            padding: '1.2rem',
            borderBottom: '1px solid #2a3765',
            fontWeight: 600,
            color: '#f2f5ff'
          }}>
            Conversations ({threads.filter(t => t.unread).length} unread)
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectThread(t.id)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: 'none',
                  borderBottom: '1px solid #1a233d',
                  background: t.id === activeThreadId ? '#1a2444' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  transition: 'background 0.2s',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (t.id !== activeThreadId) e.currentTarget.style.background = '#121930';
                }}
                onMouseLeave={(e) => {
                  if (t.id !== activeThreadId) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontWeight: 600, color: '#f2f5ff', fontSize: '0.95rem' }}>
                    {t.participant.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: t.unread ? '#38bdf8' : '#8c9cb2' }}>
                    {t.timestamp}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.project}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: t.unread ? '#e2e8f0' : '#8c9cb2',
                  fontWeight: t.unread ? 600 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.25'
                }}>
                  {t.lastMessage}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Thread Header */}
          <div style={{
            padding: '1.2rem',
            borderBottom: '1px solid #2a3765',
            background: '#0d1326',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#f2f5ff', fontSize: '1.05rem' }}>
                {activeThread.participant.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8c9cb2' }}>
                {activeThread.participant.role} • {activeThread.project}
              </div>
            </div>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: activeThread.status === 'active' ? '#1e293b' : '#2d2d2d',
              color: activeThread.status === 'active' ? '#4ade80' : '#8c9cb2',
              textTransform: 'uppercase'
            }}>
              {activeThread.status}
            </span>
          </div>

          {/* Messages Flow */}
          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: '#11172a'
          }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'me' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  alignSelf: m.sender === 'me' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  borderTopRightRadius: m.sender === 'me' ? '2px' : '12px',
                  borderTopLeftRadius: m.sender === 'me' ? '12px' : '2px',
                  background: m.sender === 'me' ? '#2563eb' : '#1e293b',
                  color: '#f2f5ff',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#8c9cb2', marginTop: '0.25rem', padding: '0 0.2rem' }}>
                  {m.timestamp}
                </span>
              </div>
            ))}
          </div>

          {/* Interactive Chat Control */}
          <form
            onSubmit={handleSendReply}
            style={{
              padding: '1rem',
              borderTop: '1px solid #2a3765',
              background: '#0d1326',
              display: 'flex',
              gap: '0.8rem'
            }}
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Send a message to ${activeThread.participant.name}...`}
              style={{
                flex: 1,
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                border: '1px solid #2a3765',
                background: '#151c35',
                color: '#f2f5ff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.8rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: '#f2f5ff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              Send
            </button>
          </form>

        </div>

      </div>
    </section>
  );
}
