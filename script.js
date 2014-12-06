function sketchProc(processing) {
/*2D interactive comet simulator. Author Jiri Roznovjak*/

var PRINT = '';
var WIDTH = 1200;
var HEIGHT = 600;
var G = 1; //gravitational constant
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

var Comet = function (x,y) {
	this.position = new processing.PVector(x,y);
	this.velocity = new processing.PVector(0,0);
	this.acceleration = new processing.PVector(0,0);
	this.radius = 3;
	this.mass = 1;
};

Comet.prototype.run = function (star) {
	document.getElementById('debugField').innerHTML = this.position.x;
	var gravity = this.calculateAttraction(star);
	this.applyForce(gravity);
	this.update();
	this.display();
};

Comet.prototype.calculateAttraction = function (object) {
	var force = PVector.sub(this.position,object.position);
	var distance = force.mag();
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
};

Comet.prototype.display = function () {
	processing.noStroke();
	processing.fill(255,255,255);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
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

processing.mouseClicked = function () {
	comets.push(new Comet(processing.mouseX,processing.mouseY));
};


PRINT += ' --reached the end of the script.';
document.getElementById('debugField').innerHTML = PRINT;
}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
