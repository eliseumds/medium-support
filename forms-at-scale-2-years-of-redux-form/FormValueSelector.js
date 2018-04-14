import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// 'forms', or wherever you export redux-form's formValueSelector from
import { formValueSelector } from 'forms';

/*
  Example usage:

  * Get the value of a single form field:

    <FormValueSelector fieldName="phone">
      {phone => <CountryFlag country={getPhoneCountry(phone)} />}
    </FormValueSelector>

  * Select multiple fields:

    <FormValueSelector
      selector={(select, form, sectionPrefix) => ({
        result: Number(select('numA')) + Number(select('numB'))
      })}
    >
      {({result}) => <Box>Result: {result}</Box>}
    </FormValueSelector>

  * Or play around with all the values:

    <FormValueSelector
      selector={(select, form, sectionPrefix, values) => values}
    >
      {values => <Box>{JSON.stringify(values, null, 2)}</Box>}
    </FormValueSelector>
*/

@connect((state, props) => {
  const {
    form, sectionPrefix, fieldName, selector
  } = props;
  const valueSelector = formValueSelector(form);

  if (typeof selector === 'function') {
    const valueSelectorBoundToState = (...args) => valueSelector(state, ...args);

    return ({
      values: selector(
        valueSelectorBoundToState,
        form,
        sectionPrefix,
        form in state.form ?
          state.form[form].values :
          {}
      )
    });
  }

  return ({
    values: valueSelector(
      state,
      sectionPrefix ? `${sectionPrefix}.${fieldName}` : fieldName
    )
  });
})
class FormValueSelector extends Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    values: PropTypes.any,
  };

  render() {
    const { children, values } = this.props;

    return children(values) || null;
  }
}

export default function FormValueSelectorContextContainer(props, context) {
  const { _reduxForm } = context;

  return (
    <FormValueSelector
      {...props}
      form={props.form || _reduxForm.form}
      sectionPrefix={props.sectionPrefix || _reduxForm.sectionPrefix}
    />
  );
}

FormValueSelectorContextContainer.propTypes = {
  form: PropTypes.string,
  sectionPrefix: PropTypes.string
};

FormValueSelectorContextContainer.contextTypes = {
  _reduxForm: PropTypes.shape({
    form: PropTypes.string.isRequired,
    sectionPrefix: PropTypes.string
  }).isRequired
};
