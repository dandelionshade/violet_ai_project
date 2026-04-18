async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello' })
    });
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Response:', data);
    } else {
      console.log('Error:', await res.text());
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
test();
