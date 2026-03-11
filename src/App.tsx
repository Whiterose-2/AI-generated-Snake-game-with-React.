import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Types ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Direction = 'RIGHT';
const GAME_SPEED = 100;

const TRACKS = [
  {
    id: 1,
    title: "ERR_0x01_NEON_NIGHTS",
    artist: "CYBER_SYNTH_CORE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "SYS_HORIZON_DIGITAL",
    artist: "NEURAL_BEATS_V2",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "QUANTUM_GROOVE_FAULT",
    artist: "ALGO_RHYTHM_SEQ",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  }
];

// Custom hook for game loop
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const nextDirectionRef = useRef<Direction>(INITIAL_DIRECTION);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio play error:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        setIsPaused(p => !p);
        return;
      }

      if (gameOver) return;

      const currentDir = nextDirectionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  const gameLoop = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      directionRef.current = nextDirectionRef.current;
      const currentDir = directionRef.current;

      const newHead = { ...head };

      if (currentDir === 'UP') newHead.y -= 1;
      if (currentDir === 'DOWN') newHead.y += 1;
      if (currentDir === 'LEFT') newHead.x -= 1;
      if (currentDir === 'RIGHT') newHead.x += 1;

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        // Don't pop the tail
      } else {
        newSnake.pop(); // Remove tail
      }

      return newSnake;
    });
  }, [gameOver, isPaused, food, generateFood]);

  useInterval(gameLoop, gameOver || isPaused ? null : GAME_SPEED);

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col md:flex-row overflow-hidden crt-flicker selection:bg-fuchsia-500 selection:text-black">
      <div className="scanlines" />
      <div className="noise" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 border-r-4 border-fuchsia-500/50">
        {/* Header */}
        <div className="mb-6 text-center tear">
          <h1 className="text-6xl md:text-8xl font-bold tracking-widest mb-2 text-fuchsia-500 glitch drop-shadow-[0_0_10px_#ff00ff]" data-text="SNAKE.EXE">
            SNAKE.EXE
          </h1>
          <div className="flex items-center justify-center gap-6 text-3xl text-cyan-400 bg-cyan-900/30 px-4 py-1 border border-cyan-500">
            <span>DAT_BLOCKS: {score.toString().padStart(4, '0')}</span>
          </div>
        </div>

        {/* Game Board */}
        <div className="relative p-1 border-4 border-cyan-500 bg-black shadow-[0_0_20px_#00ffff]">
          <div 
            className="relative bg-black"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              gap: '2px',
              width: 'min(80vw, 450px)',
              height: 'min(80vw, 450px)',
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnakeHead = snake[0].x === x && snake[0].y === y;
              const isSnakeBody = snake.some((segment, idx) => idx !== 0 && segment.x === x && segment.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div
                  key={i}
                  className={`w-full h-full ${
                    isSnakeHead
                      ? 'bg-cyan-300 shadow-[0_0_10px_#00ffff]'
                      : isSnakeBody
                      ? 'bg-cyan-600'
                      : isFood
                      ? 'bg-fuchsia-500 shadow-[0_0_15px_#ff00ff] animate-pulse'
                      : 'bg-cyan-950/20'
                  }`}
                />
              );
            })}

            {/* Overlays */}
            {(gameOver || isPaused) && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 border-2 border-fuchsia-500 tear">
                <h2 className={`text-4xl md:text-5xl font-bold mb-4 glitch ${gameOver ? 'text-fuchsia-500' : 'text-cyan-400'}`} data-text={gameOver ? 'FATAL_ERROR' : 'SYS_HALTED'}>
                  {gameOver ? 'FATAL_ERROR' : 'SYS_HALTED'}
                </h2>
                {gameOver && (
                  <p className="text-2xl text-cyan-400 mb-6">COLLISION_DETECTED</p>
                )}
                <button
                  onClick={gameOver ? resetGame : () => setIsPaused(false)}
                  className="px-6 py-2 bg-black border-2 border-fuchsia-500 text-fuchsia-500 text-2xl hover:bg-fuchsia-500 hover:text-black transition-colors cursor-pointer uppercase"
                >
                  {gameOver ? '[ REBOOT_SEQUENCE ]' : '[ RESUME_EXECUTION ]'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-cyan-600 text-xl flex gap-8">
          <span>INPUT: [W A S D]</span>
          <span>INTERRUPT: [SPACE]</span>
        </div>
      </main>

      {/* Music Player Sidebar */}
      <aside className="w-full md:w-96 bg-black p-6 flex flex-col z-20 relative border-l-4 border-cyan-500/50">
        
        <div className="mb-8 border-b-2 border-fuchsia-500 pb-4 tear">
          <h2 className="text-4xl font-bold text-fuchsia-500 glitch" data-text="AUDIO_SUBSYS">AUDIO_SUBSYS</h2>
          <p className="text-cyan-600 text-lg mt-1">STATUS: {isPlaying ? 'STREAMING' : 'IDLE'}</p>
        </div>

        {/* Now Playing */}
        <div className="flex-1 flex flex-col justify-start">
          <div className="border-2 border-cyan-500 p-4 mb-8 bg-cyan-950/20 relative overflow-hidden">
            {isPlaying && (
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00ffff_2px,#00ffff_4px)] animate-[scroll_10s_linear_infinite]" />
            )}
            <div className="text-2xl text-fuchsia-400 mb-2 font-bold truncate">
              &gt; {currentTrack.title}
            </div>
            <div className="text-xl text-cyan-500 truncate">
              SRC: {currentTrack.artist}
            </div>
            
            {/* Equalizer */}
            <div className="h-16 mt-6 flex items-end gap-2 border-b-2 border-cyan-800 pb-1">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 bg-cyan-400 ${isPlaying ? 'animate-pulse' : 'h-1'}`}
                  style={isPlaying ? { 
                    height: `${20 + Math.random() * 80}%`,
                    animationDuration: `${0.1 + Math.random() * 0.3}s`,
                    animationDelay: `${Math.random() * 0.2}s`
                  } : {}}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between px-4 text-3xl text-fuchsia-500">
              <button onClick={prevTrack} className="hover:text-cyan-400 hover:bg-fuchsia-900/30 px-2 cursor-pointer transition-colors">
                [ &lt;&lt; ]
              </button>
              
              <button onClick={togglePlay} className="hover:text-cyan-400 hover:bg-fuchsia-900/30 px-4 py-2 border-2 border-fuchsia-500 hover:border-cyan-400 cursor-pointer transition-colors">
                {isPlaying ? '[ || ]' : '[ &gt; ]'}
              </button>
              
              <button onClick={nextTrack} className="hover:text-cyan-400 hover:bg-fuchsia-900/30 px-2 cursor-pointer transition-colors">
                [ &gt;&gt; ]
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-4 px-4 border-2 border-cyan-800 p-2">
              <span className="text-cyan-500 text-xl">VOL:</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-4 bg-black border border-cyan-500 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-fuchsia-500"
              />
              <span className="text-cyan-500 text-xl w-12 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Track List */}
        <div className="mt-8 pt-4 border-t-2 border-cyan-800">
          <h4 className="text-xl text-cyan-600 mb-4">AVAILABLE_STREAMS:</h4>
          <div className="space-y-2">
            {TRACKS.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => {
                  setCurrentTrackIndex(idx);
                  setIsPlaying(true);
                }}
                className={`w-full text-left p-2 text-xl border-l-4 transition-colors cursor-pointer ${
                  idx === currentTrackIndex 
                    ? 'border-fuchsia-500 bg-fuchsia-900/20 text-fuchsia-400' 
                    : 'border-cyan-800 text-cyan-700 hover:border-cyan-400 hover:text-cyan-400'
                }`}
              >
                {idx === currentTrackIndex ? '> ' : '  '}{track.title}
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-8 text-cyan-800 text-sm flex flex-col gap-1">
          <span>SYS_STATUS: ONLINE</span>
          <span>MEMORY: FRAGMENTED</span>
          <span className="text-fuchsia-800 animate-pulse">CONNECTION: UNSTABLE</span>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onEnded={nextTrack}
        />
      </aside>
    </div>
  );
}
