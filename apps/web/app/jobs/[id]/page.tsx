"use client";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Job Detail</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>Job #{params.id}</p>
      </div>
      <section className="card" style={{padding:"1.25rem",marginBottom:16}}>
        <h3 style={{margin:"0 0 8px",fontSize:20,fontWeight:700,color:"#f2f5ff"}}>Full-Stack Web Application</h3>
        <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap",fontSize:13}}>
          <span style={{color:"#8892b0"}}>💰 Budget: <strong style={{color:"#f2f5ff"}}>,000 - ,000</strong></span>
          <span style={{color:"#8892b0"}}>📅 Posted: <strong style={{color:"#f2f5ff"}}>May 28, 2026</strong></span>
          <span style={{color:"#8892b0"}}>📍 Location: <strong style={{color:"#f2f5ff"}}>Remote</strong></span>
          <span style={{color:"#2ed158",border:"1px solid #2ed15833",background:"#0f2e1a",borderRadius:20,padding:"2px 8px"}}>Open</span>
        </div>
        <p style={{fontSize:14,color:"#8892b0",lineHeight:1.6,marginBottom:16}}>We are looking for an experienced full-stack developer to build a modern web application using React, Node.js, and PostgreSQL. The project includes user authentication, a RESTful API, and a responsive frontend.</p>
        <h4 style={{margin:"0 0 8px",fontSize:14,fontWeight:600,color:"#f2f5ff"}}>Skills Required</h4>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
          <span style={{background:"#0f1a2e",color:"#5096ff",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #5096ff33"}}>React</span>
          <span style={{background:"#0f1a2e",color:"#5096ff",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #5096ff33"}}>Node.js</span>
          <span style={{background:"#0f1a2e",color:"#5096ff",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #5096ff33"}}>PostgreSQL</span>
          <span style={{background:"#0f1a2e",color:"#5096ff",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #5096ff33"}}>TypeScript</span>
          <span style={{background:"#0f1a2e",color:"#5096ff",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #5096ff33"}}>REST API</span>
        </div>
        <a href="#" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 24px",borderRadius:8,fontSize:14,fontWeight:600,background:"#2563eb",color:"#fff",border:"none",textDecoration:"none"}}>Submit Proposal →</a>
      </section>
      <section className="card" style={{padding:"1.25rem"}}>
        <h3 style={{margin:"0 0 12px",fontSize:16,fontWeight:600,color:"#f2f5ff"}}>Proposals (8)</h3>
        <div style={{padding:"12px 0",borderBottom:"1px solid #1e284a"}}>
          <p style={{margin:0,fontSize:14,color:"#f2f5ff"}}><strong>Sarah Johnson</strong> <span style={{color:"#8892b0"}}>· ,200 · 7 days</span></p>
          <p style={{margin:"4px 0 0",fontSize:13,color:"#8892b0"}}>I have extensive experience with the exact stack you requested...</p>
        </div>
        <div style={{padding:"12px 0",borderBottom:"1px solid #1e284a"}}>
          <p style={{margin:0,fontSize:14,color:"#f2f5ff"}}><strong>Mike Chen</strong> <span style={{color:"#8892b0"}}>· ,800 · 10 days</span></p>
          <p style={{margin:"4px 0 0",fontSize:13,color:"#8892b0"}}>I can start immediately and deliver within your timeline...</p>
        </div>
        <a href="#" style={{display:"inline-block",marginTop:12,fontSize:14,color:"#5096ff",textDecoration:"none"}}>View all proposals →</a>
      </section>
    </>
  );
}