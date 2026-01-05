import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter.js';

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create(data) {
        this.gameOver = false;
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        this.cameras.main.setZoom(1.5);

        // --- RESPONSIVE 2-TONE BACKGROUND ---
        const skyColor = data?.stage?.skyColor ? parseInt(data.stage.skyColor.replace('#', '0x')) : 0xAED6F1;
        const floorColor = data?.stage?.groundDark ? parseInt(data.stage.groundDark.replace('#', '0x')) : 0x1B4F72;
        const horizonColor = data?.stage?.groundLight ? parseInt(data.stage.groundLight.replace('#', '0x')) : 0x154360;

        const horizonY = centerY;
        const floorHeight = height / 2;
        const bgWidth = width * 3;
        const bgX = -width;

        this.skyRect = this.add.rectangle(bgX, 0, bgWidth, horizonY, skyColor).setOrigin(0).setDepth(0);
        this.floorRect = this.add.rectangle(bgX, horizonY, bgWidth, floorHeight, floorColor).setOrigin(0).setDepth(1);
        this.horizonLine = this.add.rectangle(bgX, horizonY, bgWidth, 4, horizonColor).setOrigin(0).setDepth(2);

        // Arena Zone
        const fightAreaWidth = 600;
        const fightLeft = centerX - fightAreaWidth / 2;
        this.physics.world.setBounds(fightLeft, 0, fightAreaWidth, height);

        // Ground
        const feetY = horizonY + 60;
        this.ground = this.add.rectangle(centerX, feetY + 5, fightAreaWidth, 10, 0, 0);
        this.physics.add.existing(this.ground, true);

        // Matchup setup
        const roster = ['geek', 'pirate', 'ninja', 'sexy', 'cook', 'cat', 'dog'];
        this.playerKey = data?.playerKey || Phaser.Utils.Array.GetRandom(roster);
        this.enemyKey = data?.enemyKey || Phaser.Utils.Array.GetRandom(roster);
        if (this.enemyKey === this.playerKey) this.enemyKey = roster[(roster.indexOf(this.playerKey) + 1) % roster.length];

        // Instantiate Fighters
        this.player = new Fighter(this, centerX - 100, feetY, `${this.playerKey}_sheet`, 'player', this.playerKey);
        this.enemy = new Fighter(this, centerX + 100, feetY, `${this.enemyKey}_sheet`, 'enemy', this.enemyKey);

        this.player.setDepth(10);
        this.enemy.setDepth(10);
        this.enemy.setFlipX(true);

        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.enemy, this.ground);

        this.cameras.main.centerOn(centerX, centerY);
        this.scale.on('resize', this.resize, this);
    }

    resize(gameSize) {
        const { width, height } = gameSize;
        const centerX = width / 2;
        const centerY = height / 2;
        const horizonY = centerY;
        const floorHeight = height / 2;
        const feetY = horizonY + 60;

        const fightAreaWidth = 600;
        const bgWidth = width * 3;
        const bgX = -width;

        if (this.skyRect) this.skyRect.setPosition(bgX, 0).setSize(bgWidth, horizonY);
        if (this.floorRect) this.floorRect.setPosition(bgX, horizonY).setSize(bgWidth, floorHeight);
        if (this.horizonLine) this.horizonLine.setPosition(bgX, horizonY).setSize(bgWidth, 4);

        if (this.ground && this.ground.body) {
            this.ground.body.reset(centerX, feetY + 5);
            this.ground.setSize(fightAreaWidth, 10);
        }

        this.cameras.main.centerOn(centerX, centerY);
    }

    update(time, delta) {
        if (this.gameOver || !this.player || !this.enemy) return;

        const distance = Math.abs(this.player.x - this.enemy.x);
        const combatRange = 100;
        const walkSpeed = 1.5;

        // --- AUTONOMOUS MOVEMENT (Proximity Logic) ---
        if (distance > combatRange) {
            // Move towards each other
            if (this.player.x < this.enemy.x) {
                this.player.x += walkSpeed;
                this.enemy.x -= walkSpeed;
            } else {
                this.player.x -= walkSpeed;
                this.enemy.x += walkSpeed;
            }

            // Set walking animations if not attacking
            if (this.player.currentAnimation === 'idle') {
                this.player.play(`${this.playerKey}_walk`, true);
                this.player.currentAnimation = 'walk';
            }
            if (this.enemy.currentAnimation === 'idle') {
                this.enemy.play(`${this.enemyKey}_walk`, true);
                this.enemy.currentAnimation = 'walk';
            }
        } else {
            // Close enough, return to idle if not attacking
            if (this.player.currentAnimation === 'walk') {
                this.player.play(`${this.playerKey}_idle`, true);
                this.player.currentAnimation = 'idle';
            }
            if (this.enemy.currentAnimation === 'walk') {
                this.enemy.play(`${this.enemyKey}_idle`, true);
                this.enemy.currentAnimation = 'idle';
            }
        }

        // --- FACE EACH OTHER ---
        if (this.player.x < this.enemy.x) {
            this.player.setFlipX(false);
            this.enemy.setFlipX(true);
        } else {
            this.player.setFlipX(true);
            this.enemy.setFlipX(false);
        }

        // Dynamic Camera follow
        const avgX = (this.player.x + this.enemy.x) / 2;
        const targetScrollX = avgX - (this.cameras.main.width / 2);
        this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetScrollX, 0.05);
    }

    updateGameState(combatState) {
        if (!this.player || !this.enemy || !combatState) return;

        // Update properties that come from server (hp, triggering special anims)
        if (combatState.fighterA) this.player.update(combatState.fighterA);
        if (combatState.fighterB) this.enemy.update(combatState.fighterB);
    }
}
