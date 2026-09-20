const cors={
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
 'Access-Control-Allow-Methods':'GET, POST, OPTIONS'
};
const MAX_CHARS=180;

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});

function allowedText(value:unknown){
 const text=String(value??'').trim();
 if(!text||text.length>MAX_CHARS)return '';
 if(!/[A-Za-zÀ-ÿ]/.test(text))return '';
 return text;
}

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 const key=(Deno.env.get('OPENAI_API_KEY')||'').trim();
 const url=new URL(req.url);
 if(req.method==='GET'&&(url.pathname.endsWith('/status')||url.searchParams.get('status')==='1'))return json({openai:Boolean(key)});
 if(!key)return json({error:'OPENAI_API_KEY is not set.'},503);

 let raw='';
 if(req.method==='GET')raw=url.searchParams.get('text')||'';
 else if(req.method==='POST'){
  try{raw=String((await req.json())?.text||'');}catch{return json({error:'Invalid JSON body.'},400);}
 }else return json({error:'Method not allowed.'},405);

 const text=allowedText(raw);
 if(!text)return json({error:'This server can only speak a short Dutch phrase.'},400);

 const openai=await fetch('https://api.openai.com/v1/audio/speech',{
  method:'POST',
  headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
  body:JSON.stringify({model:'tts-1',voice:'nova',input:text,response_format:'mp3'})
 });
 if(openai.status===401)return json({error:'OpenAI rejected the API key.'},401);
 if(!openai.ok)return json({error:'OpenAI could not generate Dutch audio.'},openai.status>=400?openai.status:502);
 return new Response(await openai.arrayBuffer(),{headers:{...cors,'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
});
