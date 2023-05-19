import { Auth, getUser } from './auth';

async function init() {
  // UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');

  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI
    Auth.signOut();
  };

  // Verify if user is signed in
  const user = await getUser();
  if (!user) {
    logoutBtn.disabled = true;
    return;
  }

  console.log({ user });
  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;
}

// Wait for the DOM to load, then start the app
addEventListener('DOMContentLoaded', init);