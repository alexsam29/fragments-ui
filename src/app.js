import { Auth, getUser } from './auth';
import {
  getUserFragments,
  createFragment,
  getFragmentDataById,
  deleteFragmentById,
  updateFragmentById,
} from './api';

async function init() {
  // UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const fragmentForm = document.querySelector('#fragmentForm');
  const fragmentInput = document.querySelector('#fragmentInput');
  const fragmentType = document.querySelector('#contentTypeSelect');
  const clearBtn = document.querySelector('#clearBtn');
  const viewSwitch = document.getElementById('viewSwitch');

  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI
    Auth.signOut();
  };

  // Handle form submission
  fragmentForm.onsubmit = async (event) => {
    event.preventDefault();
    const fragmentText = fragmentInput.value;
    const selectedFile = imageInput.files[0];

    if (fragmentText && !selectedFile) {
      const user = await getUser();
      if (user) {
        const response = await createFragment(user, fragmentText, fragmentType.value);
        fragmentInput.value = '';
        addFragmentToList(
          viewSwitch.checked ? response.fragment : response.fragment.id,
          viewSwitch.checked ? true : false
        );
      }
    } else if (!fragmentText && selectedFile) {
      const user = await getUser();
      if (user) {
        const contentType = selectedFile.type;
        const formData = new FormData();
        formData.append('file', selectedFile);
        const response = await createFragment(user, formData, contentType);
        imageInput.value = '';
        addFragmentToList(
          viewSwitch.checked ? response.fragment : response.fragment.id,
          viewSwitch.checked ? true : false
        );
      }
    }
  };

  // Event listener to disable inputs
  fragmentInput.addEventListener('input', () => {
    if (fragmentInput.value) {
      imageInput.disabled = true;
    } else {
      imageInput.disabled = false;
    }
  });

  imageInput.addEventListener('change', () => {
    if (imageInput.files.length > 0) {
      fragmentInput.disabled = true;
      fragmentType.disabled = true;
    } else {
      fragmentInput.disabled = false;
      fragmentType.disabled = false;
    }
  });

  viewSwitch.addEventListener('change', () => {
    const fragmentList = document.querySelector('#fragmentList');
    fragmentList.innerHTML = '';
    if (viewSwitch.checked) {
      // Toggle to metadata view
      // Make a new API request to fetch metadata\
      getUserFragments(user, true).then((results) => {
        results.fragments.forEach((metadata) => {
          //addFragmentToList(fragmentId);
          console.log(metadata);
          addFragmentToList(metadata, true);
        });
      });
    } else {
      getUserFragments(user).then((results) => {
        results.fragments.forEach((fragmentId) => {
          addFragmentToList(fragmentId);
        });
      });
    }
  });

  // Handle clear button click
  clearBtn.onclick = () => {
    fragmentInput.value = '';
    imageInput.value = '';
    fragmentInput.disabled = false;
    imageInput.disabled = false;
    fragmentType.disabled = false;
  };

  // Verify if user is signed in
  const user = await getUser();
  if (!user) {
    logoutBtn.disabled = true;
    return;
  }

  getUserFragments(user).then((results) => {
    results.fragments.forEach((fragmentId) => {
      addFragmentToList(fragmentId);
    });
  });

  console.log({ user });
  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;
}

// Event delegation to handle click event on dynamically added buttons
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('viewBtn')) {
    const fragmentId = event.target.previousElementSibling.textContent
      .replace('Fragment ID: ', '')
      .split(' ')[0];
    openModal(fragmentId);
  } else if (event.target.classList.contains('deleteBtn')) {
    const fragmentId = event.target.getAttribute('data-fragment-id');
    deleteFragment(fragmentId);
  }
});

/**
 * Function to open the modal and view fragment data
 * @param {*} fragmentId  ID of the fragment
 */
async function openModal(fragmentId) {
  const user = await getUser();

  const title = document.getElementById('dataModalTitle');
  title.innerText = 'Fragment Data';

  const body = document.getElementById('dataModalBody');
  const fragmentData = await getFragmentDataById(user, fragmentId);

  const contentType = fragmentData.headers.get('content-type');

  // TODO: convert data to HTML format to display.
  switch (true) {
    case contentType.includes('text/plain'):
      body.innerText = await fragmentData.text();
      break;
    case contentType.includes('text/html'):
      body.innerHTML = await fragmentData.text();
      break;
    case contentType.includes('text/markdown'):
      body.innerText = await fragmentData.text();
      break;
    case contentType.startsWith('image/'):
      try {
        const buffer = await fragmentData.arrayBuffer();
        console.log(contentType);
        console.log(buffer);
        const blob = new Blob([buffer], { type: contentType });
        const imageUrl = URL.createObjectURL(blob);
        body.innerHTML = `<img src="${imageUrl}" alt="Image" style="max-width:100%;max-height:100%;">`;
        // Revoke the Blob URL after the image has been displayed
        body.querySelector('img').onload = () => {
          URL.revokeObjectURL(imageUrl);
        };
      } catch (error) {
        console.error('Error displaying image:', error);
      }
      break;
    default:
      body.innerText = JSON.stringify(await fragmentData.json());
      break;
  }

  // Add a button to update the fragment
  const updateButton = document.getElementById('updateBtn');
  updateButton.addEventListener('click', () => {
    updateFragment(fragmentId, contentType);
  });
}

/**
 * Add the fragment to fragment list
 * @param {*} fragmentId ID of the Fragment
 */
function addFragmentToList(fragment, expand = false) {
  const listItem = document.createElement('li');
  listItem.classList.add('list-group-item');
  listItem.setAttribute('data-fragment-id', fragment ? fragment : fragment.id);

  // Create a delete button
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.classList.add('btn', 'btn-danger', 'btn-md', 'ms-2', 'float-end');
  deleteButton.innerText = 'Delete';
  deleteButton.addEventListener('click', () => {
    deleteFragment(fragment ? fragment : fragment.id);
  });

  if (expand) {
    listItem.innerHTML = `<span><b>Fragment ID:</b> ${fragment.id}<br>
                          Owner ID: ${fragment.ownerId}<br>
                          Size: ${fragment.size}<br>
                          Type: ${fragment.type}<br>
                          Created ${new Date(fragment.created).toDateString()} 
                          ${new Date(fragment.created).toLocaleTimeString()}<br>
                          Updated: ${new Date(fragment.updated).toDateString()} 
                          ${new Date(fragment.updated).toLocaleTimeString()}</span>
                          <button type="button" class="btn btn-primary btn-md ms-2 viewBtn float-end" data-bs-toggle="modal" data-bs-target="#dataModal">View</button>`;
  } else {
    listItem.innerHTML = `
          <span><b>Fragment ID:</b> ${fragment}</span>
          <button type="button" class="btn btn-primary btn-md ms-2 viewBtn float-end" data-bs-toggle="modal" data-bs-target="#dataModal">View Data</button>`;
  }

  // Append the delete button to the list item
  listItem.appendChild(deleteButton);

  fragmentsList.querySelector('ul').appendChild(listItem);
}

async function deleteFragment(fragmentId) {
  const user = await getUser();
  const res = await deleteFragmentById(user, fragmentId);

  if (res.status === 'ok') {
    const listItem = document.querySelector(`[data-fragment-id="${fragmentId}"]`);
    if (listItem) {
      listItem.remove();
    }
  }
}

async function updateFragment(fragmentId, contentType) {
  const modalBody = document.getElementById('dataModalBody');
  modalBody.innerHTML = '';

  // Add a textarea for text fragments or an input for image fragments
  if (contentType.includes('text')) {
    const textarea = document.createElement('textarea');
    textarea.classList.add('form-control');
    textarea.rows = 5;
    modalBody.appendChild(textarea);
  } else if (contentType.startsWith('image/')) {
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'image/*';
    modalBody.appendChild(inputFile);
  }

  // Add an update button
  const confirmButton = document.createElement('button');
  confirmButton.type = 'button';
  confirmButton.classList.add('btn', 'btn-success', 'mt-3');
  confirmButton.innerText = 'Confirm Update';
  confirmButton.addEventListener('click', async () => {
    await performUpdate(fragmentId, contentType, modalBody);
  });

  modalBody.appendChild(confirmButton);
}

async function performUpdate(fragmentId, contentType, modalBody) {
  const user = await getUser();
  if (!user) {
    console.error('User not authenticated.');
    return;
  }

  const updatedData = contentType.includes('text')
    ? modalBody.querySelector('textarea').value
    : modalBody.querySelector('input[type="file"]').files[0];

  if (!updatedData) {
    console.error('No data provided for update.');
    return;
  }

  try {
    if (contentType.includes('text')) {
      await updateFragmentById(user, fragmentId, updatedData, contentType);
    } else if (contentType.startsWith('image/')) {
      await updateFragmentById(user, fragmentId, updatedData, contentType);
    }

    // Reload the updated data in the modal
    await openModal(fragmentId);
  } catch (error) {
    console.error('Error updating fragment:', error);
  }
}

// Wait for the DOM to load, then start the app
addEventListener('DOMContentLoaded', init);
