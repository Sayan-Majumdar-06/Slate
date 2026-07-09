import { useNavigate } from "react-router";
export default function Home() {
  const navigate = useNavigate();

  const createRoom = async () => {
    const response = await fetch("http://localhost:3000/rooms", {
      method: "POST",
    });

    const { roomID } = await response.json();
    navigate(`/create/${roomID}`);
  }
  return (
    <div className="min-w-screen min-h-screen flex items-center justify-center">
      <div className="w-[400px] h-[300px] p-8 border rounded-xl flex items-center justify-around">
        <button className="border-2 p-2 rounded-lg" onClick={()=>navigate('/join')}>Join Room</button>
        <button className="border-2 p-2 rounded-lg" onClick={createRoom}>Create Room</button>
      </div>
    </div>
  );
}