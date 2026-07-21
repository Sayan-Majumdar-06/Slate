import { useState } from 'react';
import { socket } from '../socket/socket';

type AddProblemModalProps = {
    roomId: string | undefined;
    open: boolean;
    onClose: () => void;
    onSave: (problem: string) => void;
}

const AddProblemModal = ({roomId, open, onClose, onSave}: AddProblemModalProps) => {

    const [problem, setProblem] = useState("");
    const [error, setError] = useState("");

    const addProblem = () => {
        if(problem.trim().length != 0) {
            onSave(problem);
            setProblem("");
            setError("");
            onClose();

            socket.emit("problem-updated", {
                roomId: roomId, 
                problem: problem
            })
        }

        else {
            setError("Problem can't be empty !");
        }
    }

  return (
    open && (
        <div className='bg-zinc-900/90 inset-0 z-20 fixed flex items-center justify-center' onClick={onClose}>
            <div className='w-[600px] h-[400px] p-4 bg-zinc-800 flex flex-col gap-4 rounded-xl text-zinc-200' onClick={(e) => e.stopPropagation()}>
                <h1 className='font-medium text-zinc-300 text-xl'>Add problem</h1>
                <textarea className='figtree outline-none p-3 border border-zinc-600 rounded-lg resize-none w-full flex-1' placeholder='Type/paste your problem here' value={problem} onChange={(e)=>setProblem(e.target.value)}></textarea>
                {error && <p className='text-red-500 text-sm'>{error}</p>}
                <div className='flex gap-4'>
                    <button className='cursor-pointer hover:bg-emerald-400 transition-colors duration-150 bg-emerald-500 text-zinc-50  py-1 px-3 rounded-lg' onClick={addProblem}>Add</button>
                    <button className='cursor-pointer hover:bg-zinc-700 transition-colors duration-150 border border-zinc-500 text-zinc-300 py-1 px-3 rounded-lg' onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    )
  )
}

export default AddProblemModal