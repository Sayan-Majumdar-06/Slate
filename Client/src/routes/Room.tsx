import { Editor } from '@monaco-editor/react'
import { Group, Panel, Separator } from "react-resizable-panels";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { socket } from '../socket/socket';
import { useLocation } from 'react-router';
import { Excalidraw } from "@excalidraw/excalidraw";
import AddProblemModal from '../Components/AddProblemModal';
import "@excalidraw/excalidraw/index.css";
const Room = () => {

    const params = useParams();

    const { id } = params;

    const location = useLocation();
    const username = location.state?.username || "Anonymous";

    const [users, setUsers] = useState<string[]>([]);

    const [code, setCode] = useState("// code here");

    const delayRef = useRef<number | null>(null);

    const [isAddProblemOpen, setIsAddProblemOpen] = useState(false);

    const [problem, setProblem] = useState("Problem statement goes here");
    const [notes, setNotes] = useState("Notes");

    const onCodeChange = (value: string) => {
        const newCode = value ?? "";

        setCode(newCode);

        if(delayRef.current) {
            clearTimeout(delayRef.current);
        }

        delayRef.current = window.setTimeout(() => socket.emit('code-changed', {
            roomId: id,
            code: newCode
        }), 50);       
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
        socket.auth = { id, username };
        socket.connect();

        socket.on("connect", () => {
            console.log("Connected: ", socket.id);
            socket.emit("join-room", id);
        });

        socket.on("user_list_updated", (userList: string[]) => {
            console.log("Received users:", userList);
            setUsers(userList);
        });

        return () => {
            socket.off("connect");
            socket.off("user_list_updated");
            socket.disconnect();
        };
    }, [id, username]);

    const isInterviewer = (username == "ADMIN");

    
  return (
    <div className="w-screen h-screen flex flex-col">
        
        <AddProblemModal roomId={id} open={isAddProblemOpen} onClose={()=>setIsAddProblemOpen(false)} onSave={(p) => setProblem(p)}/>

        <header className='py-3 px-8 flex justify-between border-2'>
            <div className='flex gap-4'>
                {
                    users.map((name: string, index: number) => (
                        <div key={index} className={`border-2 p-1 ${name == username ? "border-red-500":""}`}>
                            {name + (name == "ADMIN" ? " (Interviewer)": "")}
                        </div>
                    ))
                }
            </div>

            <div className='border p-1'>Timer</div>

            {isInterviewer && <ul className='flex gap-3'>
                <li><button className='border p-1 cursor-pointer' onClick={()=>setIsAddProblemOpen(true)}>Add problem</button></li>
                <li><button className='border p-1'>Save data</button></li>
                <li><button className='border p-1'>End room</button></li>
                <li><button className='border p-1'>Settings</button></li>
            </ul>}
        </header>

        <Group orientation='horizontal' className='flex-1'> 
            {/* Left */}
            <Panel maxSize='40%' minSize='20%'>
                <Group className='h-full flex flex-col' orientation='vertical'>
                    <Panel className='w-full h-full whitespace-pre-wrap p-4'>
                        {problem}
                    </Panel>

                    {isInterviewer &&  
                        <>
                        <Separator className="h-1 bg-zinc-700 hover:bg-blue-500" />

                        <Panel maxSize='70%' minSize='20%' className='w-full h-full relative'>
                            <textarea className='inset-4 absolute resize-none outline-none text-sm font-mono' value={notes} onChange={(e)=>setNotes(e.target.value)}></textarea>
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

                    <Panel maxSize='70%' minSize='20%' classname='h-full w-full'>
                        <Excalidraw/>                        
                    </Panel>
                </Group>
            </Panel>
        </Group>
                 
    </div>
  )
}

export default Room