import Ember from "ember";

export default Ember.Route.extend({
  connection: Ember.inject.service('webrtc-controls'),

  setupController(controller, model) {
    const host = window.location.host,
      secure = (window.location.protocol === "https:");
    const conn = this.get('connection');

    let proto = 'ws:';
    if (secure) {
      proto = 'wss:'
    }

    Ember.$.get('/api/ice_servers').then((response) => {
      let iceServers = [];
      for (let s of response) {
        iceServers.push({
          urls: s.Urls,
          credential: s.Credential,
          username: s.Username,
        });
      }

      conn.openConnection(`${proto}//${host}/ws/signal`, iceServers);
    });
  },
});
