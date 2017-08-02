import Ember from "ember";
import layout from "../templates/components/motor-controls";

export default Ember.Component.extend({
  layout,
  conn: Ember.inject.service("webrtc-controls"),
  side: null,
  motors: {
    foot_size: {
      min: 3,
      max: 16,
      step: 1,
      target: 7,
      current: null,
      label: "Foot Size",
    },
    first_ray: {
      min: -5.0,
      max: 0.0,
      step: 0.1,
      target: 0.0,
      current: null,
      label: "First Ray Plantarflexion (mm)",
    },
    forefoot_frontal: {
      min: -5.0,
      max: 5.0,
      step: 0.1,
      target: 0.0,
      current: null,
      label: "Forefoot Frontal Plain (&deg;)",
    },
    rearfoot_frontal: {
      min: -5.0,
      max: 5.0,
      step: 0.1,
      target: 0.0,
      current: null,
      label: "Rearfoot Frontal Plain (&deg;)",
    },
    rearfoot_inclination: {
      min: 0.0,
      max: 5.0,
      step: 0.1,
      target: 0.0,
      current: null,
      label: "Rearfoot Inclination (mm)",
    },
  },

  didInsertElement() {
    if (this.get('side') === null) {
      console.error("Component must be called with side property");
      return;
    }
  },

  disabled: Ember.computed('conn.open', function () {
    console.log('open');
    return this.get('conn.open');
  }),

  motorUpdate: Ember.observer('conn.latestState', function () {
    let update = this.get('conn.latestState')['Motors'],
      motors = this.get('motors'),
      side = this.get('side');

    for (let [name, motor] of motors) {
      motor.current = update[`${side}_${name}`]["Current"];
    }
  }),

  actions: {
    setMotor(e) {
      let name = e.target.name,
        value = Number(e.target.value),
        min = e.target.min,
        max = e.target.max;

      // perform scaling
      let target = Math.round((value - min) * 255 / (min - max));

      this.get('conn').setMotor(name, target);
    }
  }
});
