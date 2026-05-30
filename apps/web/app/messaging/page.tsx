"use client";

function Conversation({ name, preview, time, unread }: any) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #1e284a",cursor:"pointer"}}>
      <div style={{width:40,height:40,borderRadius:"50%",background:"#2a3765",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#f2f5ff",fontWeight:600}}>{name[0]}</div>
      <div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:600,color:"#f2f5ff"}}>{name}</span>
          <span style={{fontSize:12,color:"#8892b0"}}>{time}</span>
        </div>
        <p style={{margin:"2px 0 0",fontSize:13,color:"#8892b0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{preview}</p>
      </div>
      {unread > 0 && <span style={{background:"#5096ff",color:"#fff",borderRadius:20,fontSize:11,padding:"2px 8px",minWidth:20,textAlign:"center"}}>{unread}</span>}
    </div>
  );
}

export default function MessagingPage() {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Messaging</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>Threaded conversations with freelancers and clients</p>
      </div>
      <section className="card" style={{padding:"1.25rem"}}>
        <Conversation name="Sarah Johnson" preview="Hey! I reviewed your proposal and I'd love to move forward..." time="2m ago" unread={2} />
        <Conversation name="Mike Chen" preview="The project is on track. Here's the latest build..." time="1h ago" unread={0} />
        <Conversation name="Alex Rivera" preview="Can we schedule a call to discuss the scope?" time="3h ago" unread={1} />
        <Conversation name="Emily Watson" preview="Payment received! Thanks for the great work." time="1d ago" unread={0} />
        <Conversation name="David Kim" preview="I've uploaded the files to the shared drive." time="2d ago" unread={0} />
      </section>
    </>
  );
}