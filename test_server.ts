async function test() {
  try {
    const res = await fetch('http://localhost:3000/');
    console.log('Status:', res.status);
  } catch (e) {
    console.error(e);
  }
}
test();
