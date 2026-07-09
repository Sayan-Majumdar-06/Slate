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
        <div className='bg-gray-800/90 inset-0 z-20 fixed flex items-center justify-center' onClick={onClose}>
            <div className='w-[400px] h-[200px] p-4 bg-white flex flex-col gap-4' onClick={(e) => e.stopPropagation()}>
                <h1>End Room ?</h1>
                <h3>This will disconnect everyone and permanently close this room</h3>
                <div className='flex gap-4'>
                    <button className='w-fit border p-1' onClick={endRoom}>End</button>
                    <button className='w-fit border p-1' onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    )
  )
}

export default EndRoomDialog