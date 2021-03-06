import Ember from "ember";

'use strict';

export default Ember.Service.extend({
  pc: null,
  rxDc: null,
  rxOpen: false,
  txDc: null,
  txOpen: false,
  websockets: Ember.inject.service(),
  i: 0,
  rxfps: 0,

  openConnection(signalUri, iceServers) {
    this.set('iceServers', iceServers);
    let socket = this.get('websockets').socketFor(signalUri);
    socket.on('message', this.onSignal, this);
    socket.on('open', this.openWebRTC, this);
    this.set('socket', socket);
  },

  openWebRTC() {
    let pc_config = {
      'iceServers': this.get('iceServers')
    };
    let pc = new window.RTCPeerConnection(pc_config);
    this.set('pc', pc);

    let rxDc = pc.createDataChannel('data', {ordered: true, reliable: false}),
      txDc = pc.createDataChannel('command', {ordered: true, reliable: true});

    pc.onnegotiationneeded = () => {
      if (this.get('websockets').isWebSocketOpen(this.get('socket')))
        this.createOffer();
    };

    pc.onicecandidate = (evt) => {
      if (this.get('websockets').isWebSocketOpen(this.get('socket')) && evt.candidate)
        this.get('socket').send(JSON.stringify(evt.candidate));
    };

    txDc.onopen = () => {
      this.set('txOpen', true);
    };
    txDc.onclose = () => {
      this.set('txOpen', false);
    };
    rxDc.onopen = () => {
      this.set('rxOpen', true);
      setInterval(() => {
        this.set('fps', this.get('fpsf'));
        this.set('rxfps', 0);
      }, 1000)
    };
    rxDc.onclose = () => {
      this.set('rxOpen', false);
    };
    rxDc.onmessage = this.onDataMessage.bind(this);

    this.set('rxDc', rxDc);
    this.set('txDc', txDc);
  },

  onSignal(message) {
    let pc = this.get('pc'),
      data = JSON.parse(message.data);
    if (data.type === "answer" && pc.signalingState === "have-local-offer") {
      pc.setRemoteDescription(new window.RTCSessionDescription(data))
    } else if (data.candidate) {
      pc.addIceCandidate(new window.RTCIceCandidate(data));
    }
  },

  createOffer() {
    const socket = this.get('socket'),
      pc = this.get('pc');
    pc.createOffer().then((offer) => {
      pc.setLocalDescription(offer);
      socket.send(JSON.stringify(offer));
    }).catch((reason) => {
      console.log(`Failed to create offer: ${reason}`);
    })
  },

  onDataMessage(event) {
    // process the event and extract the data
    let data = event.data;
    this.set('state', JSON.parse(data));
    this.set('rxfps', this.get('rxfps') + 1);
  },

  homeMotor(name) {
    let tx = this.get('txDc');
    let json = JSON.stringify({cmd: "home_motor", name: name});
    tx.send(json);
  },

  setMotor(name, value) {
    let tx = this.get('txDc');
    let json = JSON.stringify({cmd: "set_motor", name: name, value: value});
    tx.send(json);
  },
});
