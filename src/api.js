const apiUrl = process.env.API_URL || 'http://localhost:8080';

// Given an authenticated user, request all fragments for this user
export async function getUserFragments(user) {
  console.log('Requesting user fragments data...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      // Generate headers with the proper Authorization bearer token
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Got user fragments data', { data });
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

// Given an authenticated user and text, create a new fragment
export async function createFragment(user, fragmentText) {
  console.log('Creating a new fragment...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: {
        ...user.authorizationHeaders('text/plain'),
      },
      body: fragmentText,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const data = await res.text();
    return JSON.parse(data);
    
  } catch (err) {
    console.error('Unable to create a new fragment', { err });
  }
}