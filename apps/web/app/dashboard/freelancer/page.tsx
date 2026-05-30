"use client";

function ProposalCard({ job, client, bid, status }: any) {
  const colors: any = {Pending:"#f5a623",Accepted:"#2ed158",Rejected:"#e5484d"};
  const c = colors[status]||"#8892b0";
  return (
    <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1rem",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <div>
          <h4 style={{margin:0,fontSize:14,fontWeight:600,color:"#f2f5ff"}}>{job}</h4>
          <p style={{margin:"4px 0 0",fontSize:13,color:"#8892b0"}}>Client: {client} · Bid: {bid}</p>
        </div>
        <span style={{color:c,fontSize:12,border:"1px solid "+c+"33",background:c+"11",borderRadius:20,padding:"2px 8px",height:22}}>{status}</span>
      </div>
    </div>
  );
}

export default function FreelancerDashboardPage() {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Freelancer Dashboard</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>Manage proposals, active jobs, and earnings</p>
      </div>
      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1rem",flex:1,minWidth:140}}>
          <p style={{margin:0,fontSize:24,fontWeight:700,color:"#2ed158"}}>4</p>
          <p style={{margin:0,fontSize:13,color:"#8892b0"}}>Active Jobs</p>
        </div>
        <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1rem",flex:1,minWidth:140}}>
          <p style={{margin:0,fontSize:24,fontWeight:700,color:"#f5a623"}}>7</p>
          <p style={{margin:0,fontSize:13,color:"#8892b0"}}>Pending Proposals</p>
        </div>
        <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1rem",flex:1,minWidth:140}}>
          <p style={{margin:0,fontSize:24,fontWeight:700,color:"#5096ff"}}>2.4k</p>
          <p style={{margin:0,fontSize:13,color:"#8892b0"}}>Total Earnings</p>
        </div>
      </div>
      <h3 style={{fontSize:16,fontWeight:600,color:"#f2f5ff",margin:"0 0 12px"}}>Recent Proposals</h3>
      <ProposalCard job="Full-Stack Developer" client="TechCorp" bid=",500" status="Pending" />
      <ProposalCard job="React Native App" client="StartupXYZ" bid=",800" status="Accepted" />
      <ProposalCard job="API Design" client="DataFlow Inc" bid="50" status="Rejected" />
    </>
  );
}