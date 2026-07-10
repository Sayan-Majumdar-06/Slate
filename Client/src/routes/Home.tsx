import { useNavigate } from "react-router";
import { useState } from "react";
import Join from "./Join";

export default function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");

  const createRoom = async () => {
    const response = await fetch("http://localhost:3000/rooms", {
      method: "POST",
    });

    const { roomID } = await response.json();

    navigate(`/create/${roomID}`, { state: {username: username} });
  }
  return (
    <div className="w-screen h-screen bg-zinc-900 flex">
      <section className="w-[52%] flex flex-col justify-center items-end gap-2 p-20 pr-12">
        <div className="text-left flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <div className="group h-fit text-emerald-500 font-bold text-md border-2 border-zinc-700 bg-zinc-800 rounded-xl flex items-center justify-center p-2 geomini">
              <span className="group-hover:rotate-y-360 transition-transform duration-500">{"</>"}</span>
            </div>

            <h1 className="text-zinc-200 geomini text-5xl font-semibold">Slate</h1>
          </div>
          
          
          <h3 className="text-zinc-400 font-medium text-2xl max-w-sm">
            Conduct technical interviews in one shared workspace.
          </h3>

          <ul className="mt-8 list-disc pl-6 text-zinc-400 flex flex-col gap-2 max-w-lg">
            <li>
              <h1 className="font-medium text-lg">Real-time collaborative coding</h1>
            </li>
            <li>
              <h1 className="font-medium text-lg">Shared whiteboard</h1>
            </li>
            <li>
              <h1 className="font-medium text-lg">Auto-save session progress</h1>
            </li>
            <li>
              <h1 className="font-medium text-lg">Interviewer controls</h1>
            </li>
            <li>
              <h1 className="font-medium text-lg">Low-latency synchronization</h1>
            </li>
          </ul>

          <p className="mt-4 font-medium text-lg text-zinc-400 max-w-lg">No Signup required.</p>
        </div>
      </section>

      <section className="grow flex items-center">
        <div className="w-[400px] py-8 px-12 border rounded-xl flex flex-col gap-4 justify-center bg-zinc-800 border-zinc-600 figtree">

          <h2 className="text-zinc-300 text-xl mb-2">Join a room</h2>

          <div className="w-full flex justify-center">
            <input type="text" className="w-full border-2 bg-zinc-600/30 text-zinc-300 focus:text-zinc-200 outline-0 focus:outline-2 outline-emerald-600 border-zinc-600 p-3 rounded-xl" placeholder="Enter name" value={username} onChange={(e)=>setUsername(e.target.value)}/>
          </div>
          
          <div className="flex flex-col gap-2 justify-center items-center">

            <div className="flex w-full">
              <Join username={username}/>
            </div>

            <div className="h-px w-full my-4 bg-zinc-600"></div>

            <div className="flex flex-col gap-4 w-full">
              <h2 className="text-zinc-300 text-xl">Or, host a new room</h2>
              <button disabled={username.trim().length===0} className="disabled:bg-zinc-600/50 disabled:text-zinc-400/70 disabled:border-zinc-700 p-3 rounded-lg bg-emerald-600 border border-emerald-300 text-emerald-50" onClick={createRoom}>Create Room</button>
            </div>

          </div>

        </div>
      </section>

      
    </div>
  );
}