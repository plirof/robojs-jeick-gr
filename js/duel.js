ANIMATIONS = {
    robotExplosion: {
        duration: 1000,
        frames: []
    },
    bulletExplosion: {
        duration: 500,
        frames: []
    }
};

for(var i=1;i<=71;i++) {
    ANIMATIONS.robotExplosion.frames.push(document.getElementById('explosion2-'+i));
}

for(var i=1;i<=6;i++) {
    ANIMATIONS.bulletExplosion.frames.push(document.getElementById('explosion2-'+i));
}

for(var i=6;i>=1;i--) {
    ANIMATIONS.bulletExplosion.frames.push(document.getElementById('explosion2-'+i));
}

var Duel = function(robot1File, robot2File, rounds) {
    this.width = 800;
    this.height = 600;
    this.boundingBox = new Rect(0,0,this.width, this.height);
    this.ticksPerSecond = 1;
    this.rounds = rounds;
    this.currentRound = 0;
    this.message = '';
    
    this.robots = [
        new RobotHandler(this, robot1File),
        new RobotHandler(this, robot2File)
    ];
    
    this.bullets = [];
    
    this.explosions = [ ];
    
  
    this.running = false;

    this.lastDrawCall = 0;
    var duel = this;
    window.requestAnimationFrame( function(time) {
        duel.draw(time);
    });
};

Duel.prototype.start = function() {
    this.running = true;
    this.robots.forEach(function(robot) {
        robot.loadWorker();
    });
}

Duel.prototype.checkReady = function() {
    var allReady = true;
    this.robots.forEach(function(robot) {
        if(!robot.isReady)
            allReady = false;
    });
                        
    if(allReady) {
        this.startRound();
    }
}

Duel.prototype.startRound = function() {
    this.robots.forEach(function(robot, index) {
        robot.resetRobot(300 + 100*index+1, this.height/2);
    }, this);
    
    
    this.robots[0].data.x = 400;
    this.robots[0].data.y = 400;
    this.robots[1].data.x = 600;
    this.robots[1].data.y = 400;
    
    this.explosions = [];
    this.bullets = [];
    this.currentRound++;
    this.message = 'Round ' + this.currentRound;
    var duel = this;
    setTimeout(function() {
        duel.message = '';
    }, 1000);
    this.running = true;
    this.run();
}

Duel.prototype.run = function() {
    if(!this.running) {
        return;
    }
    
    var tickTime = 1000/this.ticksPerSecond;
    //this.draw();
    this.update();
    
    var duel = this;
    window.setTimeout(function() {
        duel.run();   
    }, tickTime);
}

Duel.prototype.update = function() {
    this.bullets.forEach(function(bullet) {
        bullet.advance();
    });
    
    this.robots.forEach(function(robot) {
        robot.collisions = [];
    });
    
    this.robots.forEach(function(robot) {
        robot.tick();
        robot.advanceRobot();
    });
                        
    for(var i=0;i<this.robots.length;i++) {
        for(var j=i+1;j<this.robots.length;j++) {
            this.robots[i].checkCollision(this.robots[j]);   
        }
    }
    
    this.robots.forEach(function(robot) {
        robot.updateClient();
    });
    
    this.robots.forEach(function(robot) {
        robot.scan();
    });
    
    this.testRoundEnd();
}

Duel.prototype.bulletHitWall = function(bullet) {
    this.explosions.push(new Animation(bullet.x, bullet.y, ANIMATIONS.bulletExplosion.frames, ANIMATIONS.bulletExplosion.duration));
    var index = this.bullets.indexOf(bullet);
    this.bullets.splice(index, 1);
}

Duel.prototype.bulletHitRobot = function(bullet, robot) {
    this.explosions.push(new Animation(bullet.x, bullet.y, ANIMATIONS.bulletExplosion.frames, ANIMATIONS.bulletExplosion.duration));
    
    bullet.robot.power += 3 * bullet.power;
    
    robot.hitByBullet(bullet);
    
    var index = this.bullets.indexOf(bullet);
    this.bullets.splice(index, 1);
}

Duel.prototype.robotDie = function(robot) {
    this.explosions.push(new Animation(robot.data.x, robot.data.y, ANIMATIONS.robotExplosion.frames, ANIMATIONS.robotExplosion.duration));
}

Duel.prototype.testRoundEnd = function() {
    var robotsAlive = this.robots.filter(function(robot) {
        return robot.alive; 
    });
    
    var deadRobotsBullets = this.bullets.filter(function(bullet) {
        return !bullet.robot.alive; 
    });
    
    if(robotsAlive.length <= 1 && deadRobotsBullets.length == 0) {
        if(robotsAlive.length > 0) {
            this.message = 'Robot ' + robotsAlive[0].name + " wins!";
            robotsAlive[0].win();
        } else {
            this.message = 'Draw!';
        }
        
        this.running = false;
        var duel = this;
        
        if(this.currentRound < this.rounds) {
            setTimeout(function() {
                duel.startRound();
            }, 1000);
        } else {
            this.message += ' <br>Final Score: ' + this.robots[0].wins + ":" + this.robots[1].wins;
        }
    }
}

Duel.prototype.draw = function(time) {
    var duel = this;
    window.requestAnimationFrame( function(time) {
        duel.draw(time);
    });
    
    var deltaMS = (this.lastDrawCall==0)?0:time - this.lastDrawCall;
    this.lastDrawCall = time;
    
    var c = document.getElementById("arena");
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(0,0,this.width, this.height);
    var tankImg = document.getElementById("tank");
    var gunImg = document.getElementById("gun");
    var radarImg = document.getElementById("radar");
    
    this.robots.forEach(function(robot) {
        if(robot.alive) {
            ctx.save();

            ctx.translate(robot.data.x, robot.data.y);

            ctx.save();
                ctx.rotate(robot.data.angle);
                ctx.drawImage(
                    tankImg, 
                    -CONSTANTS.robotWidth/2,
                    -CONSTANTS.robotHeight/2);
            ctx.restore();

            ctx.save();
                ctx.rotate(robot.data.gunAngle);
                ctx.drawImage(
                    gunImg, 
                    -CONSTANTS.gunOffsetX,
                    -CONSTANTS.gunOffsetY);
            ctx.restore();

            ctx.save();
                ctx.rotate(robot.data.radarAngle);
                ctx.drawImage(
                    radarImg, 
                    -CONSTANTS.radarOffsetX,
                    -CONSTANTS.radarOffsetY);
            ctx.restore();

            ctx.restore();
        }
    });
    this.explosions.forEach(function(animation) {
        var image = animation.advance(deltaMS);
        if(image != null) {
            ctx.drawImage(
                    image, 
                    animation.x,
                    animation.y);
        } else {
            this.explosions.splice(this.explosions.indexOf(animation),1);
        }
    }, this);
    
    ctx.fillStyle = "#ff0000";
    this.bullets.forEach(function(bullet) {
        var bulletRadius = 1 + (bullet.power);
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bulletRadius, 0, Math.PI*2);
        ctx.fill();
    });
    
    document.getElementById('message').innerHTML = this.message;
    
    this.updateRobotStats(this.robots[0], 'r1_');
    this.updateRobotStats(this.robots[1], 'r2_');
}

Duel.prototype.updateRobotStats = function(robot, prefix) {
    document.getElementById(prefix + 'name').innerText = robot.name;
    document.getElementById(prefix + 'power').innerText = robot.data.power;
    document.getElementById(prefix + 'wins').innerText = robot.wins;
}

Animation = function(x,y,frames, duration) {
    this.x = x - frames[0].width/2;
    this.y = y - frames[0].height/2;
    this.frames = frames;
    this.msPerFrame = duration / this.frames.length;
    
    this.framePointer = 0;
    this.msLeftInFrame = this.msPerFrame;
}

Animation.prototype = {
    advance : function(deltaMS) {
        this.msLeftInFrame -= deltaMS;
        while(this.msLeftInFrame < 0) {
            this.framePointer++;
            this.msLeftInFrame += this.msPerFrame;
        }
        
        if(this.framePointer < this.frames.length) {
            return this.frames[this.framePointer];
        } else {
            return null;   
        }
    }
}