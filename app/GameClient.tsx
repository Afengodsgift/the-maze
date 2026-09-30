'use client';
import dynamic from 'next/dynamic';
const Game = dynamic(() => import('../src/game/Game'), { ssr: false });
export default function GameClient() { return <Game />; }
