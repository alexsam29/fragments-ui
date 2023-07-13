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
    if (fragmentText) {
      const user = await getUser();
      if (user) {
        const response = await createFragment(user, fragmentText, fragmentType.value);
        fragmentInput.value = '';
        addFragmentToList(response.fragment.id);
      }
    }
  };

  // Handle clear button click
  clearBtn.onclick = () => {
    fragmentInput.value = '';
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
    const fragmentId = event.target.previousElementSibling.textContent.replace('Fragment ID: ', '');
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
function addFragmentToList(fragmentId) {
  const listItem = document.createElement('li');
  listItem.classList.add('list-group-item');
  listItem.innerHTML = `
          <span>Fragment ID: ${fragmentId}</span>
          <button type="button" class="btn btn-primary btn-sm ms-2 viewBtn float-end" data-bs-toggle="modal" data-bs-target="#dataModal">View</button>
        `;
  fragmentsList.querySelector('ul').appendChild(listItem);
}

// Wait for the DOM to load, then start the app
addEventListener('DOMContentLoaded', init);
