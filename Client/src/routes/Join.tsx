import { useNavigate } from 'react-router';
import { useState } from 'react';

const Join = ({username}:{username:string}) => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setDisable(true);
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const roomId = formData.get("link");
    navigate(`/room/${roomId}`, { state: { username: username } });
  }

  const [disable, setDisable] = useState(true);  

  return (
        <form onSubmit={handleSubmit} className='w-full flex flex-col justify-between gap-4'>
            <input className='border-2 bg-zinc-600/30 text-zinc-300 focus:text-zinc-200 outline-0 focus:outline-2 outline-emerald-600 border-zinc-600 p-3 rounded-xl' type="text" name='link' placeholder='Enter code' onChange={(e) => setDisable(e.target.value.trim().length === 0 || username.trim().length===0)}/>
            <button type='submit' disabled={disable} className="disabled:bg-zinc-600/50 disabled:text-zinc-400/70 disabled:cursor-default disabled:hover:shadow-none cursor-pointer hover:shadow-[0_0_15px_#009966] transition-shadow duration-200 disabled:border-zinc-700 h-fit py-3 px-4 rounded-lg bg-emerald-600 border border-emerald-300 text-emerald-50">Join</button>
        </form>
  )
}

export default Join