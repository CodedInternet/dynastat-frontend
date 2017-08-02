import Ember from "ember";

export default Ember.Route.extend({
  connection: Ember.inject.service('webrtc-controls'),

  setupController(controller, model) {
    const host = window.location.host;
    const conn = this.get('connection');

    conn.openConnection(`ws://${host}/ws/signal`);
  },
});
