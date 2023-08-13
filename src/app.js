import { Auth, getUser } from './auth';
import {
  getUserFragments,
  createFragment,
  getFragmentDataById,
  deleteFragmentById,
  updateFragmentById,
  getConvertedFragmentDataById,
} from './api';
var converted = false;

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
  if (!converted) {
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
  }

  // Add a button to update the fragment
  const updateButton = document.getElementById('updateBtn');
  updateButton.addEventListener('click', () => {
    updateFragment(fragmentId, contentType);
  });

  const convertButton = document.getElementById('convertBtn');
  convertButton.addEventListener('click', () => {
    convertFragment(fragmentId, contentType, body);
  });

  const closeButton = document.getElementById('closeBtn');
  closeButton.addEventListener('click', async () => {
    converted = false;
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

async function convertFragment(fragmentId, sourceContentType, modalBody) {
  converted = false;
  modalBody.innerHTML = '';

  // Display a dropdown for selecting the target content type
  const targetContentTypeSelect = document.createElement('select');
  targetContentTypeSelect.classList.add('form-select', 'mb-3');
  targetContentTypeSelect.id = 'targetContentTypeSelect';
  if (sourceContentType.startsWith('text/')) {
    targetContentTypeSelect.innerHTML = `
    <option value="text/plain">Plain Text</option>
    <option value="text/html">HTML</option>
    <option value="text/markdown">Markdown</option>
  `;
  } else if (sourceContentType.startsWith('application/json')) {
    targetContentTypeSelect.innerHTML = `<option value="text/plain">Plain Text</option>`;
  } else {
    targetContentTypeSelect.innerHTML = `
    <option value="image/jpg">JPEG</option>
    <option value="image/png">PNG</option>
    <option value="image/webp">WEBP</option>
    <option value="image/gif">GIF</option>
  `;
  }
  modalBody.appendChild(targetContentTypeSelect);

  // Display a "Convert" button
  const confirmConvertButton = document.createElement('button');
  confirmConvertButton.type = 'button';
  confirmConvertButton.classList.add('btn', 'btn-success', 'mt-3');
  confirmConvertButton.innerText = 'Confirm Convert';
  confirmConvertButton.addEventListener('click', async () => {
    await performConvert(fragmentId, sourceContentType, modalBody);
  });
  modalBody.appendChild(confirmConvertButton);
}

async function performConvert(fragmentId, sourceContentType, modalBody) {
  const user = await getUser();
  if (!user) {
    console.error('User not authenticated.');
    return;
  }

  const targetContentTypeSelect = modalBody.querySelector('#targetContentTypeSelect');
  const targetContentType = targetContentTypeSelect.value;

  // Get the fragment data
  const fragmentData = await getFragmentDataById(user, fragmentId);
  const content = fragmentData;

  // Perform the conversion based on source and target content types
  let convertedContent = content;
  if (sourceContentType.split(';')[0] === 'text/markdown') {
    console.log('targetContentType');
    if (targetContentType === 'text/plain') {
      // Convert Markdown to plain text
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'txt');
    } else if (targetContentType === 'text/html') {
      // Convert Markdown to HTML
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'html');
    }
  } else if (sourceContentType.split(';')[0] === 'text/html') {
    if (targetContentType === 'text/markdown') {
      // Convert HTML to Markdown
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'md');
    } else if (targetContentType === 'text/plain') {
      // Convert HTML to plain text
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'txt');
    }
  } else if (sourceContentType.split(';')[0] === 'image/jpg') {
    if (targetContentType === 'image/png') {
      // Convert JPEG to PNG
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'png');
    } else if (targetContentType === 'image/webp') {
      // Convert JPEG to webp
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'webp');
    } else if (targetContentType === 'image/gif') {
      // Convert JPEG to gif
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'gif');
    }
  } else if (sourceContentType.split(';')[0] === 'image/png') {
    if (targetContentType === 'image/jpg') {
      // Convert PNG to JPEG
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'jpg');
    } else if (targetContentType === 'image/webp') {
      // Convert PNG to webp
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'webp');
    } else if (targetContentType === 'image/gif') {
      // Convert PNG to gif
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'gif');
    }
  } else if (sourceContentType.split(';')[0] === 'image/webp') {
    if (targetContentType === 'image/png') {
      // Convert WEBP to PNG
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'png');
    } else if (targetContentType === 'image/jpg') {
      // Convert WEBP to JPEG
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'jpg');
    } else if (targetContentType === 'image/gif') {
      // Convert WEBP to gif
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'gif');
    }
  } else if (sourceContentType.split(';')[0] === 'image/gif') {
    if (targetContentType === 'image/png') {
      // Convert GIF to PNG
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'png');
    } else if (targetContentType === 'image/webp') {
      // Convert GIF to webp
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'webp');
    } else if (targetContentType === 'image/jpg') {
      // Convert GIF to JPEG
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'jpg');
    }
  } else if (sourceContentType.split(';')[0] === 'application/json') {
    if (targetContentType === 'text/plain') {
      // Convert JSON to text
      convertedContent = await getConvertedFragmentDataById(user, fragmentId, 'txt');
    }
  }

  if (sourceContentType.startsWith('text/') || sourceContentType.startsWith('application/json')) {
    modalBody.innerHTML = await convertedContent.text();
  } else {
    const buffer = await convertedContent.arrayBuffer();
    console.log(targetContentType);
    const blob = new Blob([buffer], { type: targetContentType });
    const imageUrl = URL.createObjectURL(blob);
    modalBody.innerHTML = `<img src="${imageUrl}" alt="Image" style="max-width:100%;max-height:100%;">`;
    // Revoke the Blob URL after the image has been displayed
    modalBody.querySelector('img').onload = () => {
      URL.revokeObjectURL(imageUrl);
    };
  }

  // Reload the updated data in the modal
  converted = true;
  await openModal(fragmentId);
}

// Wait for the DOM to load, then start the app
addEventListener('DOMContentLoaded', init);
