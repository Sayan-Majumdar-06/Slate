import { useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

// Assuming you have your socket instance and roomId available via context or props
const TimerComponent = ({ socket }: {socket: Socket}) => {
  const [timeLeft, setTimeLeft] = useState(0); // In seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("timer-updated", (timerState) => {
      const { endTime, remainingTime, isPaused: backendPaused } = timerState;
      
      clearInterval(intervalRef.current ?? undefined);

      if (backendPaused && remainingTime !== null) {
        setTimeLeft(Math.ceil(remainingTime / 1000));
      } else if (endTime !== null) {
        endTimeRef.current = endTime;

        const calculateRemaining = () => {
          const diff = endTimeRef.current! - Date.now();
          if (diff <= 0) {
            clearInterval(intervalRef.current ?? undefined);
            setTimeLeft(0);
          } else {
            setTimeLeft(Math.ceil(diff / 1000));
          }
        };

        calculateRemaining();
        
        intervalRef.current = setInterval(calculateRemaining, 1000);
      } else {
        setTimeLeft(0);
      }
    });

    return () => {
      socket.off("timer-updated");
      clearInterval(intervalRef.current ?? undefined);
    };
  }, [socket]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className='bg-zinc-900 p-1 rounded-lg px-3 border border-zinc-600 text-xl'>
        {formatTime(timeLeft)}
    </div>
  );
};

export default TimerComponent;