import Ember from "ember";

export default Ember.Controller.extend({
  connection: Ember.inject.service('webrtc-controls'),
  sensors: {},
  showZeros: true,
  motors: {
    left: null,
    right: null,
  },
  bgImg: null,

  init: function () {
    this._super();
    let bg = new Image();
    bg.src = "/assets/img/feet.svg";
    this.set('bgImg', bg);
  },

  formatFrontal(motor) {
    let string;
    if (motor.current > 0) {
      string = `${Math.abs(motor.current).toFixed(motor.precision)}º varus`;
    } else if (motor.current < 0) {
      string = `${Math.abs(motor.current).toFixed(motor.precision)}º valgus`;
    } else {
      string = "0.0º neutral"
    }
    return string
  },

  drawMotorStats(ctx, motors, x, y) {
    ctx.save();
    {
      const size = 35;
      const offset = 520;
      // ctx.fillText('Foot Size', x + 0, y + 0);
      ctx.fillText('First Ray Plantarflexion', x + 0, y + size);
      ctx.fillText('Forefoot Frontal Plain', x + 0, y + size * 2);
      ctx.fillText('Rearfoot Frontal Plain', x + 0, y + size * 3);
      ctx.fillText('Rearfoot Inclination', x + 0, y + size * 4);

      ctx.textAlign = "right";
      // ctx.fillText(`${motors['foot_size'].current}`, x + offset, y);
      ctx.fillText(`${motors["first_ray"].current} mm`, x + offset, y + size);
      ctx.fillText(this.formatFrontal(motors["forefoot_frontal"]), x + offset, y + size * 2);
      ctx.fillText(this.formatFrontal(motors["rearfoot_frontal"]), x + offset, y + size * 3);
      ctx.fillText(`${motors["rearfoot_inclination"].current} mm`, x + offset, y + size * 4);
    }
    ctx.restore();
  },

  actions: {
    saveImage() {
      let canvas = Ember.$("#print-canvas")[0],
        ctx = canvas.getContext("2d"),
        bg = this.get('bgImg'),
        sensors = this.get('sensors'),
        showZeros = this.get('showZeros'),
        motors = this.get('motors');

      // clear the frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      {
        // render the background image
        ctx.scale(0.95, 0.95);
        ctx.translate(0, canvas.height * 0.025);
        let scale = canvas.height / bg.height,
          w = bg.width * scale,
          h = bg.height * scale,
          x = canvas.width / 2 - w / 2,
          y = canvas.height / 2 - h / 2;

        ctx.drawImage(bg, x, y, w, h);
      }
      ctx.restore();

      ctx.save();
      {
        ctx.translate(240, 0);
        // ctx.scale(0.95, 0.95, canvas.width/2, canvas.height/2);
        ctx.scale(2.24, 2.24);
        // render sensors as normal
        for (let sensor of Object.values(sensors)) {
          for (let cols of sensor) {
            for (let cell of cols) {
              cell.draw(ctx, showZeros, null);
            }
          }
        }
      }
      ctx.restore();

      // add motor text
      ctx.fillStyle = "black";
      ctx.font = '25pt sans-serif';
      this.drawMotorStats(ctx, motors["left"], 10, 920);
      this.drawMotorStats(ctx, motors["right"], 1390, 920);

      // produce png an send to download
      let link = Ember.$('#print-canvas-save');
      link.attr('href', canvas.toDataURL());
      link.attr('download', `DYN-${new Date().toISOString()}.png`);
    }
  }
});
