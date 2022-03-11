import React from "react";
import { Link } from "react-router-dom";

import "../styles/home-page.scss";

export const HomePage: React.FC = () => {
  return <div className="home-page">
    <Link to="/pick-modules" className="button">Pick Modules To Learn Today</Link>
    <Link to="/pick-missions" className="button">Find Challenge</Link>
    <Link to="/mod-settings" className="button">modSettings.xml</Link>
  </div>;
};
