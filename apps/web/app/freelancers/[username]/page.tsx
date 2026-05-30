"use client";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Freelancer Profile</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>@{params.username} · Portfolio, reviews, and proposals</p>
      </div>
      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1.25rem",flex:2,minWidth:280}}>
          <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"#2a3765",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#f2f5ff",fontWeight:600}}>{params.username[0].toUpperCase()}</div>
            <div>
              <h3 style={{margin:0,fontSize:18,fontWeight:600,color:"#f2f5ff"}}>{params.username}</h3>
              <p style={{margin:"4px 0 0",fontSize:13,color:"#5096ff"}}>Full-Stack Developer</p>
            </div>
          </div>
          <p style={{fontSize:14,color:"#8892b0",lineHeight:1.6}}>Experienced full-stack developer with 5+ years building web applications using React, Node.js, and TypeScript. Passionate about clean code and great user experiences.</p>
          <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
            <span style={{background:"#0f1a2e",color:"#5096ff",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #5096ff33"}}>React</span>
            <span style={{background:"#0f1a2e",color:"#5096ff",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #5096ff33"}}>Node.js</span>
            <span style={{background:"#0f1a2e",color:"#5096ff",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #5096ff33"}}>TypeScript</span>
            <span style={{background:"#0f2e1a",color:"#2ed158",borderRadius:20,padding:"4px 12px",fontSize:12,border:"1px solid #2ed15833"}}>Available Now</span>
          </div>
        </div>
        <div style={{background:"#151c35",border:"1px solid #2a3765",borderRadius:12,padding:"1.25rem",flex:1,minWidth:200}}>
          <h4 style={{margin:"0 0 12px",fontSize:14,fontWeight:600,color:"#f2f5ff"}}>Stats</h4>
          <p style={{fontSize:13,color:"#8892b0",margin:"4px 0"}}>⭐ 4.9 (24 reviews)</p>
          <p style={{fontSize:13,color:"#8892b0",margin:"4px 0"}}>✓ 18 completed jobs</p>
          <p style={{fontSize:13,color:"#8892b0",margin:"4px 0"}}>💰 40/hr avg rate</p>
          <p style={{fontSize:13,color:"#8892b0",margin:"4px 0"}}>📅 Member since 2024</p>
        </div>
      </div>
    </>
  );
}