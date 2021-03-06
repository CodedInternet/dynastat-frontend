import Ember from "ember";
import layout from "../templates/components/motor-controls";

export default Ember.Component.extend({
  layout,
  conn: Ember.inject.service("webrtc-controls"),

  didInsertElement() {
    if (this.get('side') === null) {
      console.error("Component must be called with side property");
      return;
    }

    this.set('motors', {
      // foot_size: {
      //   min: 5,
      //   max: 16,
      //   step: 1,
      //   precision: 0,
      //   target: 7,
      //   current: null,
      //   label: "Foot Size",
      // },
      first_ray: {
        min: -5.0,
        max: 0.0,
        step: 0.1,
        precision: 1,
        target: 0.0,
        current: null,
        label: "First Ray Plantarflexion (&dep;)",
      },
      forefoot_frontal: {
        min: -5.0,
        max: 5.0,
        step: 0.1,
        precision: 1,
        target: 0.0,
        current: null,
        label: "Forefoot Frontal Plain (&deg;)",
      },
      rearfoot_frontal: {
        min: -5.0,
        max: 5.0,
        step: 0.1,
        precision: 1,
        target: 0.0,
        current: null,
        label: "Rearfoot Frontal Plain (&deg;)",
      },
      rearfoot_inclination: {
        min: 0.0,
        max: 5.0,
        step: 0.1,
        precision: 1,
        target: 0.0,
        current: null,
        label: "Rearfoot Inclination (&dep;)",
      },
    });
  },

  disabled: Ember.computed('conn.open', function () {
    console.log('open');
    return this.get('conn.open');
  }),

  motorUpdate: Ember.observer('conn.state', function () {
    let update = this.get('conn.state')['Motors'],
      motors = this.get('motors'),
      side = this.get('side');

    for (let [name, motor] of Object.entries(motors)) {
      let values = update[`${side}_${name}`],
        current = Number(values['Current'] * (motor.max - motor.min) / 255 + motor.min).toFixed(motor.precision),
        target = Number(values['Target'] * (motor.max - motor.min) / 255 + motor.min).toFixed(motor.precision);
      Ember.set(this, `motors.${name}.current`, current);
      Ember.set(this, `motors.${name}.target`, target);

    }
  }),

  setMotor(input) {
    let name = input.target.name,
      value = parseFloat(input.target.value),
      min = parseFloat(input.target.min),
      max = parseFloat(input.target.max);

    // sanity check the input is within the min-max
    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    value = Number(value).toFixed(this.get(`motors.${name}.precision`)); // run this now, its quicker than waiting till later
    this.set(`motors.${name}.target`, value);

    // perform scaling
    let target = -Math.round((value - min) * 255 / (min - max));

    this.get('conn').setMotor(`${this.get('side')}_${name}`, target);
  },

  actions: {
    setMotor(e) {
      Ember.run.debounce(this, this.setMotor, e, 20);
    },

    homeMotor(name) {
      this.get('conn').homeMotor(`${this.get('side')}_${name}`);
    },
  }
});
