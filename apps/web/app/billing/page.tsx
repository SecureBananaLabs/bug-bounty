'use client';

import React, { useState } from 'react';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: 'Credit' | 'Debit';
}

export default function BillingPage() {
  const [balance] = useState('$1,240.00');
  const [paymentMethod] = useState('Visa ending in 4242');
  const [nextBillingDate] = useState('June 15, 2026');

  const [invoices] = useState<Invoice[]>([
    { id: 'INV-2026-001', date: 'May 15, 2026', amount: '$430.00', status: 'Paid' },
    { id: 'INV-2026-002', date: 'May 28, 2026', amount: '$700.00', status: 'Paid' },
    { id: 'INV-2026-003', date: 'June 01, 2026', amount: '$110.00', status: 'Pending' },
  ]);

  const [transactions] = useState<Transaction[]>([
    { id: 'TXN-9012', date: 'May 28, 2026', description: 'Stripe Payout - PR #1868', amount: '+$700.00', type: 'Credit' },
    { id: 'TXN-9011', date: 'May 24, 2026', description: 'API Usage Surcharge', amount: '-$15.00', type: 'Debit' },
    { id: 'TXN-9010', date: 'May 15, 2026', description: 'Bounty Reward - Issue #1823', amount: '+$430.00', type: 'Credit' },
    { id: 'TXN-9009', date: 'May 10, 2026', description: 'Premium Developer Subscription', amount: '-$29.00', type: 'Debit' },
  ]);

  return (
    <section style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem 0' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#f2f5ff', fontWeight: 600 }}>Billing & Wallet</h2>
      
      {/* Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Balance Card */}
        <div style={{ background: '#151c35', border: '1px solid #2a3765', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: '#8c9cb2', letterSpacing: '0.05em' }}>Account Balance</h3>
          <p style={{ margin: '0.5rem 0', fontSize: '2rem', fontWeight: 700, color: '#38bdf8' }}>{balance}</p>
          <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>● Auto-withdraw enabled</span>
        </div>

        {/* Payment Method Card */}
        <div style={{ background: '#151c35', border: '1px solid #2a3765', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: '#8c9cb2', letterSpacing: '0.05em' }}>Payment Method</h3>
          <p style={{ margin: '0.5rem 0', fontSize: '1.2rem', fontWeight: 600, color: '#f2f5ff' }}>{paymentMethod}</p>
          <span style={{ fontSize: '0.8rem', color: '#8c9cb2' }}>Expires: 12/2029</span>
        </div>

        {/* Next Billing Card */}
        <div style={{ background: '#151c35', border: '1px solid #2a3765', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: '#8c9cb2', letterSpacing: '0.05em' }}>Next Billing Date</h3>
          <p style={{ margin: '0.5rem 0', fontSize: '1.2rem', fontWeight: 600, color: '#f2f5ff' }}>{nextBillingDate}</p>
          <span style={{ fontSize: '0.8rem', color: '#f87171' }}>Subtotal: $29.00 (Monthly)</span>
        </div>

      </div>

      {/* Details Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Invoices List */}
        <div style={{ background: '#151c35', border: '1px solid #2a3765', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#f2f5ff', borderBottom: '1px solid #2a3765', paddingBottom: '0.5rem' }}>Invoices</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {invoices.map((inv) => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', borderBottom: '1px dotted #2a3765', paddingBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f2f5ff' }}>{inv.id}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8c9cb2' }}>{inv.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, color: '#f2f5ff' }}>{inv.amount}</span>
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: inv.status === 'Paid' ? '#1e293b' : inv.status === 'Pending' ? '#3b2f1e' : '#3b1e1e',
                    color: inv.status === 'Paid' ? '#4ade80' : inv.status === 'Pending' ? '#fbbf24' : '#f87171'
                  }}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ background: '#151c35', border: '1px solid #2a3765', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#f2f5ff', borderBottom: '1px solid #2a3765', paddingBottom: '0.5rem' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {transactions.map((txn) => (
              <div key={txn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', borderBottom: '1px dotted #2a3765', paddingBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f2f5ff' }}>{txn.description}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8c9cb2' }}>{txn.date}</div>
                </div>
                <div>
                  <span style={{
                    fontWeight: 600,
                    color: txn.type === 'Credit' ? '#4ade80' : '#f87171'
                  }}>
                    {txn.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
