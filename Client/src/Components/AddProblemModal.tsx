import React from 'react'
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
            setError("Problem can't be empty !")
        }
    }

  return (
    open && (
        <div className='bg-gray-800/90 inset-0 z-20 fixed flex items-center justify-center' onClick={onClose}>
            <div className='w-[600px] h-[400px] p-4 bg-white flex flex-col gap-4' onClick={(e) => e.stopPropagation()}>
                <h1>Add problem</h1>
                <textarea className='border w-full flex-1' value={problem} onChange={(e)=>setProblem(e.target.value)}></textarea>
                {error && <p className='text-red-500'>{error}</p>}
                <div className='flex gap-4'>
                    <button className='w-fit border p-1' onClick={addProblem}>Add</button>
                    <button className='w-fit border p-1' onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    )
  )
}

export default AddProblemModal