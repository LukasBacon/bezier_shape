const resizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    new BezierShape({
      selector: entry.target.id
    } );
  }
});

function BezierShape(options) {
  const bezierShape = this;

  // offset of the canvas element
  bezierShape.offset = 50;

  // point cloud
  bezierShape.points = [];
  bezierShape.bezierShapePoints = [
    {
      "firstPoint": {
        "coordinates": {
          "coordinateX": 40,
          "coordinateY": 40
        },
        "firstControlPoint": {
          "coordinateX": 45,
          "coordinateY": 30
        },
        "secondControlPoint": {
          "coordinateX": 55,
          "coordinateY": 18
        }
      },
      "secondPoint": {
        "coordinates": {
          "coordinateX": 70,
          "coordinateY": 20
        },
        "firstControlPoint": {
          "coordinateX": 80,
          "coordinateY": 15
        },
        "secondControlPoint": {
          "coordinateX": 100,
          "coordinateY": 15
        }
      }
    },
    {
      "firstPoint": {
        "coordinates": {
          "coordinateX": 110,
          "coordinateY": 20
        },
        "firstControlPoint": {
          "coordinateX": 125,
          "coordinateY": 10
        },
        "secondControlPoint": {
          "coordinateX": 145,
          "coordinateY": 20
        }
      },
      "secondPoint": {
        "coordinates": {
          "coordinateX": 150,
          "coordinateY": 25
        },
        "firstControlPoint": {
          "coordinateX": 160,
          "coordinateY": 30
        },
        "secondControlPoint": {
          "coordinateX": 160,
          "coordinateY": 50
        }
      }
    },
    {
      "firstPoint": {
        "coordinates": {
          "coordinateX": 150,
          "coordinateY": 55
        },
        "firstControlPoint": {
          "coordinateX": 130,
          "coordinateY": 60
        },
        "secondControlPoint": {
          "coordinateX": 100,
          "coordinateY": 60
        }
      },
      "secondPoint": {
        "coordinates": {
          "coordinateX": 80,
          "coordinateY": 55
        },
        "firstControlPoint": {
          "coordinateX": 70,
          "coordinateY": 50
        },
        "secondControlPoint": {
          "coordinateX": 50,
          "coordinateY": 45
        }
      }
    }
  ];

  bezierShape.multiplier = 3;
  bezierShape.roundingHeight = 10;

  if ( bezierShape.element === undefined ) {
    bezierShape.element = document.getElementById(options.selector);
    resizeObserver.observe(bezierShape.element);
  }

  bezierShape.init = function () {
    // rozdel text na spany
    bezierShape.createSpans();

    // nastav stylovanie a vytvor canvas
    bezierShape.createCanvas();

    // zisti body
    bezierShape.setup_points();

    // zaobli rohy
    bezierShape.round_edges();

    // nakresli krivku
    bezierShape.draw_shape();
  };

  bezierShape.debug_points = function (debug_points, color) {
    const context = bezierShape.canvas.getContext("2d");

    context.beginPath();
    context.fillStyle = color;
    for (let i = 0; i < debug_points.length; i++) {
      //context.fillText("" + i, debug_points[i][0], debug_points[i][1]);
      context.rect(debug_points[i][0] - 3, debug_points[i][1] - 3, 6, 6);
    }
    context.fill();
  };

  bezierShape.setup_points = function () {
    const spans = bezierShape.element.getElementsByTagName("span");

    const lines = [];
    for (let i = 0; i < spans.length; i++) {
      // aktualny span - x, y, sirka, vyska
      const s = bezierShape.get_points(spans[i]);
      bezierShape.debug_points([s.top_left,s.bottom_left,s.bottom_right, s.top_right], '#ababab')
      const last = lines.length > 0 ? lines[lines.length - 1] : undefined;
      if (last && Math.abs(last.top_left[1] - s.top_left[1]) < bezierShape.offset) {
        //ak som na line, tak updatnem koniec line
        last.top_right = s.top_right;
        last.bottom_right = s.bottom_right;
      } else {
        // nova line
        lines.push({ ...s });
      }
    }
    bezierShape.debug_lines = lines;
    const points = bezierShape.linesToPoints(lines);
    const points2 = bezierShape.splitPoints(points, bezierShape.offset + 10);
    bezierShape.debug_points(points2, "#ff6600");
    const points3 = bezierShape.annectBorder(points2, 10);
    bezierShape.debug_points(points3, "#00ff00");
    bezierShape.points = points3;
  };

  bezierShape.round_edges = function () {
    function calculateControlPoints(firstPoint, secondPoint) {
      const trapezoidAngle = degreesToRadians(45);
      const trapezoidHeight = 20;
      const angleBetweenFirstSecondPoints = angleBetweenPoints(firstPoint, secondPoint);
      const angleBetweenSecondFirstPoints = angleBetweenPoints(secondPoint, firstPoint);

      const firstControlPoint = calculatePoint(firstPoint, angleBetweenFirstSecondPoints + trapezoidAngle, trapezoidHeight);
      const secondControlPoint = calculatePoint(secondPoint, angleBetweenSecondFirstPoints - trapezoidAngle, trapezoidHeight);

      return { "firstControlPoint": firstControlPoint, "secondControlPoint": secondControlPoint };
    }

    bezierShape.bezierShapePoints = [];
    for (let i = 0; i < bezierShape.points.length; i++) {
      const prev = i === 0 ? bezierShape.points[bezierShape.points.length - 1] : bezierShape.points[i - 1];
      const akt = bezierShape.points[i];
      const next = i === bezierShape.points.length - 1 ? bezierShape.points[0] : bezierShape.points[i + 1];

      // TODO vzorec ako multiplier ovplyvnuje vzdialenost od bodu "akt" treba este doladit

      let hDirection, vDirection, firstPointX, firstPointY, secondPointX, secondPointY;
      if (Math.abs(akt[1] - prev[1]) < Math.abs(akt[1] - next[1])) {
        hDirection = akt[0] - prev[0] < 0 ? 1 : -1;
        vDirection = prev[1] - next[1] > 0 || prev[0] - next[0] < 0 ? 1 : -1;
        firstPointX = akt[0] + hDirection * (Math.abs(prev[0] - akt[0]) / 2 * (1 / bezierShape.multiplier));
        firstPointY = akt[1] + vDirection * bezierShape.roundingHeight;
      } else {
        hDirection = prev[0] - next[0] < 0 && prev[1] - next[1] <0 ? -1 : 1;
        vDirection = akt[1] - prev[1] < 0  ? 1 : -1;
        firstPointX = akt[0] + hDirection * bezierShape.roundingHeight;
        firstPointY = akt[1] + vDirection * (Math.abs(akt[1] - prev[1]) / 2 * (1 / bezierShape.multiplier));
      }

      if (Math.abs(akt[1] - prev[1]) > Math.abs(akt[1] - next[1])) {
        hDirection = akt[0] - next[0] < 0 ? 1 : -1;
        vDirection = prev[1] - next[1] < 0 || prev[0] - next[0] < 0 ? 1 : -1;
        secondPointX = akt[0] + hDirection * (Math.abs(next[0] - akt[0]) / 2 * (1 / bezierShape.multiplier));
        secondPointY = akt[1] + vDirection * bezierShape.roundingHeight;
      } else {
        hDirection = prev[0] - next[0] && akt[1] - next[1] < 0 ? -1 : 1;
        vDirection = akt[1] - next[1] < 0  ? 1 : -1;
        secondPointX = akt[0] + hDirection * bezierShape.roundingHeight;
        secondPointY = akt[1] + vDirection * (Math.abs(akt[1] - next[1]) / 2 * (1 / bezierShape.multiplier));
      }

      bezierShape.debug_points([[firstPointX, firstPointY]], "#bc0af8");
      bezierShape.debug_points([[secondPointX, secondPointY]], "#bc0af8");

      if ( i > 0 ) {
        const secondPointControlPoints = calculateControlPoints(bezierShape.bezierShapePoints[i-1].secondPoint.coordinates,
            { "coordinateX": firstPointX, "coordinateY": firstPointY })
        bezierShape.debug_points([[secondPointControlPoints.firstControlPoint.coordinateX,
          secondPointControlPoints.firstControlPoint.coordinateY]], "#01a20f");
        bezierShape.debug_points([[secondPointControlPoints.secondControlPoint.coordinateX,
          secondPointControlPoints.secondControlPoint.coordinateY]], "#01a20f");
        bezierShape.bezierShapePoints[i-1].secondPoint.firstControlPoint = secondPointControlPoints.firstControlPoint;
        bezierShape.bezierShapePoints[i-1].secondPoint.secondControlPoint = secondPointControlPoints.secondControlPoint;
      }

      const firstPointControlPoints = calculateControlPoints({ "coordinateX": firstPointX, "coordinateY": firstPointY },
          { "coordinateX": secondPointX, "coordinateY": secondPointY })
      bezierShape.debug_points([[firstPointControlPoints.firstControlPoint.coordinateX,
        firstPointControlPoints.firstControlPoint.coordinateY]], "#01a20f");
      bezierShape.debug_points([[firstPointControlPoints.secondControlPoint.coordinateX,
        firstPointControlPoints.secondControlPoint.coordinateY]], "#01a20f");
      bezierShape.bezierShapePoints.push(        {
        "firstPoint": {
          "coordinates": {
            "coordinateX": firstPointX,
            "coordinateY": firstPointY
          },
          "firstControlPoint": firstPointControlPoints.firstControlPoint,
          "secondControlPoint": firstPointControlPoints.secondControlPoint
        },
        "secondPoint": {
          "coordinates": {
            "coordinateX": secondPointX,
            "coordinateY": secondPointY
          },
          "firstControlPoint": {
            "coordinateX": secondPointX,
            "coordinateY": secondPointY
          },
          "secondControlPoint": {
            "coordinateX": secondPointX,
            "coordinateY": secondPointY
          }
        }
      },);
    }
    if ( bezierShape.bezierShapePoints.length > 1 ) {
      const secondPointControlPoints = calculateControlPoints(
          bezierShape.bezierShapePoints[bezierShape.bezierShapePoints.length -  1].secondPoint.coordinates,
          bezierShape.bezierShapePoints[0].firstPoint.coordinates)
      bezierShape.debug_points([[secondPointControlPoints.firstControlPoint.coordinateX,
        secondPointControlPoints.firstControlPoint.coordinateY]], "#01a20f");
      bezierShape.debug_points([[secondPointControlPoints.secondControlPoint.coordinateX,
        secondPointControlPoints.secondControlPoint.coordinateY]], "#01a20f");
      bezierShape.bezierShapePoints[bezierShape.bezierShapePoints.length -  1].secondPoint.firstControlPoint =
          secondPointControlPoints.firstControlPoint;
      bezierShape.bezierShapePoints[bezierShape.bezierShapePoints.length -  1].secondPoint.secondControlPoint =
          secondPointControlPoints.secondControlPoint;
    }
  };

  bezierShape.linesToPoints = function (lines) {
    const points1 = [];
    const points2 = [];
    lines.forEach((l) => {
      points1.push(l.top_left);
      points1.push(l.bottom_left);
      points2.push(l.top_right);
      points2.push(l.bottom_right);
    });
    //spojim lave pointy a opacne poradie pravych pointov
    //dostanem kolecko z lava dole, z prava hore
    return [...points1, ...points2.reverse()];
  };

  bezierShape.splitPoints = function (points, offset) {
    console.log(points, offset);
    //vyhodim pointy ktore splivaju
    const points2 = [points[0]];
    let smer = 0;
    for (let i = 1; i < points.length; i++) {
      const akt = points[i];
      let last = points2[points2.length - 1];
      console.log("akt", akt, "last", last);
      if (Math.abs(last[smer] - akt[smer]) < offset) {
        //smer zostava, last zostava
        console.log("smer zostava " + i, last[smer], akt[smer]);
      } else {
        console.log("menim smer " + i, last[smer], akt[smer]);
        //ulozim posledny v smere
        points2.push(points[i - 1]);
        smer = smer ? 0 : 1;
      }
    }
    points2.push(points[points.length - 1]);
    return points2;
  };

  bezierShape.annectBorder = function (points, offset) {
    const add = (point, x, y) => [point[0] + x, point[1] + y];

    const points2 = [add(points[0], -offset, -offset)];
    for (let i = 1; i < points.length - 1; i++) {
      const prew = points[i - 1];
      const akt = points[i];
      const next = points[i + 1];
      if (akt[0] < prew[0]) {
        points2.push(
          add(
            akt,
            prew[0] - next[0] < 0 ? -offset : +offset,
            prew[1] - next[1] < 0 ? +offset : -offset
          )
        );
      } else {
        points2.push(
          add(
            akt,
            prew[0] - next[0] < 0 && prew[1] - next[1] < 0 ? -offset : +offset,
            prew[1] - next[1] < 0 || prew[0] - next[0] < 0 ? +offset : -offset
          )
        );
      }
    }
    points2.push(add(points[points.length - 1], +offset, -offset));
    return points2;
  };

  function distanceBetweenPoints(firstPoint, secondPoint) {
    return Math.abs(
        Math.sqrt(Math.pow(firstPoint.coordinateX - secondPoint.coordinateX, 2) + Math.pow(firstPoint.coordinateY - secondPoint.coordinateY, 2))
    );
  }

  function angleBetweenPoints(firstPoint, secondPoint) {
    return Math.atan2(secondPoint.coordinateY - firstPoint.coordinateY, secondPoint.coordinateX - firstPoint.coordinateX);
  }

  function calculatePoint(startPoint, angle, distance) {
    let coordinateX = startPoint.coordinateX + Math.cos(angle) * distance;
    let coordinateY = startPoint.coordinateY + Math.sin(angle) * distance;
    if ( coordinateX < 0) {
      coordinateX = 0;
    }
    if ( coordinateY < 0) {
      coordinateY = 0;
    }
    if ( coordinateX > bezierShape.canvas.width) {
      coordinateX = bezierShape.canvas.width;
    }
    if ( coordinateY > bezierShape.canvas.height) {
      coordinateY = bezierShape.canvas.height;
    }
    return { "coordinateX": coordinateX, "coordinateY": coordinateY };
  }

  function degreesToRadians(degrees) {
    return Math.PI * degrees / 180;
  }

  bezierShape.get_points = function (el) {
    const rect = el.getBoundingClientRect();
    return {
      top_left: [Math.round(rect.x), Math.round(rect.y)],
      top_right: [Math.round(rect.x + rect.width), Math.round(rect.y)],
      bottom_left: [Math.round(rect.x), Math.round(rect.y + rect.height)],
      bottom_right: [
        Math.round(rect.x + rect.width),
        Math.round(rect.y + rect.height),
      ],
    };
  };

  bezierShape.createCanvas = function () {
    bezierShape.element.style.position = "relative";
    if ( bezierShape.canvas === undefined ) {
      bezierShape.canvas = document.createElement("canvas");
    }
    bezierShape.canvas.style.position = "absolute";
    bezierShape.canvas.style.top = "-" + bezierShape.offset + "px";
    bezierShape.canvas.style.left = "-" + bezierShape.offset + "px";
    bezierShape.canvas.width = bezierShape.element.offsetWidth + bezierShape.offset * 2;
    bezierShape.canvas.height = bezierShape.element.offsetHeight + bezierShape.offset * 2;
    bezierShape.element.appendChild(bezierShape.canvas);
  };

  bezierShape.createSpans = function () {
    let text = bezierShape.element.innerText.split(/(\s+)/);
    bezierShape.element.innerText = "";

    for (let i = 0; i < text.length; i++) {
      const span = document.createElement("span");
      span.innerHTML = text[i];
      bezierShape.element.appendChild(span);
    }
  };

  bezierShape.draw_shape = function () {
    const context = bezierShape.canvas.getContext("2d");
    let firstPoint = {};
    let firstControlPoint = {};
    let secondControlPoint = {};
    let endPoint = {};

    function drawBezier() {
      context.bezierCurveTo(
          firstControlPoint.coordinateX, firstControlPoint.coordinateY,
          secondControlPoint.coordinateX, secondControlPoint.coordinateY,
          endPoint.coordinateX, endPoint.coordinateY
      );
      console.log(firstControlPoint.coordinateX + ',' + firstControlPoint.coordinateY + ',' +
          secondControlPoint.coordinateX + ',' + secondControlPoint.coordinateY + ',' +
          endPoint.coordinateX + ',' + endPoint.coordinateY)
    }

    function processPoint(point) {
      if (firstPoint.coordinateX === undefined) {
        firstPoint = point.firstPoint.coordinates;
        context.moveTo(firstPoint.coordinateX, firstPoint.coordinateY);
        console.log("firstPoint:" + firstPoint.coordinateX + ", " + firstPoint.coordinateY);
      } else {
        endPoint = point.firstPoint.coordinates;
        drawBezier();
      }
      firstControlPoint = point.firstPoint.firstControlPoint;
      secondControlPoint = point.firstPoint.secondControlPoint;
      endPoint = point.secondPoint.coordinates;
      drawBezier();
      firstControlPoint = point.secondPoint.firstControlPoint;
      secondControlPoint = point.secondPoint.secondControlPoint;
    }

    context.beginPath();
    bezierShape.bezierShapePoints.forEach(processPoint);
    endPoint = firstPoint;
    drawBezier();

    context.fillStyle = "red";
    context.fill();
  }

  bezierShape.init();
}
