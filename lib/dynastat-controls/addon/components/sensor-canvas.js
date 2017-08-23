import Ember from "ember";
import layout from "../templates/components/sensor-canvas";

const config = {
  "left_mtp": {
    "x": -0.84,
    "y": -0.55,
    "rows": 10,
    "cols": 16,
  },
  "left_hallux": {
    "x": -0.29,
    "y": -0.71,
    "rows": 12,
    "cols": 6,
  },
  "left_heel": {
    "x": -0.5,
    "y": 0.5,
    "rows": 12,
    "cols": 12,
  },
  "right_mtp": {
    "x": 0.345,
    "y": -0.55,
    "rows": 10,
    "cols": 16,
  },
  "right_hallux": {
    "x": 0.13,
    "y": -0.71,
    "rows": 12,
    "cols": 6,
  },
  "right_heel": {
    "x": 0.13,
    "y": 0.5,
    "rows": 12,
    "cols": 12,
  }
};

const SensorSpot = Ember.Object.extend({
  size: 10,
  value: 255,
  hue: 255.0,

  draw: function (ctx, showZeros, fadeTime) {
    if (fadeTime !== null) {
      let diff = 255 - this.get('value') - this.get('hue');
      this.set('hue', this.get('hue') + Math.ceil(diff * fadeTime));
    }

    let size = this.get('size'), // allow for shorthand later, we will use this a lot so copying over is wise
      x = this.get('x'),
      y = this.get('y'),
      gradient = ctx.createRadialGradient(x, y, 0.1, x, y, size - size / 3);

    if (showZeros || this.get('hue') < 255) {
      gradient.addColorStop(0, `hsla(${this.get('hue')}, 80%, 50%, 1)`);
      gradient.addColorStop(1, `hsla(${this.get('hue')}, 80%, 50%, 0)`);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.closePath();
    }
  },
});

export default Ember.Component.extend({
  canvas: null, ctx: null,
  layout: layout,
  conn: Ember.inject.service('webrtc-controls'),
  data: null,
  showZeros: true,
  fadeTime: 20,
  sensors: {},

  didInsertElement() {
    // setup the canvas
    let canvas = this.$('canvas')[0];
    let ctx = canvas.getContext("2d");

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = "0.75";

    this.set('canvas', canvas);
    this.set('ctx', ctx);

    let sensors = this.get('sensors');

    // iterate over each sensor in the config
    for (let [name, conf] of Object.entries(config)) {
      let sensor = []; // initialize a blank array
      let x = canvas.width / 2 * (conf.x + 1),
        y = canvas.height / 2 * (conf.y + 1);
      for (let row = 0; row < conf["rows"]; row++) {
        // check if we have already processed this row or if we need to create a new blank array to represent it
        if (!sensor[row]) {
          sensor[row] = [];
        }

        for (let col = 0; col < conf["cols"]; col++) {
          let spot = SensorSpot.create(); // size is a static constant
          // calculate the true x and y positions of the cell
          spot.set('x', spot.size * col + x);
          spot.set('y', spot.size * row + y);
          sensor[row][col] = spot; // create the new sensor object with the calculated x & y
        }
      }
      // put the sensor back into the sensors dict by name
      sensors[name] = sensor;
    }

    // copy the sensors dict back to the component level
    this.set('sensors', sensors);

    this.draw();
  },

  /**
   * Watch for changes in the latest state of the connection, this would represent a change in the sensor readings
   */
  updateSensors: Ember.observer('conn.state', function () {
    // get object variables and ember dependencies at the top level
    let update = this.get('conn.state')["Sensors"],
      sensors = this.get('sensors');

    for (let [name, reading] of Object.entries(update)) {
      let rows = reading.length,
        cols = reading[0].length;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let cell = sensors[name][row][col];
          cell.set('value', reading[row][col]);
        }
      }
    }
  }),

  draw: function (timestamp = 0) {
    let canvas = this.get('canvas'),
      ctx = this.get('ctx'),
      sensors = this.get('sensors'),
      showZeros = this.get('showZeros');

    let time = timestamp - this.get('lasttime') || 1,
      fade = 1 / (time * this.get('fadeTime') * 0.05);
    this.set('lasttime', timestamp);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let sensor of Object.values(sensors)) {
      let rows = sensor.length,
        cols = sensor[0].length;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          sensor[row][col].draw(ctx, showZeros, fade);
        }
      }
    }

    window.requestAnimationFrame(this.draw.bind(this));
  },
});
