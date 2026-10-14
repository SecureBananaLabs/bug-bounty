export const stripMessageId=(req,_res,next)=>{delete req.body?.id;delete req.body?.sentAt;delete req.body?.createdAt;return next();};
