async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'hello' })
    });
    console.log('Status:', res.status);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      console.log('Audio size:', buffer.byteLength);
    } else {
      console.log('Error:', await res.text());
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
test();
