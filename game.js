function sketchProc(processing) {
/*2D interactive comet simulator. Author Jiri Roznovjak*/
var WIDTH = 800;
var HEIGHT = 600;
processing.size(WIDTH,HEIGHT);
document.getElementById('canvas').style.width = WIDTH;
document.getElementById('canvas').style.height = HEIGHT;
document.getElementById('select').style.left = WIDTH+10;
var ARROW = processing.loadImage('arrow.png'); //260x260px
var G = 1000; //gravitational constant
var DRAGGING = false;
var PRESSPOINT;
var STARS,COMETS;
var MAIN_ANIMATION = true;

var Button = function (text,x,y) {
    this.text = text;
    this.position = new processing.PVector(x,y);
    this.width = 0;
    this.height = 0;
    this.color = new processing.color(100,100,100);
    this.textColor = new processing.color(0,0,0);
    this.opacity = 100;
};

Button.prototype.action = function () {
};

Button.prototype.display = function () {
    processing.fill(this.color,this.opacity);
    processing.rect(this.position.x,this.position.y,this.width,this.height);
    processing.textSize(14);
    processing.stroke(this.textColor);
    processing.text(this.text,this.position.x,this.position.y);

};

Button.prototype.checkMouseIn = function (mX,mY) {
    if (mX > this.position.x && mX < this.position.x + this.width &&
        my > this.position.y && mY < this.position,y - this.height) {
        return true;
    }
};

//general particle with physics methods applied to it
var Particle = function () {
    this.position = new processing.PVector(0,0);
    this.velocity = new processing.PVector(0,0);
    this.acceleration = new processing.PVector(0,0);
    this.mass = 1;
    this.radius = 1;
    this.color = processing.color(255,255,255);
    this.opacity = 255;
    this.alive = true;
};

Particle.prototype.run = function () {
    this.update();
    this.display();
};

Particle.prototype.update = function () {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
};

//displays a simple circular object
Particle.prototype.display = function () {
    processing.noStroke();
    processing.fill(this.color,this.opacity);
    processing.ellipse(this.position.x,this.position.y,
                       this.radius*2,this.radius*2);
};

//force as a PVector
Particle.prototype.applyForce = function (force) {
    force.div(this.mass);
    this.acceleration.add(force);
};

Particle.prototype.calculateAttraction = function (object) {
    var force = PVector.sub(object.position,this.position);
    var distance = force.mag();
    if (distance < 10) {distance = 10;}
        force.normalize();
        var strength = (G * this.mass * object.mass) /
                       (distance * distance);
        force.mult(strength);
        return force;
};

var Star = function(x,y,velx,vely,mass) {
    Particle.call(this);
    this.position = new processing.PVector(x,y);
    this.velocity = new processing.PVector(velx,vely);
    this.color = processing.color(255,255,50);
    this.opacity = 50;
    this.mass = mass;
};

Star.prototype = Object.create(Particle.prototype);

Star.prototype.display = function () {
    this.radius = 15 + 3*this.mass;
    processing.noStroke();
    for (var rad=0;rad<this.radius;rad++) {
        processing.fill(this.color,this.opacity);
        processing.ellipse(this.position.x,this.position.y,rad*2,rad*2);
    }
};

//mestes star2 into this star, if star2 is smaller
//(to prevent duplicate merging)
Star.prototype.merge = function (star2) {
    if (this.mass < star2.mass) {
        return
    }
    var distance = calculateDistance(this.position,star2.position);
    if (distance < this.radius + star2.radius) {
        this.mass += star2.mass;
        star2.alive = false;
        var adVel = star2.velocity;
        adVel.mult(star2.mass/this.mass);
        this.velocity.add(adVel);
    }
};

//comet consists of a body and a tail of particles
var Comet = function(x,y,velx,vely) {
    Particle.call(this);
    this.position = new processing.PVector(x,y);
    this.velocity = new processing.PVector(velx,vely);
    this.radius = 4;
    this.mass = 100;
    this.tail = new Tail();
};

Comet.prototype = Object.create(Particle.prototype);

Comet.prototype.runCometAndTail = function (star) {
    if (this.isAlive()) {
        this.run(star);
    }
    this.runTail(star);
};

Comet.prototype.run = function (star) {
    var gravity = this.calculateAttraction(star);
    this.applyForce(gravity);
    this.update(star);
    this.display();
};

Comet.prototype.runTail = function (star) {
    var opacity = this.determineDustOpacity(star);
    if (this.isAlive()) {
        this.tail.addDust(this.position.x,this.position.y,opacity);
    }
    this.tail.update();
    this.decreaseMass(star);
};

Comet.prototype.update = function (star) {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    this.radius = 1 + 2*(this.mass/100);
    if (this.checkInStar(star) || this.checkOffScreen()) {
        this.alive = false;
    }
};

Comet.prototype.checkOffScreen = function () {
    return (this.position.x < -100 || this.position.x > WIDTH + 100 ||
        this.position.y < -100 || this.position.y > HEIGHT + 100);
};

Comet.prototype.checkInStar = function (star) {
    return (calculateDistance(this.position,star.position) < star.radius);
};

//the closer the comet is to a star, the more opaque
//its tail is
Comet.prototype.determineDustOpacity = function (star) {
    var distance = calculateDistance(this.position,star.position);
    var opacity = 200 * (150 / distance);
    if (opacity > 200) {opacity = 200;}
    return opacity;
};

 //decreases comet's mass based on its proximity to the star
Comet.prototype.decreaseMass = function (star) {
    var distance = calculateDistance(this.position,star.position);
    this.mass -= 2000 / (distance*distance);
    if (this.mass == 0) {this.mass = -1;}
};

Comet.prototype.isAlive = function () {
    if (!this.alive) {
        return false;
    }
    return true;
};

var Tail = function () {
    this.dustArray = [];
};

Tail.prototype.addDust = function (x,y,opacity) {
    for (var i=0;i<5/STARS.length;i++) {
        this.dustArray.push(new DustParticle(x,y,opacity));
    }
};

Tail.prototype.update = function () {
    for (var i=0; i<this.dustArray.length;i++) {
        this.dustArray[i].run();
        if (this.dustArray[i].checkInvisible()) {
            this.dustArray.splice(i,1);
        }
    }
};

var DustParticle = function(x,y,opacity) {
    Particle.call(this);
    this.position = new processing.PVector(x,y);
    var vx = (Math.random()-0.5) * 0.6;
    var vy = (Math.random()-0.5) * 0.6;
    this.velocity = new processing.PVector(vx,vy);
    this.color = processing.color(220,220,220);
    this.opacity = opacity;
    this.radius = 3;
    this.drift = 0.95;
};

DustParticle.prototype = Object.create(Particle.prototype);

DustParticle.prototype.run = function () {
    this.update();
    this.opacity -= 4;
    this.display();
};

DustParticle.prototype.update = function () {
    Particle.prototype.update.call(this);
    this.velocity.mult(this.drift);
};


DustParticle.prototype.checkInvisible = function () {
    return (this.opacity < 0);
};

/////////////////////////

var createObject = function (object) {
    var currentPoint = getCurrentMouse();
    var velocity = PVector.sub(PRESSPOINT,currentPoint);
    velocity.div(40);
    return new object(PRESSPOINT.x,PRESSPOINT.y,
                      velocity.x,velocity.y);
};

var createComet = function () {
    var currentPoint = getCurrentMouse();
    var velocity = PVector.sub(PRESSPOINT,currentPoint);
    velocity.div(40);
    COMETS.push(new Comet(PRESSPOINT.x,PRESSPOINT.y,
                              velocity.x,velocity.y));
};

var createStar = function () {
    var currentPoint = new processing.PVector(processing.mouseX,
                                              processing.mouseY);
    var velocity = PVector.sub(PRESSPOINT,currentPoint);
    velocity.div(40);
    STARS.push(new Star(processing.mouseX,processing.mouseY,velocity.x,velocity.y,1));
};

/////////////////////////


var displayArrow = function () {
    var distance = calculateDistance(PRESSPOINT,getCurrentMouse());
    var angle = calculateAngle(PRESSPOINT,getCurrentMouse());
    angle -= Math.PI/4;
    //constraining distance
    if (distance > 120) {distance = 120;}
    var size = (distance / Math.sqrt(2))*1.1;
    //if size is 0 it automatically displays a full scale image
    if (size == 0) {size = 1;}
    processing.pushMatrix();
    processing.translate(PRESSPOINT.x,PRESSPOINT.y);
    processing.rotate(angle);
    processing.image(ARROW,0,0,size,size);
    processing.popMatrix();
};

var calculateAngle = function (point2,point1) {
    var angle = 0;
    var dx = point1.x - point2.x;
    var dy = point1.y - point2.y;
    if (dx < 0) {angle -= Math.PI;}
    angle += Math.atan(dy/dx);
    return angle;
};

var calculateDistance = function (position1,position2) {
    var dir = PVector.sub(position2,position1);
    return dir.mag();
};

var setupAnimation = function (scenario) {
    CREATING = false;
    COMETS = [];
    switch (scenario) {
        case "0": //one star in the middle
            STARS = [new Star(WIDTH/2,HEIGHT/2,0,0,2)];
            break;
        case "1": //binary with two same stars
            var sideVelocitySmall = Math.random()*0.5 + 1;
            STARS = [new Star(WIDTH/2,HEIGHT/2-200,sideVelocitySmall,0,2),new Star(WIDTH/2,HEIGHT/2+200,-sideVelocitySmall,0,2)];
            break;
        case "2": //one massive and two dwarf stars
            var sideVelocitySmall = Math.random()*0.5 + 1;
            var sideVelocityBig = 6;
            STARS = [new Star(WIDTH/2,HEIGHT/2,0,0,8),new Star(WIDTH/2-40,HEIGHT/2-250,sideVelocityBig,-sideVelocitySmall,0.15),new Star(WIDTH/2+30,HEIGHT/2-250,sideVelocityBig,sideVelocitySmall,0.15)];
            break;
        case "3": //create mode
            STARS = [];
            CREATING = true;
            break;
        case '4': //massive binary
            var sideVelocitySmall = Math.random()*0.5 + 2.5;
            STARS = [new Star(WIDTH/2,HEIGHT/2-200,sideVelocitySmall,0,7),new Star(WIDTH/2,HEIGHT/2+200,-sideVelocitySmall,0,7)];
            break;
        default: //binary
            var sideVelocitySmall = Math.random()*0.5 + 1;
            STARS = [new Star(WIDTH/2,HEIGHT/2-200,sideVelocitySmall,0,2),new Star(WIDTH/2,HEIGHT/2+200,-sideVelocitySmall,0,2)];
            break;
    }
};

var Animation = function () {
    this.stars = [];
    this.comets = [];
};

Animation.prototype.setup = function (scenario) {
    CREATING = false;
    this.comets = [];
    switch (scenario) {
        case "0": //one star in the middle
            this.stars = [new Star(WIDTH/2,HEIGHT/2,0,0,2)];
            break;
        case "1": //binary with two same stars
            var sideVelocitySmall = Math.random()*0.5 + 1;
            STARS = [new Star(WIDTH/2,HEIGHT/2-200,sideVelocitySmall,0,2),new Star(WIDTH/2,HEIGHT/2+200,-sideVelocitySmall,0,2)];
            break;
        case "2": //one massive and two dwarf stars
            var sideVelocitySmall = Math.random()*0.5 + 1;
            var sideVelocityBig = 6;
            this.stars = [new Star(WIDTH/2,HEIGHT/2,0,0,8),new Star(WIDTH/2-40,HEIGHT/2-250,sideVelocityBig,-sideVelocitySmall,0.15),new Star(WIDTH/2+30,HEIGHT/2-250,sideVelocityBig,sideVelocitySmall,0.15)];
            break;
        case "3": //create mode
            this.stars = [];
            CREATING = true;
            break;
        case '4': //massive binary
            var sideVelocitySmall = Math.random()*0.5 + 2.5;
            this.stars = [new Star(WIDTH/2,HEIGHT/2-200,sideVelocitySmall,0,7),new Star(WIDTH/2,HEIGHT/2+200,-sideVelocitySmall,0,7)];
            break;
        default: //binary
            var sideVelocitySmall = Math.random()*0.5 + 1;
            this.stars = [new Star(WIDTH/2,HEIGHT/2-200,sideVelocitySmall,0,2),new Star(WIDTH/2,HEIGHT/2+200,-sideVelocitySmall,0,2)];
            break;
    }
};

Animation.prototype.mainloop = function () {
    processing.background(18,24,64);
    for (var i=0; i<this.comets.length;i++) {
        for (var j=0; j<this.stars.length; j++) {
            this.comets[i].runCometAndTail(this.stars[j]);
        }
    }
    for (var i=0; i<this.stars.length; i++) {
        for (var j=0; j<this.stars.length; j++) {
            if (j!=i) {
                var gravity = this.stars[i].calculateAttraction(this.stars[j]);
                this.stars[i].applyForce(gravity);
                this.stars[i].merge(this.stars[j]);
            }
        }
        this.stars[i].run();
        if (!this.stars[i].alive) {
            this.stars.splice(i,1);
            if (i != this.stars.length) {
                i--;
            }
        }
    }
};

var getCurrentMouse = function () {
    return new processing.PVector(processing.mouseX,processing.mouseY);
    }

processing.draw = function () {
    if (RESET) {
        ANIMATION.setup(SCENARIO);
        RESET = false;
    }
    if (MAIN_ANIMATION) {
        ANIMATION.mainloop();
    }
    if (DRAGGING) {
        displayArrow();
    }
};

processing.mousePressed = function () {
    PRESSPOINT = new processing.PVector(processing.mouseX,processing.mouseY);
    DRAGGING = true;
};

processing.mouseReleased = function () {
    if (CREATING) {
        createStar();
    }
    else if (MAIN_ANIMATION) {
        createComet();
    }
    DRAGGING = false;
};
var ANIMATION = new Animation();
ANIMATION.setup(SCENARIO);
}
var canvas = document.getElementById("canvas");
var p = new Processing(canvas, sketchProc);
