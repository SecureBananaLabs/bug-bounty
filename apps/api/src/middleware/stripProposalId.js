export const stripProposalId=(req,_res,next)=>{delete req.body?.id;delete req.body?.status;delete req.body?.createdAt;return next();};
