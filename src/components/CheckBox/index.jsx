import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Checkbox extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    handleCheckboxChange: PropTypes.func.isRequired,
    checked: PropTypes.bool
  };

  toggleCheckboxChange = () => {
    const { handleCheckboxChange, label } = this.props;
    handleCheckboxChange(label);
  };

  render() {
    const { label, classes, checked = false } = this.props;

    return (
      <div className={classes}>
        <label>
          <input
            type="checkbox"
            value={label}
            checked={checked}
            onChange={this.toggleCheckboxChange}
          />

          <span className="checkmark">{label}</span>
        </label>
      </div>
    );
  }
}

export default Checkbox;
