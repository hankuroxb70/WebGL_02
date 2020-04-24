WebGL = {
	context : null,
	size : {width:0 , height:0},
	shaderProgram : null,
	SPHERE_DIV : 13,
	num : 0,
	positions : null,
	u_ModelMatrix : null,
	u_MvpMatrix : null,
	u_NormalMatrix : null,
	u_LightColor : null,
	u_LightPosition : null,
	u_AmbientLight : null,
	u_Color : null,
	box : {front:15.0 , back : -50.0 , left : -7.0 , rigth : 7.0 , top : 7.0 , bottom : -7.0 },

	end : 'end'
}
/*****************************************************************************************************
 *		Ball
 *****************************************************************************************************/
WebGL.Ball = Class.create();
WebGL.Ball.prototype = {
	initialize : function() {
		this.red = Math.random();
		this.green = Math.random();
		this.blue = Math.random();
		this.x = Math.random()*10.0 - 5.0;
		this.y = Math.random()*10.0 - 5.0;
		this.z = Math.random()*10.0 - 5.0;
		this.v = {x:Math.random()-0.5 , y:Math.random()-0.5 , z:Math.random()-0.5};
		this.r = (1.0 * 0.1) / 2;
	},
	draw : function(){
		WebGL.context.uniform4f(WebGL.u_Color, this.red, this.green, this.blue,1.0);
		WebGL.Matrix.mvScale([0.1,0.1,0.1]);
		WebGL.Matrix.mvTranslate([this.x,this.y,this.z]);
		this.x += this.v.x;
		this.y += this.v.y;
		this.z += this.v.z;
		WebGL.Matrix.setMatrixUniforms();
		WebGL.context.drawElements(WebGL.context.TRIANGLES, WebGL.num, WebGL.context.UNSIGNED_SHORT, 0);
		this.check_box();
	},
	check_box : function(){
		if(this.x + this.r > WebGL.box.rigth){
			Debugger.log('hit rigth '+this.x);
			this.x = WebGL.box.rigth - this.r;
			this.v.x *= -1;
		}else if(this.x - this.r < WebGL.box.left){
			Debugger.log('hit left '+this.x);
			this.x = WebGL.box.left + this.r;
			this.v.x *= -1;
		}
		if(this.y + this.r > WebGL.box.top){
			Debugger.log('hit top '+this.y);
			this.y = WebGL.box.top - this.r;
			this.v.y *= -1;
		}else if(this.y - this.r < WebGL.box.bottom){
			Debugger.log('hit bottom '+this.y);
			this.y = WebGL.box.bottom + this.r;
			this.v.y *= -1;
		}
		if(this.z + this.r > WebGL.box.front){
			Debugger.log('hit front '+this.z);
			this.z = WebGL.box.front - this.r;
			this.v.z *= -1;
		}else if(this.z - this.r < WebGL.box.back){
			Debugger.log('hit back '+this.z);
			this.z = WebGL.box.back + this.r;
			this.v.z *= -1;
		}
	}
}
/*****************************************************************************************************
 *		Matrix
 *****************************************************************************************************/
WebGL.Matrix = {
	init : function(){
		this.modelMatrix = new Matrix4();
		this.mvpMatrix = new Matrix4();
		this.normalMatrix = new Matrix4();
		this.mvMatrixStack = [];
	},
	mvPushMatrix : function(matrix){
		if (matrix) {
			var push_matrix = matrix.clone();
			this.mvMatrixStack.push(push_matrix);
			this.modelMatrix = new Matrix4();
		} else {
			this.mvMatrixStack.push(this.modelMatrix);
			this.modelMatrix = new Matrix4();
		}
	},
	mvPopMatrix : function(){
		if (this.mvMatrixStack.length == 0) {
			throw "Invalid popMatrix!";
		}
		this.modelMatrix = this.mvMatrixStack.pop();
		return this.modelMatrix;
	},
	loadIdentity : function(){
		this.modelMatrix.setIdentity();
		this.mvpMatrix.setIdentity();
		this.normalMatrix.setIdentity();
	},
	multMatrix : function(matrix){
		this.modelMatrix.concat(matrix);
	},
	mvTranslate : function(vector){
		var matrix = new Matrix4();
		matrix.setTranslate(vector[0], vector[1], vector[2])
		this.multMatrix(matrix);
	},
	mvRotate : function(angle, vector){
		var radians = angle * Math.PI / 180.0;
		var matrix = new Matrix4();
		matrix.setRotate(angle,vector[0], vector[1], vector[2]);
		this.multMatrix(matrix);
	},
	mvScale : function(scale){
		var matrix = new Matrix4();
		matrix.setScale(scale[0], scale[1], scale[2]);
		this.multMatrix(matrix);
	},
	perspective : function(fovy, aspect, znear, zfar){
		this.mvpMatrix.setPerspective(fovy, aspect, znear, zfar);
	},
	setLookAt : function(ex, ey, ez, cx, cy, cz, ux, uy, uz){
		this.mvpMatrix.lookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz);
	},
	setMatrixUniforms : function(){
		WebGL.context.uniformMatrix4fv(WebGL.u_ModelMatrix, false, this.modelMatrix.elements);
		WebGL.context.uniformMatrix4fv(WebGL.u_MvpMatrix, false, this.mvpMatrix.elements);
		this.normalMatrix.setInverseOf(this.modelMatrix);
		this.normalMatrix.transpose();
		WebGL.context.uniformMatrix4fv(WebGL.u_NormalMatrix, false, this.normalMatrix.elements);
	}
}
/*****************************************************************************************************
 *		main program
 *****************************************************************************************************/
window.addEventListener("load", main, false);
function main(){
	var angle = 0;
	var balls = [];
	WebGL.context = $('canvas').getContext("experimental-webgl");
	WebGL.size.width = $('canvas').width;
	WebGL.size.height = $('canvas').height;
	initShaders();
	WebGL.num = set_buffer();
	WebGL.Matrix.init();
	for(var i=0;i<10;i++){
		balls.push(new WebGL.Ball());
	}
	this.timer = setInterval(draw,33);
	function initShaders(){
		var fshader = getShader(WebGL.context, "shader-fs");
		var vshader = getShader(WebGL.context, "shader-vs");
		if(!fshader || !vshader){
			console.log('error 1');
			return false;
		}
		WebGL.shaderProgram = WebGL.context.createProgram();
		WebGL.context.attachShader(WebGL.shaderProgram, vshader);
		WebGL.context.attachShader(WebGL.shaderProgram, fshader);
		WebGL.context.linkProgram(WebGL.shaderProgram);
		if (!WebGL.context.getProgramParameter(WebGL.shaderProgram, WebGL.context.LINK_STATUS)) {
			alert("Could not initialize shaders");
			return false;
		}
		WebGL.context.useProgram(WebGL.shaderProgram);
		WebGL.u_ModelMatrix = WebGL.context.getUniformLocation(WebGL.shaderProgram, 'u_ModelMatrix');
		WebGL.u_MvpMatrix = WebGL.context.getUniformLocation(WebGL.shaderProgram, 'u_MvpMatrix');
		WebGL.u_NormalMatrix = WebGL.context.getUniformLocation(WebGL.shaderProgram, 'u_NormalMatrix');
		WebGL.u_LightColor = WebGL.context.getUniformLocation(WebGL.shaderProgram, 'u_LightColor');
		WebGL.u_LightPosition = WebGL.context.getUniformLocation(WebGL.shaderProgram, 'u_LightPosition');
		WebGL.u_AmbientLight = WebGL.context.getUniformLocation(WebGL.shaderProgram, 'u_AmbientLight');
		WebGL.u_Color = WebGL.context.getUniformLocation(WebGL.shaderProgram, 'u_Color');
		if (!WebGL.u_ModelMatrix || !WebGL.u_MvpMatrix || !WebGL.u_NormalMatrix ||
			!WebGL.u_LightColor || !WebGL.u_LightPosition || !WebGL.u_AmbientLight ||
			!WebGL.u_Color) {
			console.log('uniform error 2');
			return false;
		}
		WebGL.context.uniform3f(WebGL.u_LightColor, 0.8, 0.8, 0.8);
		WebGL.context.uniform3f(WebGL.u_LightPosition, 5.0, 8.0, 7.0);
		WebGL.context.uniform3f(WebGL.u_AmbientLight, 0.2, 0.2, 0.2);

		function getShader(webglcontext, id){
			var shaderScript = $(id);
			if (!shaderScript) {
				return null;
			}
			var str = "";
			var scriptChild = shaderScript.firstChild;
			while (scriptChild) {
				if (scriptChild.nodeType == 3) {
					str += scriptChild.textContent;
				}
				scriptChild = scriptChild.nextSibling;
			}

			var shader;
			if (shaderScript.type == "x-shader/x-fragment") {
				shader = WebGL.context.createShader(WebGL.context.FRAGMENT_SHADER);
			} else if (shaderScript.type == "x-shader/x-vertex") {
				shader = WebGL.context.createShader(WebGL.context.VERTEX_SHADER);
			} else {
				return null;
			}

			WebGL.context.shaderSource(shader, str);
			WebGL.context.compileShader(shader);

			if (!WebGL.context.getShaderParameter(shader, WebGL.context.COMPILE_STATUS)) {
				alert(WebGL.context.getShaderInfoLog(shader));
				return null;
			}
			return shader;
		}
	}
	function set_buffer(){
		var i, ai, si, ci;
		var j, aj, sj, cj;
		var p1, p2;

		WebGL.positions = [];
		var indices = [];
		for (j = 0; j <= WebGL.SPHERE_DIV; j++) {
			aj = j * Math.PI / WebGL.SPHERE_DIV;
			sj = Math.sin(aj);
			cj = Math.cos(aj);
			for (i = 0; i <= WebGL.SPHERE_DIV; i++) {
				ai = i * 2 * Math.PI / WebGL.SPHERE_DIV;
				si = Math.sin(ai);
				ci = Math.cos(ai);
				WebGL.positions.push(si * sj);  // X
				WebGL.positions.push(cj);       // Y
				WebGL.positions.push(ci * sj);  // Z
			}
		}
		for (j = 0; j < WebGL.SPHERE_DIV; j++) {
			for (i = 0; i < WebGL.SPHERE_DIV; i++) {
				p1 = j * (WebGL.SPHERE_DIV+1) + i;
				p2 = p1 + (WebGL.SPHERE_DIV+1);
				indices.push(p1);
				indices.push(p2);
				indices.push(p1 + 1);
				indices.push(p1 + 1);
				indices.push(p2);
				indices.push(p2 + 1);
			}
		}
		if (!initArrayBuffer('a_Position', new Float32Array(WebGL.positions), WebGL.context.FLOAT, 3)) return -1;
		if (!initArrayBuffer('a_Normal', new Float32Array(WebGL.positions), WebGL.context.FLOAT, 3))  return -1;

		WebGL.context.bindBuffer(WebGL.context.ARRAY_BUFFER, null);
		var indexBuffer = WebGL.context.createBuffer();
		if (!indexBuffer) {
			console.log('error 5');
			return -1;
		}
		WebGL.context.bindBuffer(WebGL.context.ELEMENT_ARRAY_BUFFER, indexBuffer);
		WebGL.context.bufferData(WebGL.context.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), WebGL.context.STATIC_DRAW);
		return indices.length;
	}
	function initArrayBuffer(attribute, data, type, num){
		var buffer = WebGL.context.createBuffer();
		if (!buffer) {
			console.log('error 3');
			return false;
		}
		WebGL.context.bindBuffer(WebGL.context.ARRAY_BUFFER, buffer);
		WebGL.context.bufferData(WebGL.context.ARRAY_BUFFER, data, WebGL.context.STATIC_DRAW);
		var a_attribute = WebGL.context.getAttribLocation(WebGL.shaderProgram, attribute);
		if (a_attribute < 0) {
			console.log(attribute + ' error 4');
			return false;
		}
		WebGL.context.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
		WebGL.context.enableVertexAttribArray(a_attribute);
		return true;
	}
	function draw(){
		WebGL.context.clearColor(0.0, 0.0, 0.0, 1.0);
		WebGL.context.clearDepth(1.0);
		WebGL.context.enable(WebGL.context.DEPTH_TEST);
		WebGL.context.depthFunc(WebGL.context.LEQUAL);
		WebGL.context.viewport(0, 0, WebGL.size.width, WebGL.size.height);
		WebGL.context.clear(WebGL.context.COLOR_BUFFER_BIT | WebGL.context.DEPTH_BUFFER_BIT);
		WebGL.Matrix.loadIdentity();
		WebGL.Matrix.perspective(25, (WebGL.size.width / WebGL.size.height), 0.1, 100.0);
		var z = Math.cos(angle * Math.PI / 180) * 7.0;
		var x = Math.sin(angle * Math.PI / 180) * 7.0;
		WebGL.Matrix.setLookAt(0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
		WebGL.Matrix.setMatrixUniforms();
		for(var j=0;j<10;j++){
			WebGL.Matrix.mvPushMatrix();
			balls[j].draw();
			WebGL.Matrix.mvPopMatrix();
		}
		angle++;
		if(angle > 360) angle = 0;
	}
}