const socket = io("http://192.168.0.168:3000");

let audioStream;
let audioContext;
let isPushToTalkEnabled = false;

function joinChannel() {
  const channel = document.getElementById('channelInput').value;
  createAudioContext();
  socket.emit('joinChannel', channel);
}

// Function to toggle push to talk
async function togglePushToTalk() {
  console.log("enabled?", isPushToTalkEnabled)
    if (!isPushToTalkEnabled) {
      // Enable push to talk
      await startAudio();
      isPushToTalkEnabled = true;
    } else {
      // Disable push to talk
      stopAudio();
      isPushToTalkEnabled = false;
    }
}
  
// Attach the togglePushToTalk function to a button click event
document.getElementById('pushToTalkButton').addEventListener('click', togglePushToTalk);

function createAudioContext() {
  audioContext = new AudioContext({sampleRate: 12000});
}

async function startAudio() {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStream = stream;

      // Connect the stream to the AudioWorkletNode
      const source = audioContext.createMediaStreamSource(stream);
      // Create an AudioWorkletNode for audio processing
      await audioContext.audioWorklet.addModule('audio-worklet-processor.js')
      const audioWorkletNode = new AudioWorkletNode(audioContext, 'worklet-processor');
      
      source.connect(audioWorkletNode)
      // audioWorkletNode.connect(audioContext.destination)
      audioWorkletNode.port.onmessage = (event) => {
        // Handling data from the processor.
        socket.emit('audioStream', { channel: document.getElementById('channelInput').value, audio: event.data });
      };
    } catch (error) {
      console.log("Error: ", error)
    }
}

function stopAudio() {
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
    audioStream = null;
  }
}

socket.on('userJoined', (userId) => {
  console.log(`User joined the channel: ${userId}`);
});

socket.on('userLeft', (userId) => {
  console.log(`User left the channel: ${userId}`);
});

socket.on('channelUsers', (users) => {
  const userList = document.getElementById('userList');
  userList.innerHTML = '';
  users.forEach((user) => {
    const listItem = document.createElement('li');
    listItem.textContent = user;
    userList.appendChild(listItem);
  });
});

// Handle the server's response, e.g., handle incoming audio from other users
socket.on('audioStream', async (data) => {
  try {
    // Handling data from the processor.
    const float32Array = new Float32Array(data.audio);
    // const float32Array = data.audio;

    // Convert Float32Array to AudioBuffer
    const audioBuffer = audioContext.createBuffer(1, float32Array.length, audioContext.sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    // Create an audio buffer source node
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Connect the source to the audio context's destination (e.g., speakers)
    source.connect(audioContext.destination);

    // Start playing the audio
    source.start();
  } catch (error) {
    console.error('Error during audio playback:', error);
  }
});
