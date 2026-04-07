"use client";
import{useCallback,useEffect,useRef,useState}from"react";
import{useYjs}from"@/lib/yjs/provider";
import{useYjsCanvas}from"../hooks/useYjsCanvas";
import{useCanvas,renderAllStrokes,renderStroke,CANVAS_BG}from"../hooks/useCanvas";
import Toolbar from"./Toolbar";
import type{Stroke,Tool}from"../hooks/useYjsCanvas";
interface WhiteboardCanvasProps{user:{id:string,name:string|null,image:string|null},membership:{role:string,canWrite:boolean}}
interface RemoteCursor{clientId:number,x:number,y:number,name:string,color:string}
function CursorOverlay({cursors,canvasRef,canvasWidth,canvasHeight}:{cursors:RemoteCursor[],canvasRef:React.RefObject<HTMLCanvasElement|null>,canvasWidth:number,canvasHeight:number}){
  if(cursors.length===0)return null;
  return(
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {cursors.map(c=>{
        if(!canvasRef.current)return null;
        const rect=canvasRef.current.getBoundingClientRect();
        const scaleX=rect.width/canvasWidth;
        const scaleY=rect.height/canvasHeight;
        const left=c.x*scaleX;
        const top=c.y*scaleY;
        return(
          <div key={c.clientId} className="absolute flex flex-col items-start" style={{left,top,transform:"translate(-2px,-2px)"}}>
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-md" style={{backgroundColor:c.color}}/>
            <span className="text-[10px] font-semibold text-white px-1 py-0.5 rounded mt-0.5 whitespace-nowrap shadow" style={{backgroundColor:c.color}}>{c.name}</span>
          </div>
        );
      })}
    </div>
  );
}
export default function WhiteboardCanvas({user,membership}:WhiteboardCanvasProps){
  const{awareness}=useYjs();
  const{strokes,canvasSize,addStroke,undoStroke,clearCanvas,expandCanvas}=useYjsCanvas(user.id);
  const canWrite=membership.role==="ADMIN"||membership.canWrite;
  const isAdmin=membership.role==="ADMIN";
  const[tool,setTool]=useState<Tool>("pencil");
  const[color,setColor]=useState<string>("#000000");
  const[brushSize,setBrushSize]=useState<number>(4);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const overlayRef=useRef<HTMLCanvasElement|null>(null);
  const[previewStroke,setPreviewStroke]=useState<Stroke|null>(null);
  const[remoteCursors,setRemoteCursors]=useState<RemoteCursor[]>([]);
  const{handleMouseDown,handleMouseMove,handleMouseUp,handleMouseLeave}=useCanvas({canvasRef,tool,color,brushSize,canWrite,userId:user.id,onStrokeComplete:addStroke,onPreviewUpdate:setPreviewStroke});
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    if(canvas.width!==canvasSize.width||canvas.height!==canvasSize.height){canvas.width=canvasSize.width;canvas.height=canvasSize.height;}
  },[canvasSize]);
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    renderAllStrokes(canvas,strokes);
  },[strokes,canvasSize]);
  useEffect(()=>{
    const overlay=overlayRef.current;
    if(!overlay)return;
    overlay.width=canvasSize.width;
    overlay.height=canvasSize.height;
    const ctx=overlay.getContext("2d");
    if(!ctx)return;
    ctx.clearRect(0,0,overlay.width,overlay.height);
    if(previewStroke)renderStroke(ctx,previewStroke);
  },[previewStroke,canvasSize]);
  useEffect(()=>{
    if(!awareness)return;
    const update=()=>{
      const states=Array.from(awareness.getStates().entries());
      const cursors:RemoteCursor[]=[];
      for(const[clientId,state]of states){
        if(clientId===awareness.clientID||!state?.cursor||!state?.user)continue;
        cursors.push({clientId:clientId as number,x:state.cursor.x,y:state.cursor.y,name:state.user.name??"?",color:state.user.color??"#8B5CF6"});
      }
      setRemoteCursors(cursors);
    };
    awareness.on("change",update);
    return ()=>awareness.off("change",update);
  },[awareness]);
  const handleExport=useCallback(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const offscreen=document.createElement("canvas");
    offscreen.width=canvas.width;
    offscreen.height=canvas.height;
    const ctx=offscreen.getContext("2d")!;
    ctx.fillStyle=CANVAS_BG;
    ctx.fillRect(0,0,offscreen.width,offscreen.height);
    ctx.drawImage(canvas,0,0);
    const url=offscreen.toDataURL("image/png");
    const link=document.createElement("a");
    link.href=url;
    link.download=`collabboard-${Date.now()}.png`;
    link.click();
  },[]);
  const cursorStyle=canWrite?tool==="eraser"?"cursor-cell":"cursor-crosshair":"cursor-default";
  return(
    <div className="flex-1 relative overflow-hidden bg-gray-800">
      <Toolbar tool={tool} color={color} brushSize={brushSize} canWrite={canWrite} isAdmin={isAdmin} onToolChange={setTool} onColorChange={setColor} onBrushSizeChange={setBrushSize} onUndo={undoStroke} onClear={()=>{if(window.confirm("Clear the entire canvas? This cannot be undone."))clearCanvas();}} onExport={handleExport} onExpand={expandCanvas}/>
      <div className="w-full h-full overflow-auto relative">
        <div className="relative block" style={{width:canvasSize.width,height:canvasSize.height}}>
          <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className={`block ${cursorStyle}`} style={{touchAction:"none"}} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}/>
          <canvas ref={overlayRef} width={canvasSize.width} height={canvasSize.height} className={`absolute inset-0 pointer-events-none ${cursorStyle}`} style={{touchAction:"none"}}/>
          <CursorOverlay cursors={remoteCursors} canvasRef={canvasRef} canvasWidth={canvasSize.width} canvasHeight={canvasSize.height}/>
        </div>
      </div>
      {!canWrite&&<div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-gray-700 text-gray-400 text-xs px-3 py-1.5 rounded-full pointer-events-none">👁 View-only mode</div>}
    </div>
  );
}