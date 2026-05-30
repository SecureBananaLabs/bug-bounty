"use client";

function FormField({ label, type, placeholder, isTextarea }: any) {
  const Tag = isTextarea ? "textarea" : "input";
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:14,fontWeight:500,color:"#f2f5ff",marginBottom:6}}>{label}</label>
      <Tag
        placeholder={placeholder}
        style={{
          width:"100%",padding:"10px 12px",borderRadius:8,fontSize:14,
          background:"#0b1020",border:"1px solid #2a3765",color:"#f2f5ff",
          minHeight: isTextarea ? 120 : "auto",
          outline:"none",boxSizing:"border-box",fontFamily:"inherit"
        }}
      />
    </div>
  );
}

export default function PostJobPage() {
  return (
    <>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:28,fontWeight:700,margin:0,color:"#f2f5ff"}}>Post a Job</h2>
        <p style={{margin:"4px 0 0",fontSize:15,color:"#8892b0"}}>Create a new project listing for freelancers</p>
      </div>
      <section className="card" style={{padding:"1.25rem"}}>
        <FormField label="Job Title" type="text" placeholder="e.g., Full-Stack Web Developer Needed" />
        <FormField label="Description" isTextarea placeholder="Describe the project, responsibilities, and requirements in detail..." />
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <FormField label="Budget Min ($)" type="number" placeholder="500" />
          <FormField label="Budget Max ($)" type="number" placeholder="5000" />
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            <label style={{display:"block",fontSize:14,fontWeight:500,color:"#f2f5ff",marginBottom:6}}>Category</label>
            <select style={{width:"100%",padding:"10px 12px",borderRadius:8,fontSize:14,background:"#0b1020",border:"1px solid #2a3765",color:"#8892b0",outline:"none"}}>
              <option>Web Development</option>
              <option>Mobile Development</option>
              <option>Design</option>
              <option>Writing</option>
              <option>Marketing</option>
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:14,fontWeight:500,color:"#f2f5ff",marginBottom:6}}>Duration</label>
            <select style={{width:"100%",padding:"10px 12px",borderRadius:8,fontSize:14,background:"#0b1020",border:"1px solid #2a3765",color:"#8892b0",outline:"none"}}>
              <option>Less than 1 week</option>
              <option>1-2 weeks</option>
              <option>2-4 weeks</option>
              <option>1-3 months</option>
              <option>3+ months</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:14,fontWeight:500,color:"#f2f5ff",marginBottom:6}}>Skills (comma separated)</label>
          <input placeholder="e.g., React, Node.js, TypeScript" style={{width:"100%",padding:"10px 12px",borderRadius:8,fontSize:14,background:"#0b1020",border:"1px solid #2a3765",color:"#f2f5ff",outline:"none",boxSizing:"border-box"}} />
        </div>
        <button style={{padding:"12px 32px",borderRadius:8,fontSize:15,fontWeight:600,background:"#2563eb",color:"#fff",border:"none",cursor:"pointer"}}>Post Job →</button>
      </section>
    </>
  );
}