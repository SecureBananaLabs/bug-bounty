export function stripServerFields(fields){
  return(req,res,next)=>{
    for(const f of fields) delete req.body[f];
    return next();
  };
}
