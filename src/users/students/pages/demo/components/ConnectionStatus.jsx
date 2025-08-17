import React from "react";
import { FaWifi, FaTimes, FaCircle } from "react-icons/fa";
import "./ConnectionStatus.css";

const ConnectionStatus = ({ isConnected, className = "" }) => {
  return (
    <div
      className={`connectionStatus ${
        isConnected ? "connected" : "disconnected"
      } ${className}`}
    >
      <div className="statusIndicator">
        <FaCircle
          className={`statusDot ${isConnected ? "connected" : "disconnected"}`}
        />
        <span className="statusText">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <div className="connectionIcon">
        {isConnected ? <FaWifi /> : <FaTimes />}
      </div>
    </div>
  );
};

export default ConnectionStatus;
