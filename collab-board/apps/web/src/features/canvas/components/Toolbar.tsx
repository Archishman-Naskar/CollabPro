"use client";
import{useState}from"react";
import{Pencil,Minus,Square,Circle,Eraser,Undo2,Trash2,Download,ChevronRight,ChevronDown,ChevronLeft}from"lucide-react";
import type{Tool}from"../hooks/useYjsCanvas";
const PRESET_COLORS=["#000000","#374151","#EF4444","#F97316","#EAB308","#22C55E","#3B82F6","#8B5CF6","#EC4899","#06B6D4","#ffffff"];
interface ToolbarProps{tool:Tool,color:string,brushSize:number,canWrite:boolean,isAdmin:boolean,onToolChange:(t:Tool)=>void,onColorChange:(c:string)=>void,onBrushSizeChange:(s:number)=>void,onUndo:()=>void,onClear:()=>void,onExport:()=>void,onExpand:(dir:"horizontal"|"vertical")=>void}
function ToolBtn({active,onClick,title,children}:{active?:boolean,onClick:()=>void,title:string,children:React.ReactNode}){
  return <button onClick={onClick} title={title} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${active?"bg-blue-600 text-white shadow-inner shadow-blue-900":"text-gray-400 hover:text-white hover:bg-gray-700"}`}>{children}</button>;
}
function Divider(){return <div className="w-full h-px bg-gray-700 my-1"/>;}
export default function Toolbar({tool,color,brushSize,canWrite,isAdmin,onToolChange,onColorChange,onBrushSizeChange,onUndo,onClear,onExport,onExpand}:ToolbarProps){
  const[isOpen,setIsOpen]=useState(true);
  return(
    <>
      <button onClick={()=>setIsOpen(!isOpen)} className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-gray-900 border border-gray-700 p-1.5 rounded-r-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all shadow-lg" title="Toggle Toolbar">
        {isOpen?<ChevronLeft className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}
      </button>
      {isOpen&&(
        <div className="absolute left-10 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 p-1 bg-gray-900/95 border border-gray-700 rounded-xl shadow-xl backdrop-blur-sm select-none max-h-[33vh] overflow-y-auto">
          {!canWrite?(
            <><span className="text-[10px] text-gray-500 px-1 py-0.5">View Only</span><Divider/><ToolBtn onClick={onExport} title="Export PNG"><Download className="w-4 h-4"/></ToolBtn></>
          ):(
            <>
              <ToolBtn active={tool==="pencil"} onClick={()=>onToolChange("pencil")} title="Pencil"><Pencil className="w-4 h-4"/></ToolBtn>
              <ToolBtn active={tool==="line"} onClick={()=>onToolChange("line")} title="Straight Line"><Minus className="w-4 h-4"/></ToolBtn>
              <ToolBtn active={tool==="rect"} onClick={()=>onToolChange("rect")} title="Rectangle"><Square className="w-4 h-4"/></ToolBtn>
              <ToolBtn active={tool==="circle"} onClick={()=>onToolChange("circle")} title="Ellipse"><Circle className="w-4 h-4"/></ToolBtn>
              <ToolBtn active={tool==="eraser"} onClick={()=>onToolChange("eraser")} title="Eraser"><Eraser className="w-4 h-4"/></ToolBtn>
              <Divider/>
              <label className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all" title="Pick colour" style={{backgroundColor:color==="#ffffff"?"#e5e7eb":color}}>
                <input type="color" value={color} onChange={e=>onColorChange(e.target.value)} className="sr-only"/>
              </label>
              <div className="grid grid-cols-2 gap-1 w-full px-0.5">
                {PRESET_COLORS.map(c=><button key={c} title={c} onClick={()=>onColorChange(c)} className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 mx-auto ${color===c?"border-blue-400 scale-110":"border-gray-600"}`} style={{backgroundColor:c,outline:c==="#ffffff"?"1px solid #6b7280":"none"}}/>)}
              </div>
              <Divider/>
              <div className="flex flex-col items-center gap-1 w-full px-1" title={`Brush size: ${brushSize}px`}>
                <span className="text-gray-500 text-[10px]">{brushSize}</span>
                <input type="range" min={1} max={40} value={brushSize} onChange={e=>onBrushSizeChange(Number(e.target.value))} className="w-full h-1.5 accent-blue-500 cursor-pointer" style={{writingMode:"vertical-lr",direction:"rtl",height:60,width:10}}/>
              </div>
              <Divider/>
              <ToolBtn onClick={onUndo} title="Undo (my last stroke)"><Undo2 className="w-4 h-4"/></ToolBtn>
              {isAdmin&&<ToolBtn onClick={onClear} title="Clear canvas (admin)"><Trash2 className="w-4 h-4 text-red-400"/></ToolBtn>}
              <ToolBtn onClick={onExport} title="Export as PNG"><Download className="w-4 h-4"/></ToolBtn>
              <Divider/>
              <div className="flex gap-1 w-full justify-center">
                <ToolBtn onClick={()=>onExpand("horizontal")} title="Expand canvas right"><ChevronRight className="w-4 h-4"/></ToolBtn>
                <ToolBtn onClick={()=>onExpand("vertical")} title="Expand canvas down"><ChevronDown className="w-4 h-4"/></ToolBtn>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}