import { actionTypes } from 'redux-form';

const state = {};

// See https://github.com/erikras/redux-form/issues/2742
// This patch fixes this problem:
// https://github.com/erikras/redux-form/issues/2742#issuecomment-308780062
function onRegisterField(next, action, store) {
  if (__SERVER__) { // << injected by Webpack
    return store.getState().form[action.meta.form];
  }

  return next(action);
}

// See https://github.com/erikras/redux-form/issues/3435
function onInitialize(next, action) {
  // Bypass reinitialization
  if ('lastInitialValues' in action.meta) {
    return next(action);
  }

  state[action.meta.form] = (state[action.meta.form] || 0) + 1;

  return next(action);
}

// See https://github.com/erikras/redux-form/issues/3435
function onDestroy(next, action) {
  state[action.meta.form] = (state[action.meta.form] || 0) - 1;

  if (state[action.meta.form] <= 0) {
    return next(action);
  }

  // Drop the action
  return false;
}

export default function reduxFormPatchesMiddleware(store) {
  return next => action => {
    switch (action.type) {
      case actionTypes.REGISTER_FIELD:
        return onRegisterField(next, action, store);
      case actionTypes.DESTROY:
        return onDestroy(next, action);
      case actionTypes.INITIALIZE:
        return onInitialize(next, action);
      default:
        return next(action);
    }
  };
}
