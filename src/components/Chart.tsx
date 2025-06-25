import { useEffect, useRef, useState, use } from "react";
import { tbmTunnelLayer } from "../layers";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Responsive from "@amcharts/amcharts5/themes/Responsive";

import "../App.css";
import {
  cutterHeadPositionData,
  generateTbmTunnelData,
  segmentedLengthData,
  tbmCutterHeadSpotData,
  thousands_separators,
  zoomToLayer,
} from "../Query";
import "@esri/calcite-components/dist/components/calcite-tabs";
import { CalciteTabs } from "@esri/calcite-components-react";
import { MyContext } from "../App";
import { ArcgisScene } from "@arcgis/map-components/dist/components/arcgis-scene";

// Dispose function
function maybeDisposeRoot(divId: any) {
  am5.array.each(am5.registry.rootElements, function (root) {
    if (root.dom.id === divId) {
      root.dispose();
    }
  });
}

// Draw chart
const Chart = () => {
  const { contractpackages, segmentlines } = use(MyContext);
  const arcgisScene = document.querySelector("arcgis-scene") as ArcgisScene;

  const chartRef = useRef<unknown | any | undefined>({});
  const [chartData, setChartData] = useState([]);
  const [cutterHeadPositionNo, setCutterHeadPositionNo] = useState([]);

  const [segmentedLength, setSegementedLength] = useState(null);

  const chartID = "gauge-bar";

  useEffect(() => {
    generateTbmTunnelData(contractpackages, segmentlines).then(
      (response: any) => {
        setChartData(response);
      }
    );

    // zoomToLayer(tbmTunnelLayer, arcgisScene);

    cutterHeadPositionData(contractpackages, segmentlines).then(
      (response: any) => {
        setCutterHeadPositionNo(response);
      }
    );

    tbmCutterHeadSpotData(contractpackages, segmentlines);

    // Segmented Length
    segmentedLengthData(contractpackages, segmentlines).then(
      (response: any) => {
        // console.log(response === 0);
        console.log(response === null);
        setSegementedLength(response);
      }
    );
  }, [contractpackages, segmentlines]);

  const chartTitleColor = am5.color("#d4ff33"); // yellow green
  const percentProgressLabelColor = am5.color("#00C3FF"); // light blue
  const strokeOtherColor = am5.color("#c5c5c5"); // grey

  // Utility Chart
  useEffect(() => {
    maybeDisposeRoot(chartID);

    var root = am5.Root.new(chartID);
    root.container.children.clear();
    root._logo?.dispose();

    // Set themesf
    // https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([
      am5themes_Animated.new(root),
      am5themes_Responsive.new(root),
    ]);
    var chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        startAngle: -180,
        endAngle: 0,
        radius: am5.percent(90), // size of overall chart
        innerRadius: -20, // expand inward,
        y: -50,
        // paddingBottom: -40,
        // paddingTop: -40,
      })
    );
    chartRef.current = chart;

    chart.children.unshift(
      am5.Label.new(root, {
        text: "Completed",
        fontSize: "2rem",
        textAlign: "center",
        fill: percentProgressLabelColor,
        x: am5.percent(50),
        centerX: am5.percent(50),
        y: am5.percent(100),
        centerY: am5.percent(10),
      })
    );

    chart.children.unshift(
      am5.Label.new(root, {
        text: "[bold]" + thousands_separators(chartData[1]),
        fontSize: "2.8rem",
        textAlign: "center",
        fill: chartTitleColor,
        x: am5.percent(50),
        centerX: am5.percent(50),
        y: am5.percent(65),
        centerY: am5.percent(80),
      })
    );

    var axisRenderer = am5radar.AxisRendererCircular.new(root, {
      innerRadius: am5.percent(120), //gagues width becomes thicker outward
      strokeOpacity: 1,
      minGridDistance: 30,
    });

    // Enable ticks
    axisRenderer.ticks.template.setAll({
      visible: true,
      strokeOpacity: 0.5,
      length: -6,
      //inside: true,
      stroke: strokeOtherColor,
    });

    axisRenderer.grid.template.setAll({
      stroke: root.interfaceColors.get("background"),
      visible: false,
      strokeOpacity: 0,
    });

    var xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0,
        min: 0,
        max: 100,
        strictMinMax: true,
        renderer: axisRenderer,
      })
    );

    // Axis labels properties
    xAxis.get("renderer").labels.template.setAll({
      fill: strokeOtherColor,
      fontSize: 10,
      textAlign: "center",
      inside: true, // move labels inside ticks
      //radius: 20,
    });

    // Add clock hand
    // https://www.amcharts.com/docs/v5/charts/radar-chart/gauge-charts/#Clock_hands
    var axisDataItem = xAxis.makeDataItem({});
    var clockHand = am5radar.ClockHand.new(root, {
      //pinRadius: 10,
      radius: am5.percent(-3),
      innerRadius: -30,
      bottomWidth: 10,
      topWidth: 0,
    });

    clockHand.pin.setAll({
      fillOpacity: 0,
      strokeOpacity: 0,
    });

    clockHand.hand.setAll({
      fillOpacity: 0.5,
      strokeOpacity: 0.7,
      stroke: percentProgressLabelColor,
      fill: percentProgressLabelColor,
      strokeWidth: 1,
    });

    var bullet = axisDataItem.set(
      "bullet",
      am5xy.AxisBullet.new(root, {
        sprite: clockHand,
      })
    );

    xAxis.createAxisRange(axisDataItem);

    // Label for percent progress
    var label = chart.radarContainer.children.push(
      am5.Label.new(root, {
        centerX: am5.percent(50),
        textAlign: "center",
        centerY: am5.percent(90),
        y: am5.percent(25),
        fontSize: "1.8rem",
        fill: percentProgressLabelColor,
      })
    );

    // Add percent progress values
    bullet.get("sprite").on("rotation", function () {
      var value = axisDataItem.get("value");
      label.set(
        "text",
        value === undefined ? "" : value.toFixed(1).toString() + "%"
      );
    });

    axisDataItem.animate({
      key: "value",
      to: chartData[2],
      duration: 500,
      easing: am5.ease.out(am5.ease.cubic),
    });

    chart.bulletsContainer.set("mask", undefined);

    xAxis.createAxisRange(
      xAxis.makeDataItem({
        above: true,
        value: 0,
        endValue: 100,
      })
    );

    xAxis.createAxisRange(
      xAxis.makeDataItem({
        above: true,
        value: chartData[2],
        endValue: 100,
      })
    );

    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  });

  return (
    <>
      <CalciteTabs slot="panel-end">
        <div
          style={{
            width: "22vw",
            borderStyle: "solid",
            borderLeftWidth: "6px",
            marginTop: "-6px",
            marginRight: "-6px",
          }}
        >
          <div
            style={{
              display: "flex",
              borderStyle: "solid",
              paddingBottom: "10px",
            }}
          >
            <dl style={{ textIndent: "20px" }}>
              <dt
                style={{
                  color: "white",
                  fontSize: "1.5rem",
                  marginBottom: "10px",
                }}
              >
                Total Rings
              </dt>
              <dd
                style={{
                  color: "#d4ff33",
                  fontSize: "2.6rem",
                  fontWeight: "bold",
                  lineHeight: "1.2",
                }}
              >
                {thousands_separators(chartData[0])}
              </dd>
            </dl>
            <img
              src="https://EijiGorilla.github.io/Symbols/TBM.png"
              alt="TBM Logo"
              height={"55px"}
              width={"65px"}
              style={{
                marginLeft: "auto",
                marginRight: "15px",
                marginTop: "auto",
                marginBottom: "auto",
              }}
            />
          </div>

          {/* Progress Chart */}
          <div
            style={{
              borderStyle: "solid",
              borderTopWidth: "6px",
              paddingTop: "10px",
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "1.5rem",
                textIndent: "20px",
                marginBottom: "20px",
              }}
            >
              Segmented Rings
            </div>
            <div
              id={chartID}
              style={{
                // width: '23vw',
                height: "31vh",
                color: "white",
                // paddingBottom: "20px",
              }}
            ></div>
          </div>

          {/* <div className="gaugeChartTitle">Segment Ring</div> */}
          {/* <dl
            style={{
              textIndent: "20px",
              borderStyle: "solid",
              borderTopWidth: "6px",
              borderBottomWidth: "6px",
              margin: "0",
              paddingBottom: "10px",
            }}
          >
            <dt style={{ color: "white", fontSize: "1.5rem" }}>
              Cutter Head Position
            </dt>{" "}
            {segmentlines === undefined ||
            cutterHeadPositionNo[0] === undefined ? (
              <dd
                style={{
                  fontSize: "1.5rem",
                  color: "white",
                  paddingTop: "5px",
                }}
              >
                Ring No.-------
              </dd>
            ) : (
              <dd
                style={{
                  fontSize: "1.5rem",
                  color: "white",
                  paddingTop: "5px",
                }}
              >
                Ring No.
                <span
                  style={{
                    color: "#E83618",
                    fontSize: "2.8rem",
                    fontWeight: "bold",
                    paddingLeft: "10px",
                  }}
                >
                  {cutterHeadPositionNo[0]}
                </span>
              </dd>
            )}
          </dl> */}
          {/* Segmented Length */}
          <dl
            style={{
              textIndent: "20px",
              margin: "0",
              borderStyle: "solid",
              borderTopWidth: "6px",
              borderBottomWidth: "6px",
            }}
          >
            <dt
              style={{ color: "white", fontSize: "1.5rem", paddingTop: "10px" }}
            >
              Segmented Length
            </dt>{" "}
            {segmentedLength === null ? (
              <dd
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  color: "#00C3FF",
                  paddingTop: "5px",
                }}
              >
                ------- m
              </dd>
            ) : (
              <dd
                style={{
                  fontSize: "1.5rem",
                  color: "white",
                  paddingTop: "5px",
                }}
              >
                <span
                  style={{
                    color: "#00C3FF",
                    fontSize: "2.5rem",
                    fontWeight: "bold",
                    paddingLeft: "10px",
                  }}
                >
                  {segmentedLength === 0
                    ? segmentedLength
                    : thousands_separators(segmentedLength)}{" "}
                  m
                </span>
              </dd>
            )}
          </dl>
        </div>
      </CalciteTabs>
    </>
  );
};

export default Chart;
