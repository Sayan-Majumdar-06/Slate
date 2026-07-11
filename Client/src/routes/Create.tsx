import { useNavigate, useParams } from 'react-router';
import { useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'
const Create = () => {

  const navigate = useNavigate();
  const params = useParams();

  const { roomId } = params;
  const location = useLocation();
  const username = location.state?.username || "Anonymous";

  const [copied, setCopied] = useState(false);

  const joinRoom = () => {
    if (!roomId) return;
    navigate(`/room/${roomId}`, { state: { username: username, isInterviewer: true } });
  }

  const handleCopy = () => {
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  useEffect(() => {
    toast.success("Room created successfully !")
  }, []);
  
  
  return (
    <div className="min-w-screen min-h-screen flex items-center justify-center bg-zinc-900 geomini">
      <Toaster/>
      <div className="py-16 px-20 border border-zinc-600 rounded-xl flex flex-col gap-8 items-center justify-around bg-zinc-800">
        <div className='flex flex-col gap-2'>
          <h2 className='text-zinc-300 font-medium text-2xl'>
            Your room is ready.
          </h2>
            <h3 className='text-zinc-300 font-medium text-lg'>Share this ID with your candidate</h3>
            <h2 className='text-zinc-400 font-semibold border border-zinc-600 text-xl bg-zinc-900 p-3 rounded-lg'>{roomId}</h2>
        </div>

        <div className='mt-8 flex gap-8'>
          <button disabled={copied} className="min-w-[124px] disabled:bg-zinc-600/50 disabled:text-zinc-100/70 disabled:border-emerald-800 p-3 rounded-lg border-2 bg-zinc-500/60 border-emerald-600/80 text-emerald-50" onClick={() => {navigator.clipboard.writeText(roomId?roomId:""); handleCopy();}}>{copied? <div className='flex gap-2'><CircleCheck color='green'/><span>Copied !</span> </div>: "Copy Code"}</button>
          <button className="min-w-[124px] p-3 rounded-lg bg-emerald-600 border border-emerald-300 text-emerald-50" onClick={joinRoom}>Enter Room</button>
        </div>
      </div>
    </div>
  )
}

export default Create