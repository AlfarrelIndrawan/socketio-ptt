class WorkletProcessor extends AudioWorkletProcessor {
  constructor() {
      super();
      this.bufferSize = 512; 
  }
  process(inputs) {
    const inputChannel = inputs[0][0];
    const chunk = inputChannel.subarray(0, this.bufferSize);

    this.port.postMessage(chunk);

    return true;
  }
}
  
registerProcessor('worklet-processor', WorkletProcessor);
  