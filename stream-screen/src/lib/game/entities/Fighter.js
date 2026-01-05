import Phaser from 'phaser';

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, type, characterName) {
        super(scene, x, y, texture);
        this.fighterType = type;
        this.characterName = characterName;

        // Internal state tracking
        this.currentAnimation = 'idle';
        this.health = 1.0;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setOrigin(0.5, 1);
        this.setSize(30, 60);

        // Hitbox for visuals/debugging (logic is server-side now mostly, but we keep it for clientside particles/effects)
        this.hitbox = scene.add.rectangle(0, 0, 40, 20, 0, 0);
        scene.physics.add.existing(this.hitbox);
        if (this.hitbox.body) this.hitbox.body.allowGravity = false;
        this.hitbox.setActive(false);

        this.play(`${this.characterName}_idle`, true);
    }

    update(combatStateFighter) {
        // combatStateFighter has: { hp, animation, lastHit }

        // 1. Update Health (Visual feedback if damage taken)
        if (combatStateFighter.hp < this.health) {
            this.takeDamage();
        }
        this.health = combatStateFighter.hp;

        // 2. Update Animation
        const targetAnim = combatStateFighter.animation || 'idle';

        // Determine movement based on animation or state
        // If server says 'idle', we stand still.
        // If 'punch' or 'kick', we play it.

        if (targetAnim !== this.currentAnimation) {
            // Transition to new animation
            this.currentAnimation = targetAnim;
            this.play(`${this.characterName}_${targetAnim}`, true);

            // EFFECT: Small forward lunge on attack
            if (targetAnim === 'punch' || targetAnim === 'kick' || targetAnim === 'special') {
                const moveAmount = 15;
                const dir = this.flipX ? -1 : 1;
                this.scene.tweens.add({
                    targets: this,
                    x: this.x + (moveAmount * dir),
                    duration: 100,
                    yoyo: true,
                    ease: 'Power1'
                });
            }
        }

        // Update hitbox or other elements
        this.hitbox.setPosition(this.x + (this.flipX ? -40 : 40), this.y - 35);
    }

    takeDamage() {
        this.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
        // Shake effect?
        this.scene.cameras.main.shake(100, 0.01);
    }

    // Setters for external control
    setFighterData(data) {
        if (data.hp !== undefined) this.health = data.hp;
    }
}
