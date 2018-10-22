$(document).ready(function(){
    var main = new Main();
    main.initGame();
    main.run();
});


const AST_MAX_SPEED_CON = 100;
const AST_NUM_CON = 7;
const AST_ADDED_CON = 1;
const ENEMY_SPAWN_TIME_CON = 10;
const ENEMY_SHOOT = 3.5;
const MAX_ENEMY_CON = 1;

var AST_MAX_SPEED = 100;
var AST_NUM = 7;
var AST_ADDED = 1;
var ENEMY_SPAWN_TIME = 10;

const SHIP_SIZE = 20;
const SHIP_THRUST = 5;
const SHIP_FRICTION = 0.8;
const SHIP_TURN_SPD = 360;
const BLINK_TIME = 3;
const EXPL_TIME = 2;
const EXPL_TIME_AST = 0.2;
const TP_CD = 10;
const MEDIUM = 80;
const SMALL = 25;

var invader = new Image();
invader.src = "images/alien.png";


class Vector {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

class Sound {

    constructor(src, maxStreams = 1, vol = 1.0) {
        this.streamNum = 0;
        this.streams = [];
        this.maxStreams = maxStreams;
        for (var i = 0; i < maxStreams; i++) {
            this.streams.push(new Audio(src));
            this.streams[i].volume = vol;
        }
    }

    play() {
        this.streamNum = (this.streamNum + 1) % this.maxStreams;
        this.streams[this.streamNum].play();
    }

    stop() {
        this.streams[this.streamNum].pause();
        this.streams[this.streamNum].currentTime = 0;
    }
}

const fxExplode = new Sound("sounds/explode.m4a");
const fxHit = new Sound("sounds/hit.m4a", 5);
const fxLaser = new Sound("sounds/laser.m4a", 5, 0.5);
const fxThrust = new Sound("sounds/thrust.m4a");


/**
 * Basic class for Sprite representation
 */
class Sprite {
    set radius(value) {
        this._radius = value;
    }

    /**
     * Basic constructor
     * @param x
     * @param y
     * @param id
     * @param img
     * @param width
     * @param height
     * @param speed
     * @param canvas
     */
    constructor(x, y, xv, yv, canvas, radius) {
        this.position = new Vector(x, y);

        this.velocity = new Vector(xv, yv);
        this.canvas = canvas;
        this._radius = radius;
        this.shouldExplode = false;
        this.explodeTime = 0;
    }


    draw(context) {

    }

    /**
     * Update function that affect behavior of the sprite
     * @param timeDelta
     * @param input
     */
    update(timeDelta, input) {
    }

    getInside() {
        if (!this.isOutside())
            return;
        if (this.position.x + this._radius < 0)
            this.position.x = this.canvas.width + this._radius;
        else if (this.position.x - this._radius > this.canvas.width)
            this.position.x = -this._radius;
        if (this.position.y + this._radius < 0)
            this.position.y = this.canvas.height + this._radius;
        else if (this.position.y - this._radius > this.canvas.height)
            this.position.y = -this._radius;
    }

    isOutside() {
        if (this.position.x + this._radius < 0 || this.position.x - this._radius > this.canvas.width
            || this.position.y + this._radius < 0 || this.position.y - this._radius > this.canvas.height)
            return true;
    }

    explode() {
        this.velocity = new Vector(0,0);
        this.shouldExplode = true;
        this.explodeTime = EXPL_TIME;
        fxExplode.play();
    }
}

class MyMath {
    static distance(v1,v2) {
        let dX = MyMath.dX(v1,v2);
        let dY = MyMath.dY(v1,v2);
        return  Math.sqrt(dX * dX + dY * dY);
    }

    static dX(v1,v2) {
        return v1.x - v2.x;
    }

    static dY(v1,v2) {
        return v1.y - v2.y;
    }

    static randomBetween(min,max) {
        return Math.random() * (max - min) + min;
    }


}

class AsteroidSprite extends Sprite{
    set radius(value) {
        this._radius = value;
        this.mass = this._radius / 2;
    }

    constructor(x,y,canvas,radius) {
        super(x,y,Math.random() * AST_MAX_SPEED * 2 - AST_MAX_SPEED, Math.random() * AST_MAX_SPEED * 2 - AST_MAX_SPEED,canvas,radius);

        this.mass = this._radius / 2;
        this.color = "rgb(128,128,128)";
        this._radius = radius;
    }

    update(time,input,asteroids) {
        if(this.shouldExplode) {
            if(this.explodeTime < 0) {
                this.shouldExplode = false;
                asteroids.splice(asteroids.indexOf(this),1);
            }
            this.explodeTime -= time;
            return;
        }
        this.position.x += this.velocity.x * time;
        this.position.y += this.velocity.y * time;
        this.getInside();

        return this.collide(asteroids);
    };


    destroy(asteroids) {
        fxExplode.play();
        let x = this.position.x;
        let y = this.position.y;
        if(this.mass <= Math.ceil(SMALL)) {
            this.explode();
        } else if(this.mass <= Math.ceil(MEDIUM)) {
            let radiusRatio = MyMath.randomBetween(0.3,0.6);
            let radius = this._radius;
            this.radius = radius * radiusRatio;
            let newAsteroid = new AsteroidSprite(x, y, this.canvas,radius * (1 - radiusRatio));
            asteroids.push(newAsteroid);
        } else {
            /*let radius = asteroid.radius * 0.6;
            let radiusRatio = Math.random();
            asteroid.radius = radius * radiusRatio;
            asteroids.push(new AsteroidSprite(x, y, this.canvas,radius * (1 - radiusRatio)));*/
        }
    }

    collide(asteroids) {
        var angle, asteroid, cosine, dX, dY, sine, vTotal, vX, vXb, vY, vYb, x, xB, y, yB, i;
        for (i = 0; i < asteroids.length; i++) {
            asteroid = asteroids[i];
            if (asteroid === this || asteroid.shouldExplode) {
                continue;
            }
            dX = MyMath.dX(asteroid.position,this.position);
            dY = MyMath.dY(asteroid.position,this.position);
            if (MyMath.distance(this.position,asteroid.position) < this._radius + asteroid._radius) {
                angle = Math.atan2(dY, dX);
                sine = Math.sin(angle);
                cosine = Math.cos(angle);
                x = y = 0;
                xB = dX * cosine + dY * sine;
                yB = dY * cosine - dX * sine;
                vX = this.velocity.x * cosine + this.velocity.y * sine;
                vY = this.velocity.y * cosine - this.velocity.x * sine;
                vXb = asteroid.velocity.x * cosine + asteroid.velocity.y * sine;
                vYb = asteroid.velocity.y * cosine - asteroid.velocity.x * sine;
                xB = x + (this._radius + asteroid._radius);
                vTotal = vX - vXb;
                vX = ((this.mass - asteroid.mass) * vX + 2 * asteroid.mass * vXb) / (this.mass + asteroid.mass);
                vXb = vTotal + vX;
                this.position.x = this.position.x + (x * cosine - y * sine);
                this.position.y = this.position.y + (y * cosine + x * sine);
                asteroid.position.x = this.position.x + (xB * cosine - yB * sine);
                asteroid.position.y = this.position.y + (yB * cosine + xB * sine);
                this.velocity.x = vX * cosine - vY * sine;
                this.velocity.y = vY * cosine + vX * sine;
                asteroid.velocity.x = vXb * cosine - vYb * sine;
                asteroid.velocity.y = vYb * cosine + vXb * sine;
                fxHit.play();
            }
        }
    };

    draw(context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.position.x, this.position.y, this._radius, 0, Math.PI * 2, false);
        context.closePath();
        context.fill();
    }

    explode() {
        this.velocity = new Vector(0,0);
        this.shouldExplode = true;
        this.explodeTime = EXPL_TIME_AST;
    }

}
/**
 * Class representing player
 */
class PlayerSprite extends Sprite{
        get shouldFire() {
            return this._shouldFire;
        }

        set shouldFire(value) {
            this._shouldFire = value;
        }
        get lives() {
            return this._lives;
        }
        get score() {
            return this._score;
        }

        set score(value) {
            this._score = value;
        }
        constructor(x,y,canvas) {
            super(x,y,0,0,canvas, SHIP_SIZE / 2);
            this.rot = 0;
            this.a = 90 / 180 * Math.PI;
            this.isThrust = false;
            this._score = 0;
            this._lives = 3;
            this._shouldFire = false;
            this.blink = false;
            this.blinkingTime = 0;
            this.teleportCD = 0;
        }

        update(timeDelta,input) {
            if(this.teleportCD > 0)
                this.teleportCD -= timeDelta;
            if(this.blink) {
                this.blinkingTime -= timeDelta;
                if(this.blinkingTime < 0)
                    this.blink = false;
            }
            if(this.shouldExplode) {
                if(this.explodeTime < 0) {
                    this.shouldExplode = false;
                    this.blinking();
                }
                this.explodeTime -= timeDelta;
                return;
            }
            if(input.isDown(84) && this.teleportCD <= 0) {
                this.teleport();
                return;
            }
            if(input.isDown(38)) {
                this.isThrust = true;
            } else {
                this.isThrust = false;
                fxThrust.stop();
            }
            if(input.isDown(37)) {
                this.rot = SHIP_TURN_SPD / 180 * Math.PI / 60;
            }
            else if(input.isDown(39)) {
                this.rot = -SHIP_TURN_SPD / 180 * Math.PI / 60;
            } else
                this.rot = 0;
            if(input.isDown(32))
                this.shouldFire = true;
            if(this.isThrust) {
                this.velocity.x += SHIP_THRUST * Math.cos(this.a) / 60;
                this.velocity.y -= SHIP_THRUST * Math.sin(this.a) / 60;
                fxThrust.play();
            } else {
                this.velocity.x -= SHIP_FRICTION * this.velocity.x / 60;
                this.velocity.y -= SHIP_FRICTION * this.velocity.y / 60;
            }
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.a += this.rot;
            this.getInside();
        }

        draw(ctx,x,y,a) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo( // nose of the ship
                x + 4 / 3 * this._radius * Math.cos(a),
                y - 4 / 3 * this._radius * Math.sin(a)
            );
            ctx.lineTo( // rear left
                x - this._radius * (2 / 3 * Math.cos(a) + Math.sin(a)),
                y + this._radius * (2 / 3 * Math.sin(a) - Math.cos(a))
            );
            ctx.lineTo( // rear right
                x - this._radius * (2 / 3 * Math.cos(a) - Math.sin(a)),
                y + this._radius * (2 / 3 * Math.sin(a) + Math.cos(a))
            );
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(x + 4 / 3 * this._radius * Math.cos(a), y - 4 / 3 * this._radius * Math.sin(a), 3, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }

        blinking() {
            this.blink = true;
            this.blinkingTime = BLINK_TIME;
        }

        teleport() {
            this.position.x = Math.random() * (this.canvas.width - 40);
            this.position.y = Math.random() * (this.canvas.height - 40);
            this.velocity = new Vector(0,0);
            this.teleportCD = TP_CD;
            this.blinking();
        }
    }

/**
 * Class representing bullets
 */
class BulletSprite extends Sprite{
    constructor(x,y,id,speedx,speedy,canvas, type) {
        super(x,y,speedx,speedy,canvas,SHIP_SIZE / 6);
        this.type = type;
        this.id = id;
    }

    update(timeDelta) {
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;
    }

    draw(ctx) {
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this._radius, 0, Math.PI * 2, false);
        ctx.fill();
    }
}

/**
 * Class representing aliens
*/
    class EnemySprite extends Sprite {
    get shouldFire() {
        return this._shouldFire;
    }

    set shouldFire(value) {
        this._shouldFire = value;
    }

    constructor(x, y, id, canvas) {
        super(x + 10, y + 8, Math.random() * AST_MAX_SPEED - AST_MAX_SPEED, Math.random() * AST_MAX_SPEED - AST_MAX_SPEED, canvas);
        this.id = id;
        this.x = x;
        this.y = y;
        this.img = invader;
        this._shouldFire = true;
        this.timeToShoot = ENEMY_SHOOT;
        this._width = 20;
        this._height = 16;
        this._radius = 10;
    }

    update(timeDelta) {
        if(this.shouldExplode) {
            this.explodeTime -= timeDelta;
            return;
        }
        this.timeToShoot -= timeDelta;
        if(this.timeToShoot <= 0)
            this.shouldFire = true;
        this.position.y += this.velocity.y * timeDelta;
        this.position.x += this.velocity.x * timeDelta;

        this.y += this.velocity.y * timeDelta;
        this.x += this.velocity.x * timeDelta;
    }

    draw(ctx) {
        ctx.drawImage(this.img,this.x, this.y);
    }

    explode() {
        fxExplode.play();
        this.velocity = new Vector(0,0);
        this.shouldExplode = true;
        this.explodeTime = EXPL_TIME_AST;
    }
}
/**
 * Class that renders sprites and draw them on canvas
 */
class Renderer {
        get player() {
            return this._player;
        }

        set player(value) {
            this._player = value;
        }
        constructor(canvas) {
            this._enemies  = {};
            this._asteroids = {};
            this._player = null;
            this._projectiles = {};
            this._canvas    = canvas;
            this._context   = this._canvas.getContext("2d");
            this._width     = this._canvas.width;
            this._height    = this._canvas.height;
            this.frame = 1;
        }

    /**
     * Function that draw whole game on canvas
     */
    redraw()
        {
            this._context.clearRect(0, 0,this._width, this._height);
            this._context.fillStyle = 'black';
            for (var id in this._enemies) {
                var enemy = this._enemies[id];
                if(enemy.shouldExplode) {
                    this.drawExplosion(enemy.position,enemy._radius);
                    continue;
                }
                this._context.save();
                enemy.draw(this._context);
                this._context.restore();
            }

            for (var id in this._projectiles) {
                var projectile = this._projectiles[id];
                this._context.save();
                projectile.draw(this._context);
                this._context.restore();
            }
            this._context.save();
            if(this.player.shouldExplode)
                this.drawExplosion(this.player.position,this.player._radius);
            else if(this.player.blink) {
                if(this.frame === 0)
                    this.player.draw(this._context, this.player.position.x, this.player.position.y, this.player.a);
                this.frame += 1;
                this.frame %= 15;
            } else
                this.player.draw(this._context, this.player.position.x, this.player.position.y, this.player.a);
            for (let i=0; i< this.player._lives; i++){
                this.player.draw(this._context, SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, "white");
            }

            for (let id in this._asteroids) {
                let asteroid = this._asteroids[id];
                if(asteroid.shouldExplode) {
                    this.drawExplosion(asteroid.position,asteroid._radius);
                } else
                    asteroid.draw(this._context);
            }

            this._context.restore();
        }

    /**
     * Function adds enemy to canvas
     * @param enemy
     */
    addEnemy(enemy)
        {
            this._enemies[enemy.id] = enemy;
        }

    /**
     * Function removes an enemy from canvas
     * @param enemy
     */
    removeEnemy(enemy)
        {
            delete this._enemies[enemy.id];
        }


    /**
     * Function add bullet to canvas
     * @param projectile
     */
    addBullet(projectile)
        {
            this._projectiles[projectile.id] = projectile;
        }

    /**
     * Function removes bullet from canvas
     * @param projectile
     */
        removeBullet(projectile)
        {
            delete this._projectiles[projectile.id];
        }

    drawExplosion(position,radius) {
        this._context.fillStyle = "darkred";
        this._context.beginPath();
        this._context.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2, false);
        this._context.fill();
        this._context.fillStyle = "red";
        this._context.beginPath();
        this._context.arc(position.x, position.y, radius * 1.3, 0, Math.PI * 2, false);
        this._context.fill();
        this._context.fillStyle = "yellow";
        this._context.beginPath();
        this._context.arc(position.x, position.y, radius * 1.0, 0, Math.PI * 2, false);
        this._context.fill();
        this._context.fillStyle = "white";
        this._context.beginPath();
        this._context.arc(position.x, position.y, radius * 0.7, 0, Math.PI * 2, false);
        this._context.fill();
    }
}

/**
 * Class recording keybord input
 */
class InputHandeler {
        get down() {
            return this._down;
        }

        set down(value) {
            this._down = value;
        }
        constructor() {
            this._down = {};
            var _this = this;

            document.addEventListener("keydown", function(evt) {
                if(evt.keyCode <= 40)
                    evt.preventDefault();
                _this._down[evt.keyCode] = true;
            });
            document.addEventListener("keyup", function(evt) {
                if(evt.keyCode <= 40)
                    evt.preventDefault();
                delete  _this._down[evt.keyCode];
            });
        }

    /**
     * Is key with keyCode pressed?
     * @param keyCode
     * @returns {*}
     */
    isDown(keyCode) {
            return this._down[keyCode];
        }
    }

/**
 * Main class representing the whole game
 */
class Main {
    get player() {
        return this._player;
    }

    set player(value) {
        this._player = value;
    }

    constructor() {

        this.init();
    }

    init() {

        AST_MAX_SPEED = AST_MAX_SPEED_CON;
        AST_NUM = AST_NUM_CON;
        AST_ADDED = AST_ADDED_CON;
        ENEMY_SPAWN_TIME = ENEMY_SPAWN_TIME_CON;

        this.time = new Date().getTime();

        this.newEnemyTime = 5;

        this.level = 1;

        this.canvas = document.getElementById("canvas");
        this.canvasBuff = document.getElementById("canvas_buff");
        this.inputHandeler = new InputHandeler();

        this.renderer = new Renderer(this.canvasBuff);

        this.gameOver = false;

        this.enemyCount = 0;
        this.enemies = {};

        this._player = null;

        this.projectileCount = 0;
        this.projectiles = {};

        this.asteroids = [];

        this.frames = 0;

        this.pause = false;
    }

    /**
     * Adds an enemy
     * @param enemy
     */
    addEnemy(enemy) {
        this.enemies[enemy.id] = enemy;
        this.renderer.addEnemy(enemy);
        ++this.enemyCount;
    }

    /**
     * Removes an enemy
     * @param enemy
     */
    removeEnemy(enemy) {
        delete this.enemies[enemy.id];
        this.renderer.removeEnemy(enemy);
        //--this.enemyCount;

    }

    /**
     * Adds a bullet
     * @param projectile
     */
    addBullet(projectile) {
        fxLaser.play();
        this.projectiles[projectile.id] = projectile;
        this.renderer.addBullet(projectile);
        ++this.projectileCount;
    }

    /**
     * Removes a bullet
     * @param projectile
     */
    removeBullet(projectile) {
        delete this.projectiles[projectile.id];
        this.renderer.removeBullet(projectile);
    }

    /**
     * Set up the initial game state
     */
    initGame() {
        this.init();
        $('#new_game').fadeIn(1000);
        $('#new_game').fadeOut(1000);
        $('#gameover').fadeOut(0);
        this._player = new PlayerSprite(this.canvas.width / 2,this.canvas.height / 2, this.canvas);
        this.nextWave();
        this.renderer._asteroids = this.asteroids;
        this.player.blinking();
        this.renderer._player = this._player;


    }

    nextLevel() {
        this.level += 1;
        AST_MAX_SPEED *= 1.3;
        AST_ADDED += 1;
        AST_NUM += AST_ADDED;
        ENEMY_SPAWN_TIME *= 0.8;
        this.newEnemyTime = 5;
        this.nextWave();
        this.player.blinking();
        $('#next_level').html("Level " + this.level);
        $('#next_level').fadeIn(1000);
        $('#next_level').fadeOut(1000);
    }

    newEnemy() {
        let x = 20 + Math.random() * (this.canvas.width - 40);
        let y = 20 + Math.random() * (this.canvas.height - 40);
        let enemy = new EnemySprite(x,y,this.enemyCount,this.canvas);
        this.addEnemy(enemy);
    }

    nextWave() {
        $('#level').html(this.level);
        for (let i = 0; i < AST_NUM; i++) {
            let x = 20 + Math.random() * (this.canvas.width - 40);
            let y = 20 + Math.random() * (this.canvas.height - 40);
            let radius = 20 + Math.random() * 100;
            this.asteroids.push(new AsteroidSprite(x, y, this.canvas,radius));
        }
    }

    /**
     * Main game loop
     */
    run() {
        var _this = this;
        var ctx = _this.canvas.getContext("2d");
        var loop = function () {
            _this.update();
            _this.renderer.redraw();
            if(_this.pause) {
                ctx.clearRect(0, 0, _this.canvasBuff.width, _this.canvasBuff.height);
                ctx.fillStyle = "White";
                ctx.font = "100px Georgia";
                ctx.fillText("Pause",_this.canvas.width / 2 - 120,_this.canvas.height / 2 - 75);
                ctx.font = "40px Georgia";
                ctx.fillText("Use arrows to move, SPACE to shoot and T to teleport",70,_this.canvas.height / 2);
                ctx.fillText("Teleport has 10 seconds cooldown",_this.canvas.width / 2 - 270,_this.canvas.height / 2 + 50);
                ctx.fillText("Press ESC to pause/unpause",_this.canvas.width / 2 - 230,_this.canvas.height / 2 + 100);
                ctx.fillText("Press R to restart",_this.canvas.width / 2 - 140,_this.canvas.height / 2 + 150);
            } else {
                ctx.clearRect(0, 0, _this.canvasBuff.width, _this.canvasBuff.height);
                ctx.drawImage(_this.canvasBuff, 0, 0);
            }
            window.requestAnimationFrame(loop, _this.canvas);
        };
        window.requestAnimationFrame(loop, this.canvas);
    }

    /**
     * Update the state of the game and sprites and draw it on canvas
     */
    update() {
        let projectile;
        let id;
        if(this.inputHandeler.isDown(82))
            this.initGame();
        if(this.inputHandeler.isDown(27)) {
            delete this.inputHandeler._down[27];
            if(this.pause) {
                this.pause = false;
            } else {
                this.pause = true;
            }
        }
        let thisFrame = new Date().getTime();
        if(this.frames !== 0)
            this.frames -= 1;
        let delta = thisFrame - this.time;
        this.time = thisFrame;
        if(this.pause)
            return;
        if (this.gameOver !== true) {
            if (this._player._lives < 0) {
                this.gameOver = true;
                $('#gameover').fadeIn(2000);
                return;
            }
            if(this.asteroids.length === 0) {
                this.nextLevel();
            }
            this.newEnemyTime -= delta / 1000;
            if(this.newEnemyTime <= 0) {
                this.newEnemy();
                this.newEnemyTime = ENEMY_SPAWN_TIME;
            }
            this._player.update(delta / 1000, this.inputHandeler);
            if (this._player.shouldFire === true) {
                this._player.shouldFire = false;
                delete this.inputHandeler.down[32];
                if(this.frames !== 0 )
                    return;
                this.frames = 15;
                let projectile = new BulletSprite(this._player.position.x + 4 / 3 * this._player._radius * Math.cos(this._player.a),
                    this._player.position.y - 4 / 3 * this._player._radius * Math.sin(this._player.a), this.projectileCount,
                    400 * Math.cos(this._player.a) / 60,
                    -400 * Math.sin(this._player.a) / 60, this.canvas, 0);
                this.addBullet(projectile);
            }
            $('#player_score').html(this._player._score);
            for (id in this.projectiles) {
                projectile = this.projectiles[id];
                projectile.update(delta, this.inputHandeler);
                if (projectile.isOutside()) {
                    this.removeBullet(projectile);
                }
            }
        }


        for (id in this.enemies) {
            let enemy = this.enemies[id];

            enemy.update(delta/1000, this.inputHandeler);
            if(enemy.isOutside())
                this.removeEnemy(enemy);
            if(enemy.shouldExplode && enemy.explodeTime <= 0) {
                this.removeEnemy(enemy);
            }
            if (enemy.shouldFire === true) {
                enemy.shouldFire = false;
                enemy.timeToShoot = ENEMY_SHOOT;
                let dX = MyMath.dX(this.player.position,enemy.position) / 100;
                let dY = MyMath.dY(this.player.position,enemy.position,) / 100;
                if(Math.abs(dX) < 2 && Math.abs(dY)) {
                    dX *= 2;
                    dY *= 2;
                }
                projectile = new BulletSprite(enemy.position.x + (enemy._width / 2), enemy.position.y, this.projectileCount,
                    dX,
                    dY, this.canvas, 1);
                this.addBullet(projectile);
            }
        }

        for (let id in this.asteroids) {
            let asteroid = this.asteroids[id];
            asteroid.update(delta / 1000, this.inputHandeler,this.asteroids);
            //this.renderer._asteroids = this.asteroids;
        }

        // Check collisions between player, enemies, and projectiles
        this.checkCollisions();
    }


    /**
     * Check if any collision of bullets with sprites appear
     * and resolve possible collisions
     */
    checkCollisions() {
        if(!this.player.blink && !this.player.shouldExplode) {
            for (let id in this.asteroids) {
                var asteroid = this.asteroids[id];
                if(asteroid.shouldExplode)
                    continue;
                if (MyMath.distance(asteroid.position, this.player.position) < asteroid._radius + this.player._radius) {
                    asteroid.destroy(this.asteroids);
                    this.player._lives--;
                    this.player._score += 100;
                    this.player.explode();

                }
            }

            for (let id in this.enemies) {
                var enemy = this.enemies[id];
                if(enemy.shouldExplode)
                    continue;
                if (MyMath.distance(enemy.position, this.player.position) < enemy._radius + this.player._radius) {
                    enemy.explode();
                    this.player._lives--;
                    this.player._score += 500;
                    this.player.explode();

                }
            }
        }
        for (var id in this.projectiles) {
            var projectile = this.projectiles[id];

            if (projectile.type === 0) {
                for(let aid in this.asteroids) {
                    let asteroid = this.asteroids[aid];
                    if(MyMath.distance(asteroid.position,projectile.position) < asteroid._radius) {
                        asteroid.destroy(this.asteroids);
                        this.player._score += 100;
                        this.removeBullet(projectile);
                    }
                }
                for (var eid in this.enemies) {
                    var enemy = this.enemies[eid];

                    if(MyMath.distance(enemy.position,projectile.position) < enemy._radius) {
                        enemy.explode();
                        this.removeBullet(projectile);
                        this.player._score += 500;
                    }
                }
            } else if(!this.player.blink && !this.player.shouldExplode && MyMath.distance(this.player.position,projectile.position) < this.player._radius) {
                this.removeBullet(projectile);
                this.player._lives--;
                this.player.explode();
            }

        }
    }

}
