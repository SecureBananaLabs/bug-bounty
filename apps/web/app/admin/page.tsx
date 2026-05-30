"use client";

function StatCard({ label, value, change }: { label: string; value: string; change: string }) {
  const isPositive = change.startsWith("+");
  return (
    <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1rem"}}>
      <p style={{margin:0,fontSize:13,color:"#8892b0"}}>{label}</p>
      <p style={{margin:"8px 0 4px",fontSize:24,fontWeight:700,color:"#f2f5ff"}}>{value}</p>
      <p style={{margin:0,fontSize:12,color:isPositive?"#2ed158":"#e5484d"}}>{change}</p>
    </div>
  );
}

function ActionCard({ title, desc, count }: { title: string; desc: string; count: number }) {
  return (
    <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:600,color:"#f2f5ff"}}>{title}</h3>
        <span style={{background:"#2a3765",color:"#5096ff",borderRadius:20,padding:"2px 10px",fontSize:12}}>{count}</span>
      </div>
      <p style={{margin:0,fontSize:13,color:"#8892b0"}}>{desc}</p>
    </div>
  );
}

export default function AdminPanelPage() {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Admin Panel</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>Moderation queues, trust metrics, and platform controls</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,marginBottom:24}}>
        <StatCard label="Total Users" value="1,284" change="+12%" />
        <StatCard label="Active Jobs" value="347" change="+5%" />
        <StatCard label="Revenue (MTD)" value="8,220" change="+8%" />
        <StatCard label="Flagged Content" value="23" change="-15%" />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        <ActionCard title="Pending Reviews" desc="Freelancer profiles awaiting verification" count={12} />
        <ActionCard title="Reported Jobs" desc="Jobs flagged by community for review" count={4} />
        <ActionCard title="Disputes" desc="Active payment disputes needing resolution" count={7} />
        <ActionCard title="Flagged Messages" desc="Messages caught by moderation filter" count={3} />
      </div>
    </>
  );
}