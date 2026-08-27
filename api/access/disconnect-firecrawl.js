import{clearGuest}from'../../lib/access.js';
export default function handler(req,res){if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});clearGuest(res);res.status(200).json({ok:true})}
