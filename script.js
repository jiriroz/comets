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
	this.radius = 3;
	this.mass = 1;
	this.tail = new Tail();
};

Comet.prototype.run = function (star) {
	var gravity = this.calculateAttraction(star);
	this.applyForce(gravity);
	this.update();
	this.display();
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

Comet.prototype.update = function () {
	this.velocity.add(this.acceleration);
	this.position.add(this.velocity);
	this.acceleration.mult(0);
	processing.fill(255,255,255);
	this.tail.addDust(this.position.x,this.position.y);
};

Comet.prototype.display = function () {
	processing.noStroke();
	processing.fill(255,255,255);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};

var Tail = function () {
	this.tailArray = [];
};

Tail.prototype.addDust = function (x,y) {
	this.tailArray.push(new Dust(x,y));
};

Tail.prototype.update = function () {
	for (var i=0; i<this.tailArray.length;i++) {
		this.tailArray[i].update();
	}
};

var Dust = function (x,y) {
	this.position = new processing.PVector(x,y);
	this.color = processing.color(220,220,220);
	this.opacity = 100;
	this.radius = 2;
};

Dust.prototype.update = function () {
	//this.opacity = 0;
	processing.noStroke();
	processing.fill(this.color,this.opacity);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
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
		comets[i].run(star);
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
