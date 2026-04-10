async function login() {
  const user = document.getElementById('user').value;
  const pass = document.getElementById('pass').value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user, pass })
  });

  const data = await res.json();

  if (data.success) {
    alert('Login OK');
    window.location.href = '/admin.html';
  } else {
    alert('Login inválido');
  }
}
