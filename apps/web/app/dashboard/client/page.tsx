"use client";

function JobCard({ title, proposals, status, budget }: { title: string; proposals: number; status: string; budget: string }) {
  const statusColor = status === "Open" ? "#2ed158" : status === "In Progress" ? "#5096ff" : "#8892b0";
  return (
    <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <h4 style={{margin:0,fontSize:14,fontWeight:600,color:"#f2f5ff"}}>{title}</h4>
        <span style={{color:statusColor,fontSize:12,border:"1px solid "+statusColor+"33",background:statusColor+"11",borderRadius:20,padding:"2px 8px"}}>{status}</span>
      </div>
      <p style={{margin:0,fontSize:13,color:"#8892b0"}}>{proposals} proposals · Budget: {budget}</p>
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Client Dashboard</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>Track your jobs, shortlisted freelancers, and payments</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginBottom:24}}>
        <JobCard title="Full-Stack Web Application" proposals={8} status="Open" budget=",000-,000" />
        <JobCard title="Mobile App UI Design" proposals={12} status="In Progress" budget=",500-,500" />
        <JobCard title="API Integration" proposals={5} status="Open" budget="00-,200" />
      </div>
      <section className="card" style={{padding:"1.25rem"}}>
        <h3 style={{margin:"0 0 12px",fontSize:16,fontWeight:600,color:"#f2f5ff"}}>Quick Actions</h3>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <a href="#" style={{padding:"8px 16px",borderRadius:8,fontSize:13,background:"#2a3765",color:"#f2f5ff",border:"1px solid #3a4a7a",textDecoration:"none"}}>Post a New Job →</a>
          <a href="#" style={{padding:"8px 16px",borderRadius:8,fontSize:13,background:"#2a3765",color:"#f2f5ff",border:"1px solid #3a4a7a",textDecoration:"none"}}>View Shortlisted →</a>
        </div>
      </section>
    </>
  );
}