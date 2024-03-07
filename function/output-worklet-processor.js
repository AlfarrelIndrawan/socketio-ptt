class WorkletProcessor extends AudioWorkletProcessor {
  constructor() {
      super();
  }
  process(inputList, outputList, parameters) {
    const sourceLimit = Math.min(inputList.length, outputList.length);
  
    for (let inputNum = 0; inputNum < sourceLimit; inputNum++) {
      const input = inputList[inputNum];
      const output = outputList[inputNum];
      const channelCount = Math.min(input.length, output.length);
  
      for (let channelNum = 0; channelNum < channelCount; channelNum++) {
        input[channelNum].forEach((sample, i) => {
          // Manipulate the sample
          output[channelNum][i] = sample;
        });
      }
    };
  
    return true;
  }
}
  
registerProcessor('worklet-processor', WorkletProcessor);
  