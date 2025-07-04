import { useEffect, useState } from "react";
import { dateUpdate } from "../Query";
import DropdownData from "./DropdownContext";

function Header() {
  const [asOfDate, setAsOfDate] = useState(null);
  useEffect(() => {
    dateUpdate().then((response) => {
      setAsOfDate(response);
    });
  }, []);

  return (
    <>
      <header
        slot="header"
        id="header-title"
        style={{
          display: "flex",
          width: "100%",
          padding: "0 1rem",
          borderStyle: "solid",
          borderBottomWidth: "6px",
          height: "70px",
        }}
      >
        <img
          src="https://EijiGorilla.github.io/Symbols/Projec_Logo/DOTr_Logo_v2.png"
          alt="DOTr Logo"
          height={"55px"}
          width={"55px"}
          style={{ marginBottom: "auto", marginTop: "auto" }}
        />
        <b className="headerTitle">MMSP TBM Tunnel</b>
        <div className="date">{!asOfDate ? "" : "As of " + asOfDate}</div>

        {/* Dropdown component */}
        <DropdownData />

        <img
          src="https://EijiGorilla.github.io/Symbols/Projec_Logo/MMSP.png"
          alt="GCR Logo"
          height={"50px"}
          width={"75px"}
          style={{
            marginBottom: "auto",
            marginTop: "auto",
            marginLeft: "1rem",
            marginRight: "1.5rem",
          }}
        />
      </header>
    </>
  );
}

export default Header;
