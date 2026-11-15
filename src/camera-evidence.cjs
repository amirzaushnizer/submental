const {clips}=require('../data/camera/catalog.json');
function matchCamera(row){
 const matched=clips.find(clip=>clip.audioVerified&&(clip.spokenTurns||[]).some(turn=>turn.turnId===row.id&&turn.quote===row.text&&turn.utc===row.utc));
 if(matched){const spokenTurn=matched.spokenTurns.find(turn=>turn.turnId===row.id);return {status:'audio_match',clipId:matched.id,gapSeconds:0,spokenTurn,reason:`This spoken turn is in the clip at +${spokenTurn.startSeconds.toFixed(1)}s. The caption uses the NASA transcript. Picture and radio timing may differ.`};}
 const t=Date.parse(row.utc),candidates=clips.filter(c=>c.startUtc&&c.startUtc.slice(0,10)===row.utc.slice(0,10));
 const distance=c=>Math.max(Date.parse(c.startUtc)-t,t-(Date.parse(c.startUtc)+c.durationSeconds*1000),0)/1000;
 const closest=candidates.sort((a,b)=>distance(a)-distance(b))[0];
 if(!closest)return {status:'unavailable',clipId:'cabin-film',gapSeconds:null,reason:'No checked spoken-turn clip is prepared for this turn. The cabin film below is reference footage only.'};
 return {status:'reference',clipId:closest.id,gapSeconds:distance(closest),reason:'This clip is not checked against this spoken turn. It is reference footage only.'};
}
module.exports={matchCamera};
