import "dotenv/config";

import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import {fileURLToPath} from "node:url";

console.log("TMDB token loaded:", Boolean(process.env.TMDB_TOKEN));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const TMDB = "https://api.themoviedb.org/3";
const SOUTH_DB = JSON.parse(await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "south-hindi-dubbed.json"), "utf8"));
let southCache = {at:0, results:[]};

app.use(express.json());
app.use(express.static(__dirname));

async function tmdb(endpoint, params={}){
  if(!process.env.TMDB_TOKEN) return {error:"TMDB_TOKEN_MISSING"};
  const qs = new URLSearchParams(params);
  const r = await fetch(`${TMDB}${endpoint}?${qs}`, {
    headers:{Authorization:`Bearer ${process.env.TMDB_TOKEN}`,accept:"application/json"}
  });
  if(!r.ok) return {error:`TMDB_${r.status}`,status:r.status};
  return r.json();
}

app.get("/api/home", async (_,res)=>{
  const [trending,movies,series,top] = await Promise.all([
    tmdb("/trending/all/week",{language:"en-US"}),
    tmdb("/movie/popular",{language:"en-US",page:"1",region:"US"}),
    tmdb("/tv/popular",{language:"en-US",page:"1"}),
    tmdb("/movie/top_rated",{language:"en-US",page:"1",region:"US"})
  ]);
  res.json({trending,movies,series,top});
});

app.get("/api/search", async (req,res)=>{
  const q=String(req.query.q||"").trim();
  if(!q) return res.json({results:[]});
  const data=await tmdb("/search/multi",{query:q,include_adult:"false",language:"en-US",page:"1"});
  res.json(data);
});

app.get("/api/movie/:id", async (req,res)=>{
  const data=await tmdb(`/movie/${req.params.id}`,{language:"en-US",append_to_response:"credits,videos,recommendations"});
  res.json(data);
});

app.get("/api/tv/:id", async (req,res)=>{
  const data=await tmdb(`/tv/${req.params.id}`,{language:"en-US",append_to_response:"credits,videos,recommendations"});
  res.json(data);
});

app.get("/api/tv/:id/season/:season", async (req,res)=>{
  const data=await tmdb(`/tv/${req.params.id}/season/${req.params.season}`,{language:"en-US"});
  res.json(data);
});

app.get("/api/south-hindi-dubbed", async (_,res)=>{
  try{
    if(Date.now()-southCache.at < 30*60*1000 && southCache.results.length) return res.json({results:southCache.results});
    const languageNames={te:"Telugu",ta:"Tamil",kn:"Kannada",ml:"Malayalam"};
    // Use fixed TMDB IDs instead of title searches. This prevents wrong-title matches
    // (for example a different movie named "Leo") and makes the local curated list reliable.
    const results=await Promise.all(SOUTH_DB.map(async item=>{
      const data=await tmdb(`/movie/${item.tmdb_id}`,{language:"en-US"});
      if(data?.error || !data?.id) return null;
      if(data.original_language!==item.language) return null;
      return {...data,media_type:"movie",south_language:item.language,south_language_name:languageNames[item.language],hindi_dubbed:true,verification:item.verification};
    }));
    southCache={at:Date.now(),results:results.filter(Boolean)};
    res.json({results:southCache.results});
  }catch(e){
    console.error("South Hindi DB:",e);
    res.status(500).json({error:"SOUTH_DATABASE_ERROR"});
  }
});

app.get("/api/discover/:type", async (req,res)=>{
  const type=req.params.type==="tv"?"tv":"movie";
  const allowed=["page","sort_by","with_genres","primary_release_year","first_air_date_year","vote_average.gte"];
  const params={language:"en-US",page:"1"};
  for(const k of allowed) if(req.query[k]) params[k]=req.query[k];
  res.json(await tmdb(`/discover/${type}`,params));
});

app.use((req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log(`LUMA running on http://localhost:${PORT}`));
