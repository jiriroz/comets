function sketchProc(processing) {
/*2D interactive comet simulator. Author Jiri Roznovjak*/
var WIDTH = 800;
var HEIGHT = 600;
processing.size(WIDTH,HEIGHT);
document.getElementById('canvas').style.width = WIDTH;
document.getElementById('canvas').style.height = HEIGHT;
var G = 1000; //gravitational constant
var DRAGGING = false;
var PRESSPOINT;

var Button = function (text,x,y) {
    this.text = text;
    this.position = new processing.PVector(x,y);
    this.width = 50;
    this.height = 30;
    this.color = processing.color(255,255,255);
    this.textColor = processing.color(255,255,255);
    this.highlightTextColor = processing.color(129,29,89);
    this.opacity = 80;
    this.highlighted = false;
};

Button.prototype.run = function () {
    if (this.checkMouseIn()) {
        this.highlighted = true;
    } else {
        this.highlighted = false;
    }
    this.display();
};


Button.prototype.display = function () {
    if (this.highlighted) {
        var textColor = this.highlightTextColor;
    } else {
        var textColor = this.textColor;
    }
    processing.fill(this.color,this.opacity);
    processing.rect(this.position.x,this.position.y,this.width,this.height);
    processing.fill(textColor);
    processing.textSize(16);
    processing.text(this.text,this.position.x+4,
                    this.position.y+2*this.height/3);
};

Button.prototype.checkMouseIn = function () {
    var mouse = getCurrentMouse();
    var mX = mouse.x;
    var mY = mouse.y;
    return (mX > this.position.x && mX < this.position.x + this.width &&
        mY > this.position.y && mY < this.position.y + this.height);
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
    if (this.mass === 0) {this.mass = -1;}
};

Comet.prototype.isAlive = function () {
    return this.alive;
};

var Tail = function () {
    this.dustArray = [];
};

Tail.prototype.addDust = function (x,y,opacity) {
    for (var i=0;i<4;i++) {
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

var Animation = function () {
    this.stars = [];
    this.comets = [];
    //260x260px
    this.arrowImage = processing.loadImage('arrow.png');
    this.reset = new Button("Reset",20,550);
    this.showInstructions = true;
};

Animation.prototype.setup = function () {
    this.comets = [];
    var sideVelocity = Math.random()*0.5 + 1;
    this.stars = [new Star(WIDTH/2,HEIGHT/2-200,sideVelocity,0,2),
                  new Star(WIDTH/2,HEIGHT/2+200,-sideVelocity,0,2)];
};

Animation.prototype.mainloop = function () {
    processing.background(18,24,64);
    if (this.showInstructions) {
        this.displayInstructions();
        return;
    }
    this.reset.run();
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
    if (DRAGGING) {
        this.displayArrow();
    }
};

Animation.prototype.displayInstructions = function () {
    processing.noStroke();
    processing.fill(255,255,255,30);
    processing.rect(0,0,WIDTH,HEIGHT);
    processing.fill(255,255,0,80);
    processing.rect(220,120,395,125,20);
    processing.fill(255,255,255);
    processing.textSize(40);
    processing.text("Comet Simulator",270,200);
    processing.textSize(20);
    processing.text("Drag mouse to create comet",287,300);
};

Animation.prototype.onMouseRelease = function () {
    if (this.showInstructions) {
        this.showInstructions = false;
    } else if (this.reset.checkMouseIn()) {
        this.setup();
    } else {
        this.createComet();
    }
};

Animation.prototype.createComet = function () {
    this.comets.push(this.createParticle(Comet));
};

Animation.prototype.createStar = function () {
    this.stars.push(this.createParticle(Star));
};

Animation.prototype.createParticle = function (object) {
    var currentPoint = getCurrentMouse();
    var velocity = PVector.sub(PRESSPOINT,currentPoint);
    velocity.div(40);
    return new object(PRESSPOINT.x,PRESSPOINT.y,
                      velocity.x,velocity.y);
};

Animation.prototype.displayArrow = function () {
    var distance = calculateDistance(PRESSPOINT,getCurrentMouse());
    var angle = calculateAngle(PRESSPOINT,getCurrentMouse());
    angle -= Math.PI/4;
    //constraining distance
    if (distance > 120) {distance = 120;}
    var size = (distance / Math.sqrt(2))*1.1;
    //if size is 0 it automatically displays a full scale image
    if (size === 0) {size = 1;}
    processing.pushMatrix();
    processing.translate(PRESSPOINT.x,PRESSPOINT.y);
    processing.rotate(angle);
    processing.image(this.arrowImage,0,0,size,size);
    processing.popMatrix();
};

var getCurrentMouse = function () {
    return new processing.PVector(processing.mouseX,processing.mouseY);
};

processing.draw = function () {
    ANIMATION.mainloop();
};

processing.mousePressed = function () {
    PRESSPOINT = getCurrentMouse();
    DRAGGING = true;
};

processing.mouseReleased = function () {
    ANIMATION.onMouseRelease();
    DRAGGING = false;
};

var ANIMATION = new Animation();
ANIMATION.setup();
}
var canvas = document.getElementById("canvas");
var p = new Processing(canvas, sketchProc);
