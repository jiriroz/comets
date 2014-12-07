function sketchProc(processing) {
/*2D interactive comet simulator. Author Jiri Roznovjak*/

var PRINT = '';
var WIDTH = 1200;
var HEIGHT = 600;
var G = 1500; //gravitational constant
var DRAGGING = false;
var pressPoint;
processing.size(WIDTH,HEIGHT);
document.getElementById('canvas1').style.width = WIDTH;
document.getElementById('canvas1').style.height = HEIGHT;

var Star = function () {
	this.position = new processing.PVector(WIDTH/2,HEIGHT/2);
	this.mass = 1;
	this.radius = 15;
	this.color = processing.color(255,255,50);
};

Star.prototype.display = function () {
	processing.noStroke();
	processing.fill(this.color);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};

var Comet = function (x,y,velx,vely) {
	this.position = new processing.PVector(x,y);
	this.velocity = new processing.PVector(velx,vely);
	this.acceleration = new processing.PVector(0,0);
	this.radius = 4;
	this.mass = 100;
	this.tail = new Tail();
	this.color = processing.color(255,255,255);
	this.opacity = 255;
};

Comet.prototype.runCometAndTail = function (star) {
	if (this.isAlive()) {
		this.run(star);
	}
	this.runTail(star);
};

Comet.prototype.run = function (star) {
	var gravity = this.calculateAttraction(star);
	this.applyForce(gravity);
	this.update();
	this.display();
};

Comet.prototype.runTail = function (star) {
	var opacity = this.determineDustOpacity(star);
	if (this.isAlive()) {
		this.tail.addDust(this.position.x,this.position.y,opacity);
		}
	this.tail.update();
	this.decreaseMass(star);
	//this.opacity = 255 * (this.mass/100);
};

Comet.prototype.calculateAttraction = function (object) {
	var force = PVector.sub(object.position,this.position);
	var distance = force.mag();
	if (distance < 10) {distance = 10}
	force.normalize();
	var strength = (G * this.mass * object.mass) / (distance * distance);
	force.mult(strength);
	return force;
};

Comet.prototype.applyForce = function (force) { //force as a pvector
	force.div(this.mass);
	this.acceleration.add(force);
};

Comet.prototype.update = function (star) {
	this.velocity.add(this.acceleration);
	this.position.add(this.velocity);
	this.acceleration.mult(0);
	this.radius = 1 + 2*(this.mass/100);
	document.getElementById('debugField').innerHTML = this.radius;
};

Comet.prototype.determineDustOpacity = function (star) {
	var distance = this.getDistanceToStar(star);
	var opacity = 255 * (100 / distance);
	if (opacity > 255) {opacity = 255}
	return opacity;
};

Comet.prototype.getDistanceToStar = function (star) {
	var dir = PVector.sub(star.position,this.position);
	return dir.mag();
};

 //decreases comet's mass based on its proximity to the star
Comet.prototype.decreaseMass = function (star) {
	var distance = this.getDistanceToStar(star);
	this.mass -= 3000 / (distance*distance);
	if (this.mass == 0) {this.mass = -1;}
};

Comet.prototype.display = function () {
	processing.noStroke();
	processing.fill(this.color,this.opacity);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};

Comet.prototype.isAlive = function () {
	if (this.mass < 0) {
		return false;
	}
	return true;
};

var Tail = function () {
	this.dustArray = [];
	this.color = processing.color(220,220,220);
};

Tail.prototype.addDust = function (x,y,opacity) {
	this.dustArray.push(new DustParticle(x,y,opacity));
};

Tail.prototype.update = function () {
	for (var i=0; i<this.dustArray.length;i++) {
		this.dustArray[i].run();
		if (this.dustArray[i].checkInvisible()) {
			this.dustArray.splice(i,1);
		}
	}
};

var DustParticle = function (x,y,opacity) {
	this.position = new processing.PVector(x,y);
	this.color = processing.color(220,220,220);
	this.opacity = opacity;
	this.radius = 2;
};

DustParticle.prototype.run = function () {
	this.opacity -= 3;
	processing.noStroke();
	processing.fill(this.color,this.opacity);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
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

var star = new Star();
var comets = [];

processing.draw = function () {
	processing.background(18,24,64);
	for (var i=0; i<comets.length;i++) {
		comets[i].runCometAndTail(star);
	}
	star.display();
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
