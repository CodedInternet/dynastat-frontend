import Ember from "ember";
import msgpack from "npm:msgpack-lite";
'use strict';

export default Ember.Service.extend({
  pc: null,
  rxDc: null,
  txDc: null,
  states: Ember.A(),

  openConnection(signals) {
    let pc_config = {"iceServers": ["stun.stunprotocol.org"]},
      pc = new window.RTCPeerConnection(pc_config);
    this.set('pc', pc);

    let rxDc = pc.createDataChannel('data', {ordered: true, reliable: false}),
      txDc = pc.createDataChannel('command', {ordered: true, reliable: true});

    rxDc.onmessage = this.onDataMessage;

    this.set('rxDc', rxDc);
    this.set('txDc', txDc);

    signals.onmessage = (message) => {
      if (message.type === "answer") {
        pc.setRemoteDescription(new window.RTCSessionDescription(message));
      } else if (message.candidate) {
        pc.addIceCandidate(new window.RTCIceCandidate(message));
      }
    };

    pc.createOffer().then((offer) => {
      signals.send(offer);
    }).catch((reason) => {
      console.log(`Failed to create offer: ${reason}`);
    })
  },

  onDataMessage(event) {
    // process the event and extract the data
    let data = new Uint8Array(event.data),
      state = msgpack.decode(data);

    this.get('states').pushObject(state);
  },

  setMotor(name, value) {
    let tx = this.get('txDc');
    let json = JSON.stringify({cmd: "set_motor", name: name, value: value});
    tx.send(json);
  },

  latestState: Ember.computed('states', function() {
    return this.get('states').lastObject();
  })
});
