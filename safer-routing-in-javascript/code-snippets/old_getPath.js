// paths.js (auto-generated)
export default {
  user_profile: '/users/:userId/profile'
};

// MyComponent.js
import getPath from 'utils/routing/getPath';

getPath('user_profile', { userId: 'abc123' });
