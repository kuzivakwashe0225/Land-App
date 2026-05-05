const fetch = require('node-fetch');

async function testSignup() {
    try {
        const res = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: "Test",
                lastName: "User",
                email: "testdb@example.com",
                phoneNumber: "0771234567",
                nationalId: "12-345678X90",
                password: "password123"
            })
        });
        const data = await res.json();
        console.log(data);
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

testSignup();
