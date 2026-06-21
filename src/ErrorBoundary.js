import React from "react";
import badlink from "./images/badlink.jpg"; // Import the image

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props); // this must run before declaring state
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // whatever we return here will be the new state
    return { hasError: true };
  }

  // We put our JSX in here.
  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <h1>Oh no! I messed up!</h1>
          <img src={badlink} alt="Error" style={{ width: "500px", height: "500px" }} />
        </div>
      );
    }
    // Show whatever is nested underneath this ErrorBoundary component
    return this.props.children;
  }
}

export default ErrorBoundary;
