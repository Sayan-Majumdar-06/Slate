import { Editor } from '@monaco-editor/react'
import { Group, Panel, Separator } from "react-resizable-panels";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { socket } from '../socket/socket';
import { useLocation } from 'react-router';
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import AddProblemModal from '../Components/AddProblemModal';
import "@excalidraw/excalidraw/index.css";
import EndRoomDialog from '../Components/EndRoomDialog';
import { useNavigate } from 'react-router';
import { CirclePlus, MonitorX, Pause, Play, Save, Settings, Square } from 'lucide-react';
import TimerComponent from '../Components/Timer';

const Room = () => {

    const navigate = useNavigate();
    const params = useParams();
    const { roomId } = params;
    const location = useLocation();
    const username = location.state?.username || "Anonymous";
    
    const [users, setUsers] = useState<string[]>([]);
    const [code, setCode] = useState("// code here");
    const delayRef = useRef<number | null>(null);
    const whiteboardDelayRef = useRef<number | null>(null);

    const [isAddProblemOpen, setIsAddProblemOpen] = useState(false);
    const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
    const [problem, setProblem] = useState("Problem statement goes here");
    const [notes, setNotes] = useState("Notes");

    const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

    const isInterviewer = location.state.isInterviewer;

    const onCodeChange = (value: string) => {
        const newCode = value ?? "";

        setCode(newCode);

        if(delayRef.current) {
            clearTimeout(delayRef.current);
        }

        delayRef.current = window.setTimeout(() => socket.emit('code-changed', {
            roomId: roomId,
            code: newCode
        }), 50);       
    }

    const onProblemUpdated = (value: string) => {
        const newProblem = value ?? "";

        setProblem(newProblem);

        socket.emit('problem-updated', {
            roomId: roomId,
            problem: newProblem
        });       
    }

    const onNotesUpdated = (value: string) => {
        const newNotes = value ?? "";

        setNotes(newNotes);

        socket.emit('notes-updated', {
            roomId: roomId,
            notes: newNotes
        });       
    }

    useEffect(() => {
      socket.on('code-changed', (code) => {
        setCode(code);
      })
    
      return () => {
        socket.off('code-changed');
      }
    }, [])

    useEffect(() => {
      socket.on('problem-updated', (p) => {
        setProblem(p);
      })
    
      return () => {
        socket.off('problem-updated');
      }
    }, [])

    useEffect(() => {
        if(!excalidrawAPI) return;

      socket.on('whiteboard-updated', (scene) => {
        if(!scene.elements) {
            excalidrawAPI.updateScene(scene);
            return;
        }

        const localElements = excalidrawAPI.getSceneElements();
        const incomingElements = (scene.elements || []) as any[];

        const incomingMap = new Map<string, any>(incomingElements.map((el:any) => [el.id, el]));

        const mergedElements = localElements.map((localEl: any) => {

            const incomingEl = incomingMap.get(localEl.id);

            if (incomingEl) {
                return incomingEl.version > localEl.version ? incomingEl : localEl;
            }
            return localEl;
        });

        const localIds = new Set(localElements.map((el:any) => el.id));
        incomingElements.forEach(incomingEl => {
            if (!localIds.has(incomingEl.id)) {
                mergedElements.push(incomingEl);
            }
        });

        excalidrawAPI.updateScene({
            ...scene,
            elements: mergedElements
        });

      })
    
      return () => {
        socket.off('whiteboard-updated');
      }
    }, [excalidrawAPI])

    useEffect(() => {
      socket.on('notes-updated', (notes) => {
        setNotes(notes);
      })
    
      return () => {
        socket.off('notes-updated');
      }
    }, [])

    useEffect(() => {
      socket.on('end-room', (roomId) => {
        alert("Room has ended !");

        navigate('/');
        socket.disconnect();
      })
    
      return () => {
        socket.off('end-room');
      }
    }, [])
    
    useEffect(() => {
        socket.auth = { roomId, username };
        socket.connect();

        socket.on("connect", () => {
            // console.log("Connected: ", socket.roomId);
            socket.emit("join-room", roomId);
        });

        socket.on("room-state", (room) => {
            setCode(room.code);
            setProblem(room.problem);
            setNotes(room.notes);
        })

        socket.on("user_list_updated", (userList: string[]) => {
            console.log("Received users:", userList);
            setUsers(userList);
        });

        return () => {
            socket.off("connect");
            socket.off("user_list_updated");
            socket.disconnect();
        };
    }, [roomId, username]);

    const [language, setLanguage] = useState("cpp");

    const handleStart = (durationInSeconds: number) => {
        socket.emit("start-timer", { roomId, duration: durationInSeconds });
    };

    const handlePause = () => {
        socket.emit("pause-timer", { roomId });
    };

    const handleReset = () => {
        socket.emit("stop-timer", { roomId });
    };

    const handleAddTime = (additionalSeconds: number) => {
        socket.emit("add-time-timer", { roomId, extraTime: additionalSeconds });
    };

    
  return (
    <div className="w-screen h-screen flex flex-col bg-zinc-900 geomini">
        
        <AddProblemModal roomId={roomId} open={isAddProblemOpen} onClose={()=>setIsAddProblemOpen(false)} onSave={(p) => setProblem(p)}/>

        <EndRoomDialog roomId={roomId} open={isEndDialogOpen} onClose={()=>setIsEndDialogOpen(false)}/>

        <header className='py-2 px-8 flex justify-between'>
            <div className='flex gap-4'>
                {
                    users.map((name: string, index: number) => (
                        <div key={index} className={`flex py-0.5 px-2 items-center gap-2 border-2 rounded-xl bg-zinc-700 ${name === username ? "border-emerald-400": "border-zinc-500"}`}>
                            <div className="box-border aspect-square w-[1.7rem] h-[1.7rem] p-1 flex justify-center items-center rounded-full bg-emerald-500 text-emerald-50">{name[0]}</div>
                            <div className='text-xs text-emerald-50'>{name}</div>
                        </div>
                    ))
                }
            </div>

            <div className=' px-2 py-1 text-sm text-zinc-50 rounded-xl flex gap-2 items-center justify-center'>
                <TimerComponent socket={socket} roomId={roomId}/>

                {isInterviewer && <div className='flex items-center gap-1'>
                    <button className='p-1 rounded-lg bg-zinc-700/60 hover:bg-zinc-800 transition-colors duration-150' onClick={()=>handleStart(1800)}><Play size="1.2rem" color='gray'/></button>
                    <button className='p-1 rounded-lg bg-zinc-700/60 hover:bg-zinc-800 transition-colors duration-150' onClick={handlePause}><Pause size="1.2rem" color='gray'/></button>
                    <button className='p-1 rounded-lg bg-zinc-700/60 hover:bg-zinc-800 transition-colors duration-150' onClick={handleReset}><Square size="1.2rem" color='gray'/></button>
                    <button className='p-1 px-1.5 rounded-lg bg-zinc-700/60 text-gray-400 hover:bg-zinc-800 transition-colors duration-150' onClick={()=>handleAddTime(300)}>+5</button>
                </div>}
            </div>

            {isInterviewer && <ul className='flex gap-2 items-center'>
                <li><button className='hover:bg-zinc-800 rounded-md p-1 transition-colors duration-150 cursor-pointer' onClick={()=>setIsAddProblemOpen(true)}><CirclePlus size="1.5rem" color='gray'/></button></li>
                <li><button className='hover:bg-zinc-800 rounded-md p-1 transition-colors duration-150 cursor-pointer'><Save color='gray' size="1.5rem"/></button></li>
                <li><button className='hover:bg-zinc-800 rounded-md p-1 transition-colors duration-150 cursor-pointer' onClick={()=>setIsEndDialogOpen(true)}><MonitorX size="1.5rem" color="gray"/></button></li>
                <li><button className='hover:bg-zinc-800 rounded-md p-1 transition-colors duration-150 cursor-pointer'><Settings size="1.5rem" color="gray"/></button></li>
            </ul>}
        </header>

        <Group orientation='horizontal' className='flex-1 px-8 pb-4 pt-2 gap-0.5'> 
            {/* Left */}
            <Panel maxSize='40%' minSize='20%'>
                <Group className='h-full flex flex-col gap-px' orientation='vertical'>
                    <Panel className='w-full h-full p-4 relative border rounded-lg border-zinc-700 bg-zinc-800/40'>
                        <textarea className='inset-4 absolute resize-none outline-none whitespace-pre-wrap text-zinc-300 figtree scrollbar-none' placeholder='// Problem statement will be visible here...' value={problem} onChange={(e) => onProblemUpdated(e.target.value)} disabled>
                        </textarea>
                    </Panel>

                    {isInterviewer &&  
                        <>
                        <Separator className="h-0.5 rounded-full transition-colors duration-150 bg-transparent hover:bg-blue-500 mt-0.5" />

                        <Panel maxSize='70%' minSize='10%' defaultSize="10%" className='p-4 w-full h-full relative border rounded-lg border-zinc-700 bg-zinc-800/40'>
                            <textarea className='scrollbar-none inset-4 absolute resize-none outline-none text-sm font-mono text-zinc-300' placeholder='// Add notes here...' value={notes} onChange={(e) => onNotesUpdated(e.target.value)}></textarea>
                        </Panel>
                    </>}
                </Group>
            </Panel>

            <Separator className="w-0.5 bg-transparent hover:bg-blue-500" />

            {/* Right */}
            <Panel className='flex-1'>
                <Group className='flex-1 h-full flex gap-0.5 flex-col' orientation='vertical'>
                    <Panel className='w-full h-full flex flex-col rounded-xl border border-zinc-700 overflow-hidden scrollbar-none'>
                        <div className='shrink-0 py-2 text-white px-4 flex justify-between items-center border-b border-b-zinc-600'>
                            <select className='bg-zinc-800 hover:bg-zinc-700/50 rounded-md text-sm figtree p-1 px-2 text-zinc-200 appearance-none' value={language} onChange={(e)=>setLanguage(e.target.value)}>
                                <option value="" disabled>Choose language: </option>
                                <option value="cpp">C++</option>
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                            </select>

                            <button className='flex gap-1 text-emerald-50 text-[13px] font-medium bg-zinc-800 items-center p-1 px-1.5 rounded-md'><Play color='#00bc7d' size="1.2rem"/><span>Run</span></button>
                        </div>
                        <div className='flex-1 min-h-0 pt-4'>
                            <Editor height='100%' width='100%' defaultLanguage={language} theme='vs-dark' value={code} onChange={(value) => onCodeChange(value)}/>
                        </div>
                        </Panel>

                    <Separator className="h-0.5 rounded-full bg-transparent hover:bg-blue-500" />

                    <Panel maxSize='70%' minSize='10%' defaultSize="20%" className='h-full w-full p-0.5 rounded-xl border border-zinc-700 bg-[#1e1e21]'>
                        <Excalidraw theme='dark' onChange={(elements) => {
                            if(whiteboardDelayRef.current) {
                                clearTimeout(whiteboardDelayRef.current);
                            }

                            whiteboardDelayRef.current = window.setTimeout(()=>socket.emit("whiteboard-updated", {
                                roomId: roomId,
                                elements
                            }),50);
                            
                        }} excalidrawAPI={(api) => setExcalidrawAPI(api)}/>                        
                    </Panel>
                </Group>
            </Panel>
        </Group>
    </div>
  )
}

export default Room