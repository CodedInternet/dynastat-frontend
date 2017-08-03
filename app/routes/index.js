import Ember from "ember";

export default Ember.Route.extend({
  connection: Ember.inject.service('webrtc-controls'),

  setupController(controller, model) {
    const host = window.location.host,
      secure = (window.location.protocol === "https:");
    const conn = this.get('connection');

    let proto = 'ws:';
    if(secure) {
      proto = 'wss:'
    }
    conn.openConnection(`${proto}//${host}/ws/signal`);
  },
});
