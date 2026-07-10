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
      socket.on('whiteboard-updated', (scene) => {
        excalidrawAPI?.updateScene(scene);
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

    
  return (
    <div className="w-screen h-screen flex flex-col">
        
        <AddProblemModal roomId={roomId} open={isAddProblemOpen} onClose={()=>setIsAddProblemOpen(false)} onSave={(p) => setProblem(p)}/>

        <EndRoomDialog roomId={roomId} open={isEndDialogOpen} onClose={()=>setIsEndDialogOpen(false)}/>

        <header className='py-3 px-8 flex justify-between border-2'>
            <div className='flex gap-4'>
                {
                    users.map((name: string, index: number) => (
                        <div key={index} className={`border-2 p-1 ${name === username ? "border-red-500":""}`}>
                            {name}
                        </div>
                    ))
                }
            </div>

            <div className='border p-1'>Timer</div>

            {isInterviewer && <ul className='flex gap-3'>
                <li><button className='border p-1 cursor-pointer' onClick={()=>setIsAddProblemOpen(true)}>Add problem</button></li>
                <li><button className='border p-1 cursor-pointer'>Save data (X)</button></li>
                <li><button className='border p-1 cursor-pointer' onClick={()=>setIsEndDialogOpen(true)}>End room</button></li>
                <li><button className='border p-1 cursor-pointer'>Settings (X)</button></li>
            </ul>}
        </header>

        <Group orientation='horizontal' className='flex-1'> 
            {/* Left */}
            <Panel maxSize='40%' minSize='20%'>
                <Group className='h-full flex flex-col' orientation='vertical'>
                    <Panel className='w-full h-full p-4 relative'>
                        <textarea className='inset-4 absolute resize-none outline-none whitespace-pre-wrap' value={problem} onChange={(e) => onProblemUpdated(e.target.value)} disabled>
                        </textarea>
                    </Panel>

                    {isInterviewer &&  
                        <>
                        <Separator className="h-1 bg-zinc-700 hover:bg-blue-500" />

                        <Panel maxSize='70%' minSize='20%' className='w-full h-full relative'>
                            <textarea className='inset-4 absolute resize-none outline-none text-sm font-mono' value={notes} onChange={(e) => onNotesUpdated(e.target.value)}></textarea>
                        </Panel>
                    </>}
                </Group>
            </Panel>

            <Separator className="w-1 bg-zinc-700 hover:bg-blue-500" />

            {/* Right */}
            <Panel className='flex-1'>
                <Group className='flex-1 h-full flex flex-col' orientation='vertical'>
                    <Panel className='w-full h-full'>
                        <Editor height='100%' width='100%' defaultLanguage="cpp" theme='vs-dark' value={code} onChange={(value) => onCodeChange(value)}/>
                    </Panel>

                    <Separator className="h-1 bg-zinc-700 hover:bg-blue-500" />

                    <Panel maxSize='70%' minSize='20%' className='h-full w-full'>
                        <Excalidraw onChange={(elements) => {
                            if(whiteboardDelayRef.current) {
                                clearTimeout(whiteboardDelayRef.current);
                            }

                            whiteboardDelayRef.current = window.setTimeout(()=>socket.emit("whiteboard-updated", {
                                roomId: roomId,
                                elements
                            }),500);
                            
                        }} excalidrawAPI={(api) => setExcalidrawAPI(api)}/>                        
                    </Panel>
                </Group>
            </Panel>
        </Group>
                 
    </div>
  )
}

export default Room