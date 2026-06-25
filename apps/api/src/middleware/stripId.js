export const stripId=(req,_res,next)=>{delete req.body?.id;delete req.body?.createdAt;delete req.body?.updatedAt;return next();};
