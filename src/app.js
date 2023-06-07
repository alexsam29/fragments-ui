import { Auth, getUser } from './auth';
import { getUserFragments, createFragment, getFragmentDataById } from './api';

async function init() {
  // UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const fragmentForm = document.querySelector('#fragmentForm');
  const fragmentInput = document.querySelector('#fragmentInput');
  const clearBtn = document.querySelector('#clearBtn');
  const fragmentsList = document.querySelector('#fragmentsList');

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
        const fragment = await createFragment(user, fragmentText);
        fragmentInput.value = '';

        // Add the new fragment data to the list
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.innerHTML = `
          <span>Fragment ID: ${fragment.id}</span>
          <button type="button" class="btn btn-primary btn-sm ms-2 viewBtn float-end" data-bs-toggle="modal" data-bs-target="#dataModal">View</button>
        `;
        fragmentsList.querySelector('ul').appendChild(listItem);
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

  getUserFragments(user);

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

// Function to open the modal
async function openModal(fragmentId) {
  const user = await getUser();

  const title = document.getElementById('dataModalTitle');
  title.innerText = "Fragment Data";

  const body = document.getElementById('dataModalBody');
  const fragmentData = await getFragmentDataById(user, fragmentId);
  body.innerText = fragmentData;
}

// Wait for the DOM to load, then start the app
addEventListener('DOMContentLoaded', init);