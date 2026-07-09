import { useNavigate, useParams } from 'react-router';

const Create = () => {

  const navigate = useNavigate();
  const params = useParams();

  const { id } = params;
  const username = "ADMIN";

  const joinRoom = () => {
    if (!id) return;
    navigate(`/room/${id}`, { state: { username: username } });
  }
  
  return (
    <div className="min-w-screen min-h-screen flex items-center justify-center">
      <div className="w-[400px] h-[300px] p-8 border rounded-xl flex flex-col items-center justify-around">
        <div>
            <h3>Room ID:</h3>
            <h2>{id}</h2>
        </div>
        <button className="border-2 p-2 rounded-lg" onClick={joinRoom}>Enter Room</button>
      </div>
    </div>
  )
}

export default Create