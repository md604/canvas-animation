const btn = document.querySelector('.run-animation');
const btnRevert = document.querySelector('.revert-animation');
const img = document.querySelector('.slide img');
const animatedCanvas = document.querySelector('.slider-animation');
const circles = [];
let raf, startTime = 0;
img.crossOrigin = "Anonymous";

function getIntFromInterval(max, min) {
    return Math.floor(Math.random() * (max - min) + min);
}

function Trajectory(p, c) { // ep - end point, c - canvas object
    this.forwardDirection = true;
    this.s = 1; // speed or moving step
    this.l = 0; // trajectory length that we've walked through
    this.lt = 0; // the total trajectory length
    this.ang = 0; // moving direction angle
    this.duration = 6; // movement duration along the path
    this.complete = false;
    this.ep = { // end point
        x: p.x,
        y: p.y
    };
    this.sp = { // start point
        x: 0,
        y: 0
    };
    this.createStartingPoint = function (radius) {
        // create a random point on the canvas perimeter
        const pointPerimeterPosition = getIntFromInterval((c.width + c.height) * 2, 0);
        // pout the point away from the visible canvas area with a random offset
        const randomOffset = getIntFromInterval(100, 0);
        if (pointPerimeterPosition <= c.width) { // top side
            this.sp.x = getIntFromInterval(c.width, 1);
            this.sp.y = 0 - radius - randomOffset;
        } else if (pointPerimeterPosition <= c.width + c.height) { // right side
            this.sp.x = c.width + radius + randomOffset;
            this.sp.y = getIntFromInterval(c.height, 1);
        } else if (pointPerimeterPosition <= c.width * 2 + c.height) { // bottom side
            this.sp.x = getIntFromInterval(c.width, 1);
            this.sp.y = c.height + radius + randomOffset;
        } else { // left side
            this.sp.x = 0 - radius - randomOffset;
            this.sp.y = getIntFromInterval(c.height, 1);
        }
    }
    this.initAngle = function () {
        // move zero point to the ending point
        // calculate the angle
        this.ang = Math.atan2(this.sp.y - this.ep.y, this.sp.x - this.ep.x);
    }
    this.easeInQuad = function (t, b, c, d) {
        return c * (t /= d) * t + b;
    }
    this.easeOutQuad = function (t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    }
    this.easeInOutSine = function (t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    }
    this.isCompleted = function () {
        return this.complete; //this.l >= 0 ? false : true;  
    }
    this.calculateLength = function () {
        const dx = this.ep.x - this.sp.x;
        const dy = this.ep.y - this.sp.y;
        this.l = Math.sqrt(dx * dx + dy * dy);
        this.lt = this.l;
    }
    this.setMovingStep = function (t) {
        // this.s = this.l / ( 60 * this.duration );
        this.s = this.easeInOutSine(t, 0, this.lt, this.duration * 1000);
    }
    this.getStartPosition = function (r) {
        this.createStartingPoint(r);
        this.initAngle();
        this.calculateLength();
        this.setMovingStep(0); // in the beginning the time is zero
        return this.sp;
    }
    this.getEndPosition = function () {
        return this.ep;
    }
    this.getAngle = function () {
        return this.ang;
    }
    this.getNextPosition = function (x, y, t) {
        let direction = -1; // 1 == backward, i.e. away from the end point
        let currentX = x, currentY = y;
        if (this.l == 0) this.complete = true;
        if (this.l > 0) {
            this.setMovingStep(t);
            if (this.s > this.l) this.s = this.l;
            if (this.forwardDirection == false) direction = 1;
            currentX += this.s * direction * Math.cos(this.ang);
            currentY += this.s * direction * Math.sin(this.ang);
            this.l -= this.s; // it does not matter which direction we move
        }
        return {
            x: currentX, // delta distance * cos angle
            y: currentY  // delta distance * sin angle
        };
    }
    this.changeEndPoint = function (radius) {
        // create a random point on the canvas perimeter
        const pointPerimeterPosition = getIntFromInterval((c.width + c.height) * 2, 0);
        // pout the point away from the visible canvas area with a random offset
        const shadowOffset = 10;
        const randomOffset = getIntFromInterval(100, 0) + shadowOffset;
        if (pointPerimeterPosition <= c.width) { // top side
            this.ep.x = getIntFromInterval(c.width, 1);
            this.ep.y = 0 - radius - randomOffset;
        } else if (pointPerimeterPosition <= c.width + c.height) { // right side
            this.ep.x = c.width + radius + randomOffset;
            this.ep.y = getIntFromInterval(c.height, 1);
        } else if (pointPerimeterPosition <= c.width * 2 + c.height) { // bottom side
            this.ep.x = getIntFromInterval(c.width, 1);
            this.ep.y = c.height + radius + randomOffset;
        } else { // left side
            this.ep.x = 0 - radius - randomOffset;
            this.ep.y = getIntFromInterval(c.height, 1);
        }
    }
    this.changeStartPoint = function (x, y) {
        this.sp.x = x;
        this.sp.y = y;
    }
    this.reverseMovement = function (x, y, r) {
        this.complete = false;
        this.changeEndPoint(r);
        this.changeStartPoint(x, y);
        this.initAngle();
        this.calculateLength();
        this.setMovingStep(0); // in the beginning the time is zero
    }
}
function Circle(p, r, c, t) {
    this.x = p.x; // x current position
    this.y = p.y; // y current position
    this.r = r; // radius
    this.rMax = r + getIntFromInterval(150, 0); // maximum radius
    this.t = t; // trajectory obj
    this.c = c; // rgba color
    this.getColor = function () {
        return this.c;
    }
    this.getRadius = function () {
        return this.r;
    }
    this.isIdle = function () {
        return this.t.isCompleted();
    }
    this.updateRadius = function () {
        if (this.r < this.rMax) this.r += 1;
    }
    this.init = function () {
        // move a circle to the new starting point
        const startPoint = this.t.getStartPosition(this.r);
        this.x = startPoint.x;
        this.y = startPoint.y;
    }
    this.updatePosition = function (time) {
        const nextPoint = this.t.getNextPosition(this.x, this.y, time);
        this.x = nextPoint.x;
        this.y = nextPoint.y;
    }
    this.hide = function () {
        this.t.reverseMovement(this.x, this.y, this.r);
    }
    this.draw = function (ctx) {
        /*
        ctx.beginPath();       // Start a new path
        ctx.moveTo(this.t.sp.x, this.t.sp.y);    // Move the pen to (30, 50)
        ctx.lineTo(this.t.ep.x, this.t.ep.y);  // Draw a line to (150, 100)
        ctx.stroke();          // Render the path
        ctx.closePath();
        */
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';

        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = `rgba(${this.c[0]},${this.c[1]},${this.c[2]},${this.c[3]})`;//'rgba(255, 255, 255, 1)';
        ctx.fill();
    }
}

const anim = (timestamp) => {
    if (startTime === 0) startTime = timestamp;
    const ctx = animatedCanvas.getContext('2d');
    const elapsed = timestamp - startTime;
    let movingCirclesNumber = circles.length;
    ctx.clearRect(0, 0, animatedCanvas.width, animatedCanvas.height);
    for (let i = 0; i < circles.length; i++) {
        circles[i].draw(ctx);
        //circles[i].updateRadius();
        circles[i].updatePosition(elapsed);
        if (circles[i].isIdle()) movingCirclesNumber--;
    }
    if (movingCirclesNumber == 0) {
        window.cancelAnimationFrame(raf);
        console.log('Animation is stopped', raf);
        raf = 0;
    } else {
        // safeguard killer switch
        // stop animation after N seconds if it didnt stop by itself
        if (elapsed < 6000) { // Stop the animation after 2 seconds
            // save a ref to the current reauest animation obj to be able to cancel it later
            raf = window.requestAnimationFrame(anim);
        }
    }
}
const getCirclePropsFromRect = (x0, y0, x1, y1) => {
    const dx = x1 - x0, dy = y1 - y0;
    return {
        x: Math.floor(x0 + dx / 2),
        y: Math.floor(y0 + dy / 2),
        r: Math.floor(Math.sqrt(dx * dx + dy * dy) / 2)
    };
}
const createAnimatedObjects = () => {
    const CIRCLES_NUMBER = 6;
    const canvas = document.createElement('canvas');
    let wSide = img.width,
        hSide = img.height,
        circleProps = {},
        rgba, tj, c;
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
    circles.splice(0);

    for (let i = 0, hPrev = 0; i < CIRCLES_NUMBER / 2; i++) {
        let h = i == (CIRCLES_NUMBER / 2 - 1) ? img.height : getIntFromInterval(hSide, hPrev);
        let w = getIntFromInterval(wSide, 0);
        // left square to circle 
        circleProps = getCirclePropsFromRect(0, hPrev, w, h);
        rgba = canvas.getContext('2d').getImageData(circleProps.x, circleProps.y, 1, 1).data;
        c = new Circle(
            { x: circleProps.x, y: circleProps.y },
            circleProps.r,
            rgba,
            new Trajectory({ x: circleProps.x, y: circleProps.y }, canvas)
        );
        c.init();
        circles.push(c);
        // right square to circle
        circleProps = getCirclePropsFromRect(w, hPrev, wSide, h);
        rgba = canvas.getContext('2d').getImageData(circleProps.x, circleProps.y, 1, 1).data;
        c = new Circle(
            { x: circleProps.x, y: circleProps.y },
            circleProps.r,
            rgba,
            new Trajectory({ x: circleProps.x, y: circleProps.y }, canvas)
        );
        c.init();
        circles.push(c);
        // move to the next line
        hPrev = h;
    }
    // bring small circles to the front
    circles.sort((a, b) => (b.getRadius() - a.getRadius()));
}

const runLolaRun = e => {
    createAnimatedObjects();
    document.querySelectorAll('.color-samples .color-sample').forEach((colorBox, i) => {
        // show picked colors
        const rgba = circles[i].getColor();
        colorBox.style.backgroundColor = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3]})`;
    });
    // prepare the context
    animatedCanvas.width = img.width;
    animatedCanvas.height = img.height;
    // reset animation parameters after previous animation cycle
    //movingCirclesNumber = circles.length;
    startTime = 0;
    raf = window.requestAnimationFrame(anim);
}
const comeBackLola = e => {
    // recalculate trajectory
    for (let i = 0; i < circles.length; i++) {
        circles[i].hide();
    }
    // restart animation if it is not active
    startTime = 0;
    if (raf == 0) raf = window.requestAnimationFrame(anim);
}

window.onload = (e) => {
    console.log('coucou');
    btn.addEventListener('click', runLolaRun);
    btnRevert.addEventListener('click', comeBackLola);
}