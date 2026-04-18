import { EdgeTTS } from 'node-edge-tts';

async function test() {
  try {
    const tts = new EdgeTTS();
    console.log("Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(tts)));
  } catch (e) {
    console.error(e);
  }
}
test();
