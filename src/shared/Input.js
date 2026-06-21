import React from "react";
import PropTypes from "prop-types";

// Supporting passing extra props via rest syntax.
// Extra props are being assigned to the input.
function Input({ id, label, type, value, onChange, ...additionalInputProps }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <br />
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        {...additionalInputProps}
      />
    </div>
  );
}

Input.propTypes = 
{
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["text", "number", "password", "email", "phone"]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired
};

Input.defaultProps = {
  type: "text"
};

export default Input;
