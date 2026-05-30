"use client";

function BillingRow({ label, value, status }: { label: string; value: string; status?: string }) {
  const statusColor = status === "Paid" ? "#2ed158" : status === "Pending" ? "#f5a623" : "#8892b0";
  return (
    <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #1e284a",fontSize:14}}>
      <span style={{color:"#8892b0"}}>{label}</span>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <span style={{color:"#f2f5ff",fontWeight:500}}>{value}</span>
        {status && <span style={{color:statusColor,fontSize:12}}>{status}</span>}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Billing</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>Invoices, payout methods, and transaction history</p>
      </div>
      <section className="card" style={{padding:"1.25rem",marginBottom:16}}>
        <h3 style={{margin:"0 0 12px",fontSize:16,fontWeight:600,color:"#f2f5ff"}}>Payment Method</h3>
        <p style={{color:"#8892b0",fontSize:14}}>No payment method on file</p>
        <a href="#" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,fontSize:13,background:"#2a3765",color:"#f2f5ff",border:"1px solid #3a4a7a",textDecoration:"none",marginTop:8}}>Add Payment Method →</a>
      </section>
      <section className="card" style={{padding:"1.25rem",marginBottom:16}}>
        <h3 style={{margin:"0 0 12px",fontSize:16,fontWeight:600,color:"#f2f5ff"}}>Recent Transactions</h3>
        <BillingRow label="Freelance payment — Web Dev" value=",400.00" status="Paid" />
        <BillingRow label="Freelance payment — Design" value="50.00" status="Paid" />
        <BillingRow label="Platform fee (June)" value="9.00" status="Pending" />
        <BillingRow label="Freelance payment — Content" value=",200.00" status="Pending" />
      </section>
      <section className="card" style={{padding:"1.25rem"}}>
        <h3 style={{margin:"0 0 12px",fontSize:16,fontWeight:600,color:"#f2f5ff"}}>Payout Summary</h3>
        <BillingRow label="Available balance" value=",250.00" />
        <BillingRow label="Pending clearance" value=",229.00" />
        <BillingRow label="Total earned (all time)" value="8,420.00" />
      </section>
    </>
  );
}