import React from 'react'
import { useState } from 'react';
import { socket } from '../socket/socket';

type EndRoomDialogProps = {
    roomId: string | undefined;
    open: boolean;
    onClose: () => void;
}

const EndRoomDialog = ({roomId, open, onClose}: EndRoomDialogProps) => {
    const endRoom = () => {
        console.log("Emitting end-room", roomId);
        onClose();

        socket.emit("end-room", {
            roomId: roomId
        });
    }

  return (
    open && (
        <div className='bg-zinc-900/90 inset-0 z-20 fixed flex items-center justify-center' onClick={onClose}>
            <div className='w-[400px] h-[200px] p-4 bg-zinc-800 rounded-xl text-zinc-200 flex flex-col justify-between gap-4' onClick={(e) => e.stopPropagation()}>
                <h1 className='font-medium text-zinc-300 text-xl'>End Room ?</h1>
                <h3 className='text-md text-zinc-400'>This will disconnect everyone and permanently close this room</h3>
                <div className='flex gap-4'>
                    <button className='cursor-pointer hover:border-red-500 hover:bg-red-500/30 transition-colors duration-150 border-2 border-red-700 text-zinc-50  py-1 px-3 rounded-lg' onClick={endRoom}>End</button>
                    <button className='cursor-pointer hover:bg-zinc-700 transition-colors duration-150 border border-zinc-500 text-zinc-300 py-1 px-3 rounded-lg' onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    )
  )
}

export default EndRoomDialog