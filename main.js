'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let stereoCamera;
let gui;
let texture, camera, cameraTexture, cameraSurface;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTexCoordBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.TexCoordBufferData = function (textures) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);
    }
    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);
        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }

}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    // let projection = m4.perspective(Math.PI/8, 1, 8, 12);
    let projection = m4.orthographic(-3, 3, -3, 3, -3, 3);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */

    let modelViewProjection = m4.identity();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            camera
        );
    cameraSurface.Draw();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    stereoCamera.ApplyLeftFrustum()
    modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, matAccum1));
    // modelViewProjection = m4.identity()
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(true, false, false, false);
    surface.Draw();
    gl.clear(gl.DEPTH_BUFFER_BIT);

    stereoCamera.ApplyRightFrustum()
    modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, matAccum1));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(false, true, true, false);
    surface.Draw();

    gl.colorMask(true, true, true, true);
}

function draw_() {
    draw()
    window.requestAnimationFrame(draw_)
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function CreateSurfaceData() {
    let vertexList = [];

    for (let v = -a; v <= 0; v += 0.1) {
        for (let u = -Math.PI; u <= Math.PI; u += 0.1) {
            vertexList.push(...conical(u, v));
            vertexList.push(...conical(u + 0.1, v));
            vertexList.push(...conical(u, v + 0.1));
            vertexList.push(...conical(u, v + 0.1));
            vertexList.push(...conical(u + 0.1, v));
            vertexList.push(...conical(u + 0.1, v + 0.1));
        }
    }
    return vertexList;
}
function CreateSurfaceTexCoords() {
    let vertexList = [];
    for (let v = -a; v <= 0; v += 0.1) {
        for (let u = -Math.PI; u <= Math.PI; u += 0.1) {
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
            vertexList.push(map(u, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v, -a, 0, 0, 1));
            vertexList.push(map(u + 0.1, -Math.PI, Math.PI, 0, 1), map(v + 0.1, -a, 0, 0, 1));
        }
    }
    return vertexList;
}

let a = 10;
let p = 1;
const multiplier = 10
function conical(u, v) {
    let w = (p * u);
    let x = (a + v) * Math.cos(w) * Math.cos(u);
    let y = (a + v) * Math.cos(w) * Math.sin(u);
    let z = (a + v) * Math.sin(w);
    return [x / multiplier, y / multiplier, z / multiplier]
}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    camera = getCamera();
    cameraTexture = CreateTexture();
    cameraSurface = new Model();
    cameraSurface.BufferData([-1, -1, 0, 1, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 1, 0]);
    cameraSurface.TexCoordBufferData([1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0]);
    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.TexCoordBufferData(CreateSurfaceTexCoords());


    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);
    stereoCamera = new StereoCamera(50, 1, 1, 45, 1, 20);
    loadTexture()
    gui = new guify({})
    // document.getElementsByClassName('guify-container')[0].style.zIndex = 3;
    document.getElementsByClassName('guify-container')[0].style.height = '30%'
    console.log(document.getElementsByClassName('guify-container')[0])
    console.log(document.getElementById('webglcanvas'))
    gui.Register([
        {
            type: 'range',
            object: stereoCamera, property: 'mEyeSeparation',
            label: 'Eye separation',
            min: 0, max: 1, step: 0.01,
            onChange: () => {
                draw()
            }
        },
        {
            type: 'range',
            object: stereoCamera, property: 'mConvergence',
            label: 'Convergence',
            min: 10, max: 100, step: 10,
            onChange: () => {
                draw()
            }
        },
        {
            type: 'range',
            object: stereoCamera, property: 'mFOV',
            label: 'Field of view',
            min: 0.01, max: 3, step: 0.01,
            onChange: () => {
                draw()
            }
        },
        {
            type: 'range',
            object: stereoCamera, property: 'mNearClippingDistance',
            label: 'Near clipping distance',
            min: 9, max: 11, step: 0.01,
            onChange: () => {
                draw()
            }
        },
    ])
    draw();
    draw_();
}

function loadTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://www.manytextures.com/thumbnail/5/512/dark+wood.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}