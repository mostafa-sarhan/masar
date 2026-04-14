import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { ReactBarcode } from 'react-jsbarcode';


const Barcode = ({ value }) => {
    const svgRef = useRef(null);

  // Default options
    const defaultOptions = {
    format: "code128",
    lineColor: "#000",
    width: 2,
    height: 30,
    displayValue: true, // shows the text below the barcode
    fontSize: 10,
};

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, value, defaultOptions);
    }
  }, [value]);

  return <svg ref={svgRef}></svg>;
};

export default Barcode;
