window.onload = () => {
    let myp5 = new p5(myCanvas)
}

const myCanvas = (sketch) => {
    sketch.setup = () => {
        sketch.createCanvas(400, 400);
    };
    sketch.draw = () => {
        sketch.background('aliceblue');
    };
}