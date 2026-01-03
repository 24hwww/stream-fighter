"use client";
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../../lib/game/scenes/MainScene.js';
import { Preloader } from '../../lib/game/scenes/Preloader.js';

export default function PhaserGame({ combatState, matchup, stage, active = true }) {
    const gameRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        if (gameRef.current) return;

        const config = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: '100%',
            height: '100%',
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 800 },
                    debug: false
                }
            },
            pixelArt: true,
            backgroundColor: '#000000',
            scene: [Preloader, MainScene],
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        return () => {
            game.destroy(true);
            gameRef.current = null;
        };
    }, []);

    // Watch for Matchup/Stage changes to restart game
    useEffect(() => {
        if (gameRef.current && (matchup || stage)) {
            const scene = gameRef.current.scene.getScene('MainScene');
            if (scene) {
                const restartData = { ...matchup, stage };
                if (scene.scene.isActive()) {
                    scene.scene.restart(restartData);
                } else {
                    scene.scene.start('MainScene', restartData);
                }
            }
        }
    }, [matchup, stage]);

    // Sync Combat State
    useEffect(() => {
        if (gameRef.current && combatState) {
            const scene = gameRef.current.scene.getScene('MainScene');
            if (scene && scene.updateGameState) {
                scene.updateGameState(combatState);
            }
        }
    }, [combatState]);

    return <div ref={containerRef} className="w-full h-full" />;
}
