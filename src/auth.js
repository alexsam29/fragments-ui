import { Amplify, Auth } from 'aws-amplify';

// Configure Auth object to use Cognito User Pool
Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: process.env.AWS_COGNITO_POOL_ID,
    userPoolWebClientId: process.env.AWS_COGNITO_CLIENT_ID,

    // Hosted UI configuration
    oauth: {
      domain: process.env.AWS_COGNITO_HOSTED_UI_DOMAIN,
      scope: ['email', 'openid', 'phone'],
      redirectSignIn: process.env.OAUTH_SIGN_IN_REDIRECT_URL,
      redirectSignOut: process.env.OAUTH_SIGN_OUT_REDIRECT_URL,
      responseType: 'code',
    },
  },
});

/**
 * Get the authenticated user
 * @returns Promise<user>
 */
async function getUser() {
  try {
    // Get the user's info
    const currentAuthenticatedUser = await Auth.currentAuthenticatedUser();

    const username = currentAuthenticatedUser.username;
    console.log('The user is authenticated', username);

    // Get the user's Identity Token
    const idToken = currentAuthenticatedUser.signInUserSession.idToken.jwtToken;
    const accessToken = currentAuthenticatedUser.signInUserSession.accessToken.jwtToken;

    // Return simplified "user" object
    return {
      username,
      idToken,
      accessToken,
      // Generate headers with Authorization info
      authorizationHeaders: (type = 'application/json') => {
        const headers = { 'Content-Type': type };
        headers['Authorization'] = `Bearer ${idToken}`;
        return headers;
      },
    };
  } catch (err) {
    console.log(err);
    return null;
  }
}

export { Auth, getUser };