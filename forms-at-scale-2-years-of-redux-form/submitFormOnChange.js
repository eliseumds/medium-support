import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { debounce, get, isEqual, omit } from 'lodash';

const DEFAULT_DEBOUNCE_TIME = 200;

export default function submitFormOnChange(
  debounceTime = DEFAULT_DEBOUNCE_TIME,
  isActive = () => true
) {
  return WrappedComponent => {
    @connect((state, props) => ({
      _form: state.form[props.form]
    }))
    class SubmitOnChange extends PureComponent {
      static propTypes = {
        handleSubmit: PropTypes.func.isRequired,
        dirty: PropTypes.bool.isRequired,
        valid: PropTypes.bool.isRequired,
      };

      componentDidUpdate(prevProps) {
        if (!isActive(this.props)) {
          return;
        }

        const prevValues = get(prevProps, ['_form', 'values']);
        const curValues = get(this.props, ['_form', 'values']);

        if (this.props.dirty && this.props.valid) {
          const areValuesDifferent = !isEqual(prevValues, curValues);
          const hasMetaChanged = prevProps.dirty !== this.props.dirty ||
            prevProps.valid !== this.props.valid;

          if (areValuesDifferent || hasMetaChanged) {
            this.debouncedSubmit();
          }
        }
      }

      componentWillUnmount() {
        this.debouncedSubmit.cancel();
      }

      debouncedSubmit = debounce(() => {
        this.props.handleSubmit();
      }, debounceTime)

      render() {
        return <WrappedComponent {...omit(this.props, '_form')} />;
      }
    }

    return SubmitOnChange;
  };
}
