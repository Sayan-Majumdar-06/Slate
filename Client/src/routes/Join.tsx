import React from 'react'
import { useNavigate } from 'react-router';

const Join = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const username = formData.get("username");
    const code = formData.get("link");
    navigate(`/room/${code}`, { state: { username: username } });
  }

  return (
    <div className="min-w-screen min-h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit} className='flex flex-col justify-center items-center gap-6 border-2 p-8 rounded-xl'>
            <div className='flex gap-4'><p>Name</p><input className='border' type="text" name='username'/></div>
            <div className='flex gap-4'><p>Enter Code</p><input className='border' type="text" name='link' /></div>

            <button type='submit' className="border-2 py-2 px-4 rounded-lg">Join</button>
        </form>
    </div>
  )
}

export default Join