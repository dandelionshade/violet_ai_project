async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'hello' })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 100));
  } catch (e) {
    console.error(e);
  }
}
test();
