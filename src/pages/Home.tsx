import React from "react";
import { Link } from "react-router-dom";

export const HomePage: React.FC = () => {
  return (
    <Link to="/pick-modules" className="button">Pick Modules To Learn Today</Link>
  );
};
