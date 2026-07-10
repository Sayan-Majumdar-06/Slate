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
    <div className="w-screen h-screen bg-zinc-900 flex flex-col">
      <header className="pt-14 pl-16 flex flex-col gap-2">
        <h1 className="text-zinc-200 geomini text-5xl font-semibold">Slate</h1>
        
      </header>

      <section className="w-full grow flex justify-center items-center">
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