import { useNavigate, useParams } from 'react-router';

const Create = () => {

  const navigate = useNavigate();
  const params = useParams();

  const { roomId } = params;
  const username = "ADMIN";

  const joinRoom = () => {
    if (!roomId) return;
    navigate(`/room/${roomId}`, { state: { username: username } });
  }
  
  return (
    <div className="min-w-screen min-h-screen flex items-center justify-center">
      <div className="w-[400px] h-[300px] p-8 border rounded-xl flex flex-col items-center justify-around">
        <div>
            <h3>Room ID:</h3>
            <h2>{roomId}</h2>
        </div>
        <button className="border-2 p-2 rounded-lg" onClick={joinRoom}>Enter Room</button>
      </div>
    </div>
  )
}

export default Create