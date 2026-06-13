import { useState, useRef, useCallback } from 'react';
import { Monitor, Download, Trash2, Crop, Type, Square, Circle, ArrowRight, Palette, X } from 'lucide-react';

interface Screenshot { id:string; name:string; dataUrl:string; width:number; height:number; createdAt:number; }
interface Annotation { type:'text'|'rect'|'circle'|'arrow'; x:number; y:number; w?:number; h?:number; text?:string; color:string; }
const SAVE='ss_shots_v1';
const load=():Screenshot[]=>{try{return JSON.parse(localStorage.getItem(SAVE)||'[]').map((s:any)=>({...s,dataUrl:s.dataUrl||''}));}catch{return[]}};

export default function App() {
  const [shots,    setShots]    = useState<Screenshot[]>(load);
  const [editing,  setEditing]  = useState<Screenshot|null>(null);
  const [tool,     setTool]     = useState<'select'|'text'|'rect'|'circle'|'arrow'>('select');
  const [color,    setColor]    = useState('#ef4444');
  const [annots,   setAnnots]   = useState<Annotation[]>([]);
  const [dragging, setDragging] = useState(false);
  const [start,    setStart]    = useState({x:0,y:0});
  const [textInput,setTextInput]= useState('');
  const [showText, setShowText] = useState(false);
  const [textPos,  setTextPos]  = useState({x:0,y:0});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement>(null);

  const save = (items:Screenshot[]) => {
    // Save without data URLs to avoid quota issues - just metadata
    const meta = items.map(s=>({...s, dataUrl: s.dataUrl.slice(0,100)+'...'}));
    try { localStorage.setItem(SAVE, JSON.stringify(meta)); } catch(e) {}
    setShots(items);
  };

  const handlePaste = useCallback((e:ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (!blob) continue;
        const reader = new FileReader();
        reader.onload = ev => {
          const dataUrl = ev.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const shot: Screenshot = { id: crypto.randomUUID(), name: 'Screenshot ' + (shots.length+1), dataUrl, width: img.width, height: img.height, createdAt: Date.now() };
            setShots(prev => [shot, ...prev]);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(blob);
        e.preventDefault();
        break;
      }
    }
  }, [shots.length]);

  const handleFile = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const shot: Screenshot = { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/,''), dataUrl, width: img.width, height: img.height, createdAt: Date.now() };
        setShots(prev => [shot, ...prev]);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const drawAnnotations = () => {
    const canvas = canvasRef.current; const img = imgRef.current;
    if (!canvas || !img || !editing) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    annots.forEach(a => {
      ctx.strokeStyle = a.color; ctx.fillStyle = a.color; ctx.lineWidth = 3;
      if (a.type==='rect') { ctx.strokeRect(a.x, a.y, a.w||0, a.h||0); }
      else if (a.type==='circle') { ctx.beginPath(); ctx.ellipse(a.x+(a.w||0)/2, a.y+(a.h||0)/2, Math.abs((a.w||0)/2), Math.abs((a.h||0)/2), 0, 0, 2*Math.PI); ctx.stroke(); }
      else if (a.type==='text' && a.text) { ctx.font = 'bold 24px Inter,sans-serif'; ctx.fillText(a.text, a.x, a.y); }
      else if (a.type==='arrow') { 
        const ex=a.x+(a.w||0), ey=a.y+(a.h||0);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(ex,ey); ctx.stroke();
        const angle=Math.atan2(a.h||0,a.w||0);
        ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex-15*Math.cos(angle-0.5),ey-15*Math.sin(angle-0.5)); ctx.lineTo(ex-15*Math.cos(angle+0.5),ey-15*Math.sin(angle+0.5)); ctx.closePath(); ctx.fill();
      }
    });
  };

  const exportEdited = () => {
    drawAnnotations();
    const canvas = canvasRef.current; if(!canvas||!editing) return;
    const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = editing.name + '-annotated.png'; a.click();
  };

  const TOOLS = [{k:'select',i:<Monitor size={14}/>},{k:'text',i:<Type size={14}/>},{k:'rect',i:<Square size={14}/>},{k:'circle',i:<Circle size={14}/>},{k:'arrow',i:<ArrowRight size={14}/>}];
  const COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#a855f7','#ec4899','#ffffff','#000000'];

  if (editing) return (
    <div style={{minHeight:'100vh',background:'#080808',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'12px 20px',borderBottom:'1px solid #1a2838',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',flexWrap:'wrap'}}>
        <button onClick={()=>{setEditing(null);setAnnots([]);}} style={{color:'#67e8f9',background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontFamily:'Inter'}}>← Back</button>
        <div style={{display:'flex',gap:'4px'}}>
          {TOOLS.map(t=><button key={t.k} onClick={()=>setTool(t.k as any)} title={t.k}
            style={{padding:'7px',borderRadius:'7px',background:tool===t.k?'#06b6d420':'none',border:`1px solid ${tool===t.k?'#06b6d4':'transparent'}`,cursor:'pointer',color:tool===t.k?'#67e8f9':'#0e7490'}}>{t.i}</button>)}
        </div>
        <div style={{display:'flex',gap:'4px'}}>
          {COLORS.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:'20px',height:'20px',borderRadius:'50%',background:c,border:`2px solid ${color===c?'white':c+'80'}`,cursor:'pointer',transform:color===c?'scale(1.2)':'scale(1)'}}/>)}
        </div>
        <div style={{display:'flex',gap:'6px'}}>
          <button onClick={()=>setAnnots([])} style={{padding:'6px 12px',borderRadius:'7px',background:'#ef444415',border:'1px solid #ef444430',color:'#f87171',fontSize:'12px',cursor:'pointer',fontFamily:'Inter'}}>Clear</button>
          <button onClick={exportEdited} style={{display:'flex',alignItems:'center',gap:'5px',padding:'7px 14px',borderRadius:'8px',background:'#06b6d4',border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter'}}>
            <Download size={13}/> Export
          </button>
        </div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'16px',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
        <div style={{position:'relative',display:'inline-block'}}>
          <img ref={imgRef} src={editing.dataUrl} alt={editing.name} style={{maxWidth:'100%',display:'block',borderRadius:'8px',boxShadow:'0 8px 32px #000'}} draggable={false}/>
          <canvas ref={canvasRef} style={{display:'none'}}/>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',cursor:tool==='select'?'default':'crosshair'}}
            onMouseDown={e=>{
              const rect=(e.target as SVGElement).closest('svg')!.getBoundingClientRect();
              const x=((e.clientX-rect.left)/rect.width)*editing.width;
              const y=((e.clientY-rect.top)/rect.height)*editing.height;
              if(tool==='text'){setTextPos({x,y});setShowText(true);return;}
              setStart({x,y}); setDragging(true);
            }}
            onMouseUp={e=>{
              if(!dragging)return; setDragging(false);
              const rect=(e.target as SVGElement).closest('svg')!.getBoundingClientRect();
              const ex=((e.clientX-rect.left)/rect.width)*editing.width;
              const ey=((e.clientY-rect.top)/rect.height)*editing.height;
              if(tool!=='select'&&tool!=='text')
                setAnnots(prev=>[...prev,{type:tool,x:start.x,y:start.y,w:ex-start.x,h:ey-start.y,color}]);
            }}>
            {annots.map((a,i)=>(
              <g key={i}>
                {a.type==='rect'&&<rect x={a.x} y={a.y} width={a.w} height={a.h} fill="none" stroke={a.color} strokeWidth="3"/>}
                {a.type==='circle'&&<ellipse cx={a.x+(a.w||0)/2} cy={a.y+(a.h||0)/2} rx={Math.abs((a.w||0)/2)} ry={Math.abs((a.h||0)/2)} fill="none" stroke={a.color} strokeWidth="3"/>}
                {a.type==='text'&&<text x={a.x} y={a.y} fill={a.color} fontSize="24" fontWeight="bold" fontFamily="Inter">{a.text}</text>}
                {a.type==='arrow'&&<line x1={a.x} y1={a.y} x2={a.x+(a.w||0)} y2={a.y+(a.h||0)} stroke={a.color} strokeWidth="3" markerEnd={`url(#arrow-${i})`}/>}
              </g>
            ))}
          </svg>
        </div>
      </div>
      {showText&&(
        <div style={{position:'fixed',inset:0,background:'#00000060',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowText(false)}>
          <div style={{background:'#0f172a',borderRadius:'12px',padding:'20px',minWidth:'280px',border:'1px solid #1e3a5f'}} onClick={e=>e.stopPropagation()}>
            <input value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Enter text" autoFocus
              style={{width:'100%',background:'#080808',border:'1px solid #1e3a5f',borderRadius:'8px',padding:'10px',color:'white',fontSize:'14px',outline:'none',fontFamily:'Inter',marginBottom:'10px'}}/>
            <button onClick={()=>{if(textInput.trim()){setAnnots(prev=>[...prev,{type:'text',x:textPos.x,y:textPos.y,text:textInput.trim(),color}]);setTextInput('');setShowText(false);}}}
              style={{width:'100%',padding:'10px',borderRadius:'8px',background:'#06b6d4',border:'none',color:'white',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter'}}>Add Text</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#080808',display:'flex',flexDirection:'column'}}>
      <header style={{padding:'16px 20px',borderBottom:'1px solid #0c2a3a',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#06b6d4,#0891b2)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px #06b6d430'}}><Monitor size={16} color="white"/></div>
          <div><div style={{fontWeight:'700',fontSize:'16px',color:'white',lineHeight:1}}>ScreenStudio Pro</div>
          <div style={{fontSize:'11px',color:'#0e7490',marginTop:'2px'}}>{shots.length} screenshot{shots.length!==1?'s':''}</div></div>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:'5px',padding:'8px 14px',borderRadius:'9px',background:'#06b6d4',border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 12px #06b6d430'}}>
          + Import
          <input type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
        </label>
      </header>
      <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
        <div style={{background:'#0c1f2a',border:'1px dashed #06b6d430',borderRadius:'12px',padding:'20px',textAlign:'center',marginBottom:'16px'}}>
          <div style={{fontSize:'28px',marginBottom:'8px'}}>📋</div>
          <div style={{fontSize:'13px',color:'#67e8f9',fontWeight:'500',marginBottom:'4px'}}>Paste screenshot here</div>
          <div style={{fontSize:'11px',color:'#0e7490'}}>Ctrl+V / Cmd+V to paste from clipboard</div>
        </div>
        {shots.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px'}}>
            <p style={{color:'#0e7490',fontSize:'14px',lineHeight:'1.6'}}>Import images or paste screenshots to start annotating and organizing.</p>
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'10px'}}>
            {shots.map(shot=>(
              <div key={shot.id} style={{background:'#0c1f2a',border:'1px solid #0c2a3a',borderRadius:'12px',overflow:'hidden',cursor:'pointer',transition:'all 0.2s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#06b6d430'} onMouseLeave={e=>e.currentTarget.style.borderColor='#0c2a3a'}>
                <div style={{aspectRatio:'16/9',background:'#080808',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}} onClick={()=>{setEditing(shot);setAnnots([]);}}>
                  <img src={shot.dataUrl} alt={shot.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
                <div style={{padding:'10px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'12px',color:'#67e8f9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{shot.name}</span>
                  <div style={{display:'flex',gap:'4px',flexShrink:0}}>
                    <button onClick={()=>{const a=document.createElement('a');a.href=shot.dataUrl;a.download=shot.name+'.png';a.click();}} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:'#0e7490'}}><Download size={12}/></button>
                    <button onClick={()=>setShots(shots.filter(s=>s.id!==shot.id))} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:'#0e7490'}}><Trash2 size={12}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
