const apiUrl = process.env.API_URL || 'http://localhost:8080';

/**
 * Given an authenticated user, request all fragments for this user
 * @param {*} user A user object for authentication
 * @param {boolean} expand Get Fragment metadata
 * @returns {Promise<any>} Object containing array of Fragment IDs
 */
export async function getUserFragments(user, expand = false) {
  console.log('Requesting user fragments data...');
  try {
    const url = expand ? `${apiUrl}/v1/fragments?expand=1` : `${apiUrl}/v1/fragments`;
    const res = await fetch(url, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

/**
 * Given an authenticated user and data, create a new fragment
 * @param {*} user A user object for authentication
 * @param {} fragmentData Data for the fragment
 * @returns {Promise<any>} Created fragment object
 */
export async function createFragment(user, fragmentData, contentType) {
  console.log('Creating a new fragment...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: {
        ...user.authorizationHeaders(contentType.split(';')[0]),
      },
      body: fragmentData,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error('Unable to create a new fragment', { err });
  }
}

/**
 * Given an authenticated user, request fragment data for specified fragment ID
 * @param {*} user A user object for authentication
 * @param {String} fragmentId ID for specific fragment
 * @returns {Promise<any>} Data for the requested fragment
 */
export async function getFragmentDataById(user, fragmentId) {
  console.log('Getting fragment data by ID...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    return await res;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

/**
 * Given an authenticated user and data, delete a fragment
 * @param {*} user A user object for authentication
 * @param {} fragmentData Data for the fragment
 * @returns {Promise<any>} Confirmation response
 */
export async function deleteFragmentById(user, fragmentId) {
  console.log('Deleting fragment...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'DELETE',
      headers: {
        ...user.authorizationHeaders(),
      },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error('Unable to delete a new fragment', { err });
  }
}

export async function updateFragmentById(user, fragmentId, data, contentType) {
  console.log('Updating fragment data by ID...');
  console.log(contentType);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'PUT',
      headers: {
        ...user.authorizationHeaders(contentType.split(';')[0]),
      },
      body: data,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    return await res;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}
