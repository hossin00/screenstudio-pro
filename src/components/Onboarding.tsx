import { useState } from 'react';
const SLIDES = [{"accent": "#06b6d4", "icon": "\ud83d\udcf8", "title": "Capture your screen\nbeautifully", "desc": "Capture full page screenshots or specific regions instantly. No plugins, no installs."}, {"accent": "#0891b2", "icon": "\u270f\ufe0f", "title": "Annotate with\nprecision", "desc": "Draw arrows, add text, blur sensitive info, and highlight key areas with professional tools."}, {"accent": "#155e75", "icon": "\ud83d\udce4", "title": "Export in any\nformat", "desc": "Download as PNG, JPG, or copy to clipboard. Share instantly with anyone."}];
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#080808', position:'relative' }}>
      <div style={{ position:'absolute', top:'-10%', left:'50%', transform:'translateX(-50%)', width:'350px', height:'350px', borderRadius:'50%', background:slide.accent+'0a', filter:'blur(80px)', pointerEvents:'none' }}/>
      <div style={{ padding:'20px 24px', display:'flex', justifyContent:'flex-end' }}>
        <button onClick={onDone} style={{ color:'#06b6d460', fontSize:'14px', background:'none', border:'none', cursor:'pointer', fontFamily:'Inter' }}>Skip</button>
      </div>
      <div key={idx} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px 32px', textAlign:'center', animation:'slideIn 0.35s ease' }}>
        <div style={{ width:'100px', height:'100px', borderRadius:'28px', background:slide.accent+'15', border:`1px solid ${slide.accent}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'32px', fontSize:'48px' }}>{slide.icon}</div>
        <h2 style={{ fontFamily:'Inter', fontWeight:'700', fontSize:'28px', lineHeight:'1.2', color:'white', marginBottom:'16px', whiteSpace:'pre-line' }}>{slide.title}</h2>
        <p style={{ color:'#06b6d480', fontSize:'15px', lineHeight:'1.7', maxWidth:'280px' }}>{slide.desc}</p>
      </div>
      <div style={{ padding:'16px 24px 44px' }}>
        <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'20px' }}>
          {SLIDES.map((_,i)=><button key={i} onClick={()=>setIdx(i)} style={{ width:i===idx?'24px':'6px', height:'6px', borderRadius:'3px', background:i===idx?slide.accent:'#ffffff15', border:'none', cursor:'pointer', padding:0, transition:'all 0.3s' }}/>)}
        </div>
        <button onClick={()=>idx===SLIDES.length-1?onDone():setIdx(idx+1)} style={{ width:'100%', padding:'16px', background:slide.accent, color:'white', border:'none', borderRadius:'14px', fontSize:'16px', fontWeight:'600', cursor:'pointer', fontFamily:'Inter', boxShadow:`0 8px 24px ${slide.accent}40` }}>
          {idx===SLIDES.length-1?'Get started →':'Continue'}
        </button>
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}
