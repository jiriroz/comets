function sketchProc(processing) {
/*2D interactive comet simulator. Author Jiri Roznovjak*/

var PRINT = '';
var WIDTH = 1200;
var HEIGHT = 600;
var G = 2000; //gravitational constant
var DRAGGING = false;
var pressPoint;
processing.size(WIDTH,HEIGHT);
document.getElementById('canvas1').style.width = WIDTH;
document.getElementById('canvas1').style.height = HEIGHT;

var Particle = function () {
	this.position = new processing.PVector(0,0);
	this.velocity = new processing.PVector(0,0);
	this.acceleration = new processing.PVector(0,0);
	this.mass = 1;
	this.radius = 1;
	this.color = processing.color(255,255,255);
	this.opacity = 255;
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

Particle.prototype.display = function () {
	processing.noStroke();
	processing.fill(this.color,this.opacity);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};

Particle.prototype.applyForce = function (force) { //force as a pvector
	force.div(this.mass);
	this.acceleration.add(force);
};

Particle.prototype.calculateAttraction = function (object) {
	var force = PVector.sub(object.position,this.position);
	var distance = force.mag();
	if (distance < 10) {distance = 10}
	force.normalize();
	var strength = (G * this.mass * object.mass) / (distance * distance);
	force.mult(strength);
	return force;
};

Particle.prototype.getDistanceToObject = function (object) {
	var dir = PVector.sub(object.position,this.position);
	return dir.mag();
};

var Star = function(x,y,velx,vely) {
    Particle.call(this);
	this.position = new processing.PVector(x,y);
	this.velocity = new processing.PVector(velx,vely);
	this.color = processing.color(255,255,50);
	this.radius = 20;
	this.opacity = 50;
};

Star.prototype = Object.create(Particle.prototype);

Star.prototype.display = function () {
	processing.noStroke();
	for (var rad=0;rad<this.radius;rad++) {
		processing.fill(this.color,this.opacity);
		processing.ellipse(this.position.x,this.position.y,rad*2,rad*2);
	}
};

var Comet = function(x,y,velx,vely) {
    Particle.call(this);
	this.position = new processing.PVector(x,y);
	this.velocity = new processing.PVector(velx,vely);
	this.radius = 4;
	this.mass = 100;
	this.tail = new Tail();
	this.alive = true;
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
	if (this.position.x < -100 || this.position.x > WIDTH + 100 || this.position.y < -100 || this.position.y > HEIGHT + 100) {
		return true;
	}
	return false;
};

Comet.prototype.checkInStar = function (star) {
	return (this.getDistanceToObject(star) < star.radius);
};

Comet.prototype.determineDustOpacity = function (star) {
	var distance = this.getDistanceToObject(star);
	var opacity = 200 * (150 / distance);
	if (opacity > 200) {opacity = 200}
	return opacity;
};

 //decreases comet's mass based on its proximity to the star
Comet.prototype.decreaseMass = function (star) {
	var distance = this.getDistanceToObject(star);
	this.mass -= 2000 / (distance*distance);
	if (this.mass == 0) {this.mass = -1;}
};

Comet.prototype.isAlive = function () {
	if (!this.alive) {
		return false;
	}
	/*if (this.mass < 0) { //vaporizing turned off
		return false;
	}*/
	return true;
};

var Tail = function () {
	this.dustArray = [];
	this.color = processing.color(220,220,220);
};

Tail.prototype.addDust = function (x,y,opacity) {
	for (var i=0;i<10;i++) {
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
	this.velocity = new processing.PVector((Math.random()-0.5)*0.6,(Math.random()-0.5)*0.6);
	this.color = processing.color(220,220,220);
	this.opacity = opacity;
	this.radius = 2;
	this.drift = 0.95;
};

DustParticle.prototype = Object.create(Particle.prototype);

DustParticle.prototype.run = function () {
	this.update();
	this.opacity -= 3;
	processing.noStroke();
	processing.fill(this.color,this.opacity);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};

DustParticle.prototype.update = function () {
	Particle.prototype.update.call(this);
	this.velocity.mult(this.drift);
};

DustParticle.prototype.checkInvisible = function () {
	if (this.opacity < 0) {
		return true;
	}
};

var createComet = function () {
	var currentPoint = new processing.PVector(processing.mouseX,processing.mouseY);
	var velocity = PVector.sub(pressPoint,currentPoint);
	velocity.div(40);
	comets.push(new Comet(processing.mouseX,processing.mouseY,velocity.x,velocity.y));
};

var sideVelocity = 2;
var stars = [new Star(WIDTH/2,HEIGHT/2+150,sideVelocity,0),new Star(WIDTH/2,HEIGHT/2-150,-sideVelocity,0)];
var comets = [];

processing.draw = function () {
	processing.background(18,24,64);
	for (var i=0; i<comets.length;i++) {
		for (var j=0; j<stars.length; j++) {
			comets[i].runCometAndTail(stars[j]);
		}
	}
	for (var i=0; i<stars.length; i++) {
		for (var j=0; j<stars.length; j++) {
			if (j!=i) {
				var gravity = stars[i].calculateAttraction(stars[j]);
				stars[i].applyForce(gravity);
			}
		}
		stars[i].run();
	}
};

processing.mousePressed = function () {
	pressPoint = new processing.PVector(processing.mouseX,processing.mouseY);
};

processing.mouseReleased = function () {
	createComet();
};

document.getElementById('debugField').innerHTML = PRINT;
}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
