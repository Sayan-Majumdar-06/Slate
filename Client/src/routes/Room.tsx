import { Editor } from '@monaco-editor/react'
import { Group, Panel, Separator } from "react-resizable-panels";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { socket } from '../socket/socket';
import { useLocation } from 'react-router';
import { Excalidraw, exportToSvg } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import AddProblemModal from '../Components/AddProblemModal';
import "@excalidraw/excalidraw/index.css";
import EndRoomDialog from '../Components/EndRoomDialog';
import { useNavigate } from 'react-router';
import { CirclePlus, Crown, Loader, MonitorX, Pause, Play, Presentation, Save, Square } from 'lucide-react';
import TimerComponent from '../Components/Timer';
import JSZip from "jszip";
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Room = () => {

    const navigate = useNavigate();
    const params = useParams();
    const { roomId } = params;
    const location = useLocation();

    useEffect(() => {
      if(!location.state?.username?.trim()) navigate("/");
    }, []);
    
    const username = location.state?.username;

    interface User {
        id: string;
        username: string;
    }

    const SERVER_URL = import.meta.env.SERVER_URL;
    
    const [users, setUsers] = useState<User[]>([]);
    const [code, setCode] = useState("// code here");
    const delayRef = useRef<number | null>(null);
    const whiteboardDelayRef = useRef<number | null>(null);

    const [isAddProblemOpen, setIsAddProblemOpen] = useState(false);
    const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
    const [problem, setProblem] = useState("Problem statement goes here");
    const [notes, setNotes] = useState("Notes");
    const [codeInput, setCodeInput] = useState("");
    const [codeOutput, setCodeOutput] = useState("");
    const [codeErrors, setCodeErrors] = useState("");

    const [whiteboardActive, setWhiteboardActive] = useState(false);
    const [runActive, setRunActive] = useState(true);
    const [isSaveActive, setIsSaveActive] = useState(true);

    const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

    const [isInterviewer, setIsInterviewer] = useState(false);

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

    // code changed listener
    useEffect(() => {
      socket.on('code-changed', (code) => {
        setCode(code);
      })
    
      return () => {
        socket.off('code-changed');
      }
    }, [])

    // problem update listener
    useEffect(() => {
      socket.on('problem-updated', (p) => {
        setProblem(p);
      })
    
      return () => {
        socket.off('problem-updated');
      }
    }, [])

    // whiteboard update listener
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

    // notes update listener
    useEffect(() => {
      socket.on('notes-updated', (notes) => {
        setNotes(notes);
      })
    
      return () => {
        socket.off('notes-updated');
      }
    }, [])

    // close room listener
    useEffect(() => {
      socket.on('room-closed', () => {
        socket.disconnect();
        toast.error("Room closed");

        navigate("/");
      })
    
      return () => {
        socket.off('room-closed');
      }
    }, [])
    
    // Initialise room listeners
    useEffect(() => {

        let cancelled = false;

        const initializeRoom = async () => {
            try {
                const response = await axios.get(
                    `${SERVER_URL}/room/${roomId}`
                );

                if (cancelled) return;

                if (!response.data.exists) {
                    navigate("/");
                    return;
                }

                socket.auth = { roomId, username, hostToken: sessionStorage.getItem("hostToken") };

                socket.on("connect", () => {
                    socket.emit("join-room", roomId);
                });

                socket.on("invalid-room", () => {
                    toast.error("Room not found");
                    navigate("/");
                });

                socket.on("room-state", (room) => {
                    setCode(room.code);
                    setProblem(room.problem);
                    setNotes(room.notes);
                    setIsInterviewer(room.interviewerId === socket.id);
                });

                socket.on("user_list_updated", (userList: User[]) => {
                    setUsers(userList);
                });

                socket.connect();
            } catch {
                if (!cancelled) {
                    navigate("/");
                }
            }
        };

        initializeRoom();

        return () => {
            socket.off("connect");
            socket.off("room-state");
            socket.off("user_list_updated");
            socket.off("invalid-room");
            socket.disconnect();
        };
    }, [roomId, username, navigate]);

    const [language, setLanguage] = useState("cpp");

    const handleStart = (durationInSeconds: number) => {
        socket.emit("start-timer", { roomId, duration: durationInSeconds });
        toast.success("Timer started");
    };

    const handlePause = () => {
        socket.emit("pause-timer", { roomId });
    };

    const handleReset = () => {
        socket.emit("stop-timer", { roomId });
        toast.success("Timer reset");
    };

    const handleAddTime = (additionalSeconds: number) => {
        socket.emit("add-time-timer", { roomId, extraTime: additionalSeconds });
        toast.success(`Added ${(additionalSeconds)/60} minutes`);
    };

    async function saveCanvasAsSvg(excalidrawAPI: ExcalidrawImperativeAPI | null) {
        if(!excalidrawAPI) return;

        if (!isInterviewer) {
            return;
        }

        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        const files = excalidrawAPI.getFiles();

        if (!elements || elements.length === 0) {
            return "";
        }

        const svgElement = await exportToSvg({
            elements: elements,            
            appState: {
            ...appState   
            },
            files: files,                  
            exportPadding: 20,              
            metadata: "Author: Dev Team",    
        });

        const svgTextString = new XMLSerializer().serializeToString(svgElement);
        return svgTextString;
    }

    const executeCode = async() => {
        setRunActive(false);
        const exeData = {
            "language": language,
            "files": [
                {
                    "name": `main.${(language === "cpp") ? "cpp" : (language === "python"?"py": (language === "javascript")? "js" : "" )}`,
                    "content": code
                }
            ],
            "stdin": codeInput,
        }

        const response = await axios.post(`${SERVER_URL}/run-code`, exeData);

        setCodeOutput(response.data.stdout);
        setCodeErrors(response.data.stderr || response.data.creditsRemaining);

        setRunActive(true);
        toast.success("Code execution complete");
    }

    const handleSave = async() => {
        if (!isInterviewer) {
            return;
        }

        setIsSaveActive(false);

        const zip = new JSZip();

        if(!(notes.trim().length === 0)) zip.file("Notes.txt", notes);
        if(!(code.trim().length === 0)) zip.file("Code.txt", code);

        const svgTextString = await saveCanvasAsSvg(excalidrawAPI);

        if(svgTextString) zip.file("whiteboard.svg", svgTextString);

        // Zip file created

        // Download zip file code below
        try {
            // Compile the string database using standard DEFLATE compression
            const zipBlob: Blob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { 
                    level: 6 // Balanced compression setting for speedy downloads
                }
            });

            // Map the binary file into browser memory space
            const downloadUrl: string = URL.createObjectURL(zipBlob);

            // Mount a hidden link to trigger the user's browser save menu
            const link: HTMLAnchorElement = document.createElement("a");
            link.href = downloadUrl;
            link.download = "Room-data.zip";

            document.body.appendChild(link);
            link.click();

            // Memory cleanup to avoid RAM leaks
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            toast.success("Room data downloaded");
            setIsSaveActive(true);

        } catch (error) {
            console.error("Failed to compile and download text workspace package:", error);
            alert("An error occurred while compiling your workspace zip archive.");
        }
    }

    
  return (
    <div className="w-screen h-screen flex flex-col bg-zinc-900 geomini">
        
        <AddProblemModal roomId={roomId} open={isAddProblemOpen} onClose={()=>setIsAddProblemOpen(false)} onSave={(p) => setProblem(p)}/>

        <EndRoomDialog roomId={roomId} open={isEndDialogOpen} onClose={()=>setIsEndDialogOpen(false)}/>

        <header className='py-2 px-8 flex justify-between'>
            <div className='flex gap-4'>
                {
                    users.map(({id, username}) => (
                        <div key={id} className={`flex py-0.5 px-2 items-center gap-2 border-2 rounded-xl ${id === socket?.id ?"bg-emerald-500/20 border-emerald-300":"bg-zinc-800 border-zinc-500"}`}>
                            <div className="box-border aspect-square w-[1.7rem] h-[1.7rem] p-1 flex justify-center items-center rounded-full bg-emerald-500 text-emerald-50">{username[0]}</div>
                            <div className='text-xs text-emerald-50'>{username}</div>
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

            <ul className='flex gap-2 items-center'>
            {isInterviewer && <ul className='flex gap-2 items-center'>
                <li>
                    <button className='hover:bg-zinc-800 rounded-md p-1 transition-colors duration-150 cursor-pointer' onClick={()=>setIsAddProblemOpen(true)}><CirclePlus size="1.5rem" color='gray'/></button>
                </li>
                <li><button disabled={!isSaveActive} className='hover:bg-zinc-800 rounded-md p-1 transition-colors duration-150 cursor-pointer' onClick={handleSave}><Save color='gray' size="1.5rem"/></button></li>
                <li><button className='hover:bg-zinc-800 rounded-md p-1 transition-colors duration-150 cursor-pointer' onClick={()=>setIsEndDialogOpen(true)}><MonitorX size="1.5rem" color="gray"/></button></li>
            </ul>}
                <li><button className='hover:bg-zinc-800 rounded-md p-1 transition-colors duration-150 cursor-pointer' onClick={()=>setWhiteboardActive(prev => !prev)}><Presentation size="1.5rem" color='gray'/></button></li>
            </ul>
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
                            <select className='bg-zinc-800 hover:bg-zinc-700/50 rounded-md text-sm figtree p-1 px-2 text-zinc-200 appearance-auto' value={language} onChange={(e)=>setLanguage(e.target.value)}>
                                <option value="" disabled>Choose language: </option>
                                <option value="cpp">C++</option>
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                            </select>

                            <button disabled={!runActive} className='flex gap-1 text-emerald-50 text-[13px] font-medium bg-zinc-800 items-center p-1 px-1.5 rounded-md border border-emerald-700 cursor-pointer' onClick={executeCode}>{runActive?<><Play color='#00bc7d' size="1.2rem"/><span>Run</span></>:<Loader/>}</button>
                        </div>
                        
                        <div className='flex-1 min-h-0 pt-4'>
                            <Editor height='100%' width='100%' defaultLanguage={language} theme='vs-dark' value={code} onChange={(value) => onCodeChange(value)}/>
                        </div>
                        </Panel>

                    <Separator className="h-0.5 rounded-full bg-transparent hover:bg-blue-500" />

                    {whiteboardActive ? 
                        <Panel maxSize='70%' minSize='10%' defaultSize="20%" className={`h-full w-full p-0.5 rounded-xl border border-zinc-700 bg-[#1e1e21]`}>
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
                    :
                        <Panel maxSize='70%' minSize='20%' defaultSize="40%" className={`h-full w-full p-0.5 rounded-xl border border-zinc-700 bg-[#1e1e21]`}>
                            <div className='flex gap-2 p-2 h-full font-mono'>
                                <textarea value={codeInput} onChange={(e)=>setCodeInput(e.target.value)} className='border w-1/2 text-zinc-300 resize-none outline-none rounded-lg border-zinc-600 p-2' placeholder='Input'>
                                </textarea>

                                <div className='flex flex-col grow gap-1'>
                                    <textarea value={codeOutput} placeholder='Output : current version has limited credits' readOnly className='outline-none text-md read-only:text-zinc-500 border grow text-zinc-300 resize-none rounded-lg border-zinc-600 p-2'>
                                    </textarea>

                                    <textarea readOnly className='outline-none text-xs read-only:text-zinc-500 border scrollbar-none text-zinc-300 resize-none rounded-lg border-zinc-600 p-2' placeholder='code errors / remaining credits shown here' value={codeErrors}></textarea>                                    
                                </div>
                            </div>                       
                        </Panel>
                    }
                </Group>
            </Panel>
        </Group>
    </div>
  )
}

export default Room