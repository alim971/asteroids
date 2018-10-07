$(document).ready(function(){
    var main = new Main();
    main.initGame();
    main.run();
});

let updateLogic = false;
let direction = 1;
let enemySpeed = 6;
let enemyDownMove = 0;

var invader = new Image();
invader.src = "images/alien.png";


var ship = new Image();
ship.src = "images/ship1.png";

var bullet = new Image();
bullet.src = "images/eprojectile.png";

/**
 * Basic class for Sprite representation
 */
class Sprite {
        get height() {
            return this._height;
        }

        set height(value) {
            this._height = value;
        }
        get width() {
            return this._width;
        }

        set width(value) {
            this._width = value;
        }
        get speed() {
            return this._speed;
        }

        set speed(value) {
            this._speed = value;
        }
        get id() {
            return this._id;
        }

        set id(value) {
            this._id = value;
        }
        get y() {
            return this._y;
        }

        set y(value) {
            this._y = value;
        }
        get x() {
            return this._x;
        }

        set x(value) {
            this._x = value;
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
        constructor(x,y,id,img, width, height,speed,canvas) {
            this._x = x;
            this._y = y;
            this._id = id;

            this.img = img;
            this._speed = speed;
            this._width = width;
            this._height = height;
            this.canvas = canvas;
        }

    /**
     * Update function that caffect behavior of the sprite
     * @param timeDelta
     * @param input
     */
    update(timeDelta, input) {
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
        constructor(x,y,id,canvas) {
            super(x,y,id,ship,30,16,5,canvas);
            this._score = 0;
            this._lives = 3;
            this._shouldFire = false;
        }

        update(timeDelta,input) {
            if (input.isDown(39)){
                if (this.x + (this._width + 6) <= this.canvas.width){
                    this.x += this._speed;
                }
            }

            if (input.isDown(37)){
                if (this.x - 6 >= 0){
                    this.x -= this._speed;
                }
            }

            if (input.isDown(32)) {
                this._shouldFire = true;
                delete input.down[32];
            }
        }
    }

/**
 * Class representing aliens
 */
    class EnemySprite extends Sprite{
        get time() {
            return this._time;
        }

        set time(value) {
            this._time = value;
        }
        get shouldFire() {
            return this._shouldFire;
        }

        set shouldFire(value) {
            this._shouldFire = value;
        }
        constructor(x,y,id,canvas) {
            super(x,y,id,invader,20,16,6,canvas);
            this.delay = 720;
            this._time = 0;
            this._shouldFire = false;
            this.down = 0;
            this.direction = 1;
        }

        update(timeDelta) {
            this._time += timeDelta;

            if (this._time >= this.delay){

                // Randomly shoot,the faster, the more they fire.
                var fireTest = Math.floor(Math.random() * (this.delay + 1));

                if (fireTest < (this.delay / 200)){
                    this._shouldFire = true;
                }

                if (this.x + (this._width + 6) >= this.canvas.width && direction === 1){
                    updateLogic = true;
                }
                else if(this.x - 6 <= 0 && direction !== 1){
                    updateLogic = true;
                }

                this.x += enemySpeed;
                if(this.down === 3) {
                    this.direction *= (-1);
                    this.down = -1;
                } else
                    this.y += (enemySpeed / 2)* this.direction;
                this.down++;
                this._time = 0;
            }

            this.y += enemyDownMove;
        };
    }

/**
 * Class representing bullets
 */
class BulletSprite extends Sprite{
        constructor(x,y,id,speed,canvas) {
            super(x,y,id,bullet,30,0,speed,canvas);
            this.delay = 500;
            this.time = 0;
        }

        update(timeDelta) {
            this.time += timeDelta;
            this.y -= this._speed;
            if (this.time >= this.delay){
                this.time = 0;
            }
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
            this._player = null;
            this._projectiles = {};
            this._canvas    = canvas;
            this._context   = this._canvas.getContext("2d");
            this._width     = this._canvas.width;
            this._height    = this._canvas.height;
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
                this._context.save();
                this._context.drawImage(enemy.img, enemy.x, enemy.y);
                this._context.restore();
            }

                this._context.save();
                this._context.drawImage(this.player.img, this.player.x, this.player.y);

                for (let i=0; i<= this.player._lives; i++){
                    this._context.drawImage(this.player.img, (this._width / 2) + 180 + (i * 38), 10);
                }

                this._context.restore();

            for (var id in this._projectiles) {
                var projectile = this._projectiles[id];
                this._context.save();
                this._context.drawImage(projectile.img, projectile.x, projectile.y);
                this._context.restore();
            }
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
            this.canvas = document.getElementById("canvas");
            this.canvasBuff = document.getElementById("canvas_buff")
            this.inputHandeler = new InputHandeler()

            this.renderer = new Renderer(this.canvasBuff);

            this.gameOver = false;
            this.wave = -1;

            this.enemyCount = 0;
            this.enemies = {};

            this._player = null;

            this.projectileCount = 0;
            this.projectiles = {};
            this.initGame();
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
            --this.enemyCount;

            if (this.enemyCount === 0) {
                this.nextWave();
            }
        }

    /**
     * Adds a bullet
     * @param projectile
     */
    addBullet(projectile) {
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
            this._player = new PlayerSprite(10, this.canvas.height - 30, 0, this.canvas);
            this.renderer._player = this._player;

            this.nextWave();
        }

    /**
     * Create new wave of aliens
     */
    nextWave() {
            this.wave++;
            for (let i = 0; i <= 11; i++) {
                for (let j = 0; j <= 6; j++) {
                    var enemy = new EnemySprite(10 + (i * 34), 40 + (j * 25), this.enemyCount, this.canvas);
                    this.addEnemy(enemy);
                }
            }
        }

    /**
     * Main game loop
     */
    run() {
            var _this = this;
            var loop = function () {
                _this.update();
                _this.renderer.redraw();
                _this.canvas.getContext("2d").clearRect(0, 0, _this.canvasBuff.width, _this.canvasBuff.height);
                _this.canvas.getContext("2d").drawImage(_this.canvasBuff, 0, 0);
                window.requestAnimationFrame(loop, _this.canvas);
            };
            window.requestAnimationFrame(loop, this.canvas);
        }

    /**
     * Update the state of the game and sprites and draw it on canvas
     */
    update() {
            if (this.gameOver !== true) {
                if (this._player._lives < 0 || this.enemyPassed()) {
                    this.gameOver = true;
                    $('#gameover').fadeIn(2000);
                }

                this._player.update(100, this.inputHandeler);
                if (this._player.shouldFire === true) {
                    this._player.shouldFire = false;
                    var projectile = new BulletSprite(this._player.x + (this._player._width / 2) - 6, this._player.y - 10, this.projectileCount, 5, this.canvas);
                    this.addBullet(projectile);
                }
                $('#player_score').html(this._player._score);
            }

            for (var id in this.projectiles) {
                var projectile = this.projectiles[id];
                projectile.update(100, this.inputHandeler);
            }

            if (updateLogic === true) {
                updateLogic = false;
                direction *= -1;
                enemySpeed *= -1;
                enemyDownMove = 10;
            }


            for (var id in this.enemies) {
                var enemy = this.enemies[id];
                enemy.delay = (this.enemyCount * 20) - (this.wave * 10);

                if (enemy.delay <= 80) {
                    enemy.delay = 80;
                }

                enemy.update(100, this.inputHandeler);

                if (enemy.shouldFire === true) {
                    enemy.shouldFire = false;
                    var projectile = new BulletSprite(enemy.x + (enemy._width / 2), enemy.y, this.projectileCount, -5, this.canvas);
                    this.addBullet(projectile);
                }
            }

            enemyDownMove = 0;

            // Check collisions between player, enemies, and projectiles
            this.checkCollisions();
        }

    /**
     * Check if any collision of bullets with sprites appear
     * and resolve possible collisions
     */
    checkCollisions() {
            for (var id in this.projectiles) {
                var projectile = this.projectiles[id];

                if (projectile.speed > 0) {
                    for (var eid in this.enemies) {
                        var enemy = this.enemies[eid];

                        if (this.isCollision(projectile,enemy)) {
                            this.removeEnemy(enemy);
                            this.removeBullet(projectile);
                            this.player._score += 100;
                        }
                    }
                } else if(this.isCollision(projectile,this.player)) {
                            this.removeBullet(projectile);
                            this.player._lives--;
                        }
                if (projectile.y <= 0 || projectile.y > this.canvas.height) {
                    this.removeBullet(projectile);
                }
            }
        }

    /**
     * Is there collision between sprite and sprite2?
     * @param sprite1
     * @param sprite2
     * @returns {boolean}
     */
        isCollision(sprite1,sprite2) {
            return sprite1.x >= sprite2.x && sprite1.x <= (sprite2.x + sprite2.width) && sprite1.y <= (sprite2.y + sprite2.height) && sprite1.y >= sprite2.y;
        }

        enemyPassed() {
            for (var eid in this.enemies) {
                var enemy = this.enemies[eid];
                if (enemy.y >= this._player.y)
                    return true;
            }
            return false;
        }
    }
