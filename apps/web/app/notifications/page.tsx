"use client";

function Notification({ icon, title, desc, time, type }: any) {
  const colors: any = {success:"#2ed158",warning:"#f5a623",info:"#5096ff",error:"#e5484d"};
  const bgColors: any = {success:"#0f2e1a",warning:"#2e240f",info:"#0f1a2e",error:"#2e0f0f"};
  const c = colors[type]||"#8892b0";
  const bg = bgColors[type]||"#151c35";
  return (
    <div style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid #1e284a",alignItems:"flex-start"}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:c,marginTop:6,flexShrink:0}} />
      <div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#f2f5ff"}}>{title}</span>
          <span style={{fontSize:12,color:"#8892b0"}}>{time}</span>
        </div>
        <p style={{margin:"2px 0 0",fontSize:13,color:"#8892b0"}}>{desc}</p>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Notifications</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>Proposal updates, messages, and billing alerts</p>
      </div>
      <section className="card" style={{padding:"1.25rem"}}>
        <Notification icon="💬" title="New Proposal" desc="Sarah Johnson submitted a proposal on your job 'Full-Stack Web App'" time="5m ago" type="info" />
        <Notification icon="✓" title="Payment Received" desc="Payment of ,400 has been deposited to your account" time="1h ago" type="success" />
        <Notification icon="⚠" title="Proposal Expiring" desc="Your proposal on 'Mobile App Design' expires in 24 hours" time="3h ago" type="warning" />
        <Notification icon="✕" title="Job Closed" desc="The job 'Data Entry Project' has been closed by the client" time="1d ago" type="error" />
        <Notification icon="⭐" title="Review Received" desc="You received a 5-star review from TechCorp" time="2d ago" type="success" />
      </section>
    </>
  );
}