import { Auth, getUser } from './auth';
import { getUserFragments, createFragment, getFragmentDataById } from './api';

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
        const formData = new FormData();
        formData.append('file', selectedFile);
        const response = await createFragment(user, formData, fragmentType.value);
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
    case contentType.includes('text/css'):
      body.innerText = await fragmentData.text();
      break;
    case contentType.includes('text/csv'):
      body.innerText = await fragmentData.text();
      break;
    case contentType.includes('text/javascript'):
      body.innerText = await fragmentData.text();
      break;
    case contentType.includes('text/xml'):
      body.innerText = await fragmentData.text();
      break;
    case contentType.includes('text/markdown'):
      body.innerText = await fragmentData.text();
      break;
    case contentType.includes('text/javascript'):
      body.innerText = await fragmentData.text();
      break;
    default:
      body.innerText = JSON.stringify(await fragmentData.json());
      break;
  }
}

/**
 * Add the fragment to fragment list
 * @param {*} fragmentId ID of the Fragment
 */
function addFragmentToList(fragment, expand = false) {
  const listItem = document.createElement('li');
  listItem.classList.add('list-group-item');
  if (expand) {
    listItem.innerHTML = `<span><b>Fragment ID:</b> ${fragment.id}<br>
                          Owner ID: ${fragment.ownerId}<br>
                          Size: ${fragment.size}<br>
                          Type: ${fragment.type}<br>
                          Created ${new Date(fragment.created).toDateString()} 
                          ${new Date(fragment.created).toLocaleTimeString()}<br>
                          Updated: ${new Date(fragment.updated).toDateString()} 
                          ${new Date(fragment.updated).toLocaleTimeString()}</span>
                          <button type="button" class="btn btn-primary btn-md ms-2 viewBtn float-end translate-middle" data-bs-toggle="modal" data-bs-target="#dataModal">View</button>`;
  } else {
    listItem.innerHTML = `
          <span><b>Fragment ID:</b> ${fragment}</span>
          <button type="button" class="btn btn-primary btn-sm ms-2 viewBtn float-end" data-bs-toggle="modal" data-bs-target="#dataModal">View</button>
        `;
  }

  fragmentsList.querySelector('ul').appendChild(listItem);
}

// Wait for the DOM to load, then start the app
addEventListener('DOMContentLoaded', init);
