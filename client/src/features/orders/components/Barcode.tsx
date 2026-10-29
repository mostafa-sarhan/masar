import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const OPTIONS = {
  format: "code128",
  lineColor: "#000",
  width: 2,
  height: 30,
  displayValue: true, // shows the text below the barcode
  fontSize: 10,
};

export default function Barcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) JsBarcode(svgRef.current, value, OPTIONS);
  }, [value]);

  return <svg ref={svgRef}></svg>;
}
