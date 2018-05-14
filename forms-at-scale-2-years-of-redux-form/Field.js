/* eslint-disable no-underscore-dangle */
// @flow
// From https://github.com/erikras/redux-form/issues/2761#issuecomment-369934818
import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import { Field as ReduxFormField, clearFields, change } from 'redux-form';

export default class Field extends ReduxFormField {
  static propTypes = {
    name: PropTypes.string.isRequired,
    clearOnUnmount: PropTypes.bool,
    resetToInitialValue: PropTypes.bool,
  };

  componentWillUnmount() {
    this.clearFieldIfNecessary(this.props);

    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }
  }

  componentWillReceiveProps(nextProps: Object, nextContext: Object) {
    if (super.componentWillReceiveProps) {
      super.componentWillReceiveProps(nextProps, nextContext);
    }

    if (nextProps.name !== this.props.name && this.props.clearOnUnmount) {
      // clear previous field
      this.clearFieldIfNecessary(this.props);
    }
  }

  clearFieldIfNecessary(props: Object) {
    const {
      name,
      clearOnUnmount,
      resetToInitialValue
    } = props;
    // this.context comes from "ReduxFormField"
    const {
      form,
      pristine,
      dispatch,
      initialValues,
      sectionPrefix,
    } = this.context._reduxForm;

    if (clearOnUnmount && !pristine) {
      const computedName = sectionPrefix ? `${sectionPrefix}.${name}` : name;
      const initialValue = get(initialValues, computedName);

      let action;

      if (initialValue && resetToInitialValue) {
        action = change(form, computedName, initialValue);
      } else {
        action = clearFields(form, false, false, computedName);
      }

      dispatch(action);
    }
  }

  render() {
    const reduxFormFieldProps = omit(
      this.props,
      'clearOnUnmount',
      'resetToInitialValue'
    );

    return <ReduxFormField {...reduxFormFieldProps} />;
  }
}
