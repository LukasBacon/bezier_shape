function Bezier_shape(options) {
  const t = this;

  // offset of the canvas element
  t.offset = 20;

  t.el = document.getElementById(options.selector);

  // point cloud
  t.points = [];
  t.bezierShapePoints = [
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

  t.multiplier = 3;
  t.roundingHeight = 8;

  t.init = function () {
    // rozdel text na spany
    t.spanning();

    // nastav stylovanie a vytvor canvas
    t.stylize();

    // zisti body
    t.setup_points();

    // zaobli rohy
    t.round_edges();

    // nakresli krivku
    t.draw_shape();
  };

  t.draw_shape = function () {
    const context = t.c.getContext("2d");
    context.beginPath();
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
      console.log(firstControlPoint.coordinateX +','+ firstControlPoint.coordinateY +','+
          secondControlPoint.coordinateX +','+ secondControlPoint.coordinateY +','+
          endPoint.coordinateX +','+ endPoint.coordinateY)
    }

    function processPoint(point) {
      if (firstPoint.coordinateX  === undefined) {
        firstPoint = point.firstPoint.coordinates;
        context.moveTo(firstPoint.coordinateX, firstPoint.coordinateY);
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

    t.bezierShapePoints.forEach(processPoint);
    endPoint = firstPoint;
    drawBezier();

    context.fillStyle = "red";
    context.fill();
  };

  t.debug_points = function (debug_points, color) {
    const context = t.c.getContext("2d");

    context.beginPath();
    context.fillStyle = color;
    for (let i = 0; i < debug_points.length; i++) {
      //context.fillText("" + i, debug_points[i][0], debug_points[i][1]);
      context.rect(debug_points[i][0] - 3, debug_points[i][1] - 3, 6, 6);
    }
    context.fill();
  };

  t.setup_points = function () {
    const spans = t.el.getElementsByTagName("span");

    const lines = [];
    for (let i = 0; i < spans.length; i++) {
      // aktualny span - x, y, sirka, vyska
      const s = t.get_points(spans[i]);
      t.debug_points([s.top_left,s.bottom_left,s.bottom_right, s.top_right], '#ababab')
      const last = lines.length > 0 ? lines[lines.length - 1] : undefined;
      if (last && Math.abs(last.top_left[1] - s.top_left[1]) < t.offset) {
        //ak som na line, tak updatnem koniec line
        last.top_right = s.top_left;
        last.bottom_right = s.bottom_right;
      } else {
        // nova line
        lines.push({ ...s });
      }
    }
    t.debug_lines = lines;
    const points = t.linesToPoints(lines);
    const points2 = t.splitPoints(points, t.offset + 10);
    t.debug_points(points2, "#ff6600");
    const points3 = t.annectBorder(points2, 10);
    t.debug_points(points3, "#00ff00");
    t.points = points3;
  };

  t.round_edges = function () {
    t.bezierShapePoints = [];
    for (let i = 0; i < t.points.length; i++) {
      const prev = i == 0 ? t.points[t.points.length - 1] : t.points[i - 1];
      const akt = t.points[i];
      const next = i == t.points.length - 1 ? t.points[0] : t.points[i + 1];

      var hDirection, vDirection, dx1, dy1, dx2, dy2;
      if (Math.abs(akt[1] - prev[1]) < Math.abs(akt[1] - next[1])) {
        hDirection = akt[0] - prev[0] < 0 ? 1 : -1;
        vDirection = prev[1] - next[1] > 0 || prev[0] - next[0] < 0 ? 1 : -1;
        dx1 = akt[0] + hDirection * (Math.abs(prev[0] - akt[0]) / 2 * (1 / t.multiplier));
        dy1 = akt[1] + vDirection * t.roundingHeight;
      } else {
        hDirection = prev[0] - next[0] < 0 && prev[1] - next[1] <0 ? -1 : 1;
        vDirection = akt[1] - prev[1] < 0  ? 1 : -1;
        dx1 = akt[0] + hDirection * t.roundingHeight;
        dy1 = akt[1] + vDirection * (Math.abs(akt[1] - prev[1]) / 2 * (1 / t.multiplier));
      }

      if (Math.abs(akt[1] - prev[1]) > Math.abs(akt[1] - next[1])) {
        hDirection = akt[0] - next[0] < 0 ? 1 : -1;
        vDirection = prev[1] - next[1] < 0 || prev[0] - next[0] < 0 ? 1 : -1;
        dx2 = akt[0] + hDirection * (Math.abs(next[0] - akt[0]) / 2 * (1 / t.multiplier));
        dy2 = akt[1] + vDirection * t.roundingHeight;
      } else {
        hDirection = prev[0] - next[0] && akt[1] - next[1] < 0 ? -1 : 1;
        vDirection = akt[1] - next[1] < 0  ? 1 : -1;
        dx2 = akt[0] + hDirection * t.roundingHeight;
        dy2 = akt[1] + vDirection * (Math.abs(akt[1] - next[1]) / 2 * (1 / t.multiplier));
      }

      t.debug_points([[dx1, dy1]], "#bc0af8");
      t.debug_points([[dx2, dy2]], "#ff00f3");

      t.bezierShapePoints.push(        {
        "firstPoint": {
          "coordinates": {
            "coordinateX": dx1,
            "coordinateY": dy1
          },
          "firstControlPoint": {
            "coordinateX": dx1,
            "coordinateY": dy1
          },
          "secondControlPoint": {
            "coordinateX": dx1,
            "coordinateY": dy1
          }
        },
        "secondPoint": {
          "coordinates": {
            "coordinateX": dx2,
            "coordinateY": dy2
          },
          "firstControlPoint": {
            "coordinateX": dx2,
            "coordinateY": dy2
          },
          "secondControlPoint": {
            "coordinateX": dx2,
            "coordinateY": dy2
          }
        }
      },);
    }
  };

  t.linesToPoints = function (lines) {
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
    const points = [...points1, ...points2.reverse()];
    return points;
  };

  t.splitPoints = function (points, offset) {
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

  t.annectBorder = function (points, offset) {
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

  t.distance = function (a, b) {
    return Math.abs(
      Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
    );
  };

  t.get_points = function (el) {
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

  t.stylize = function () {
    t.el.style.position = "relative";
    t.el.style.zIndex = 100;
    t.c = document.createElement("canvas");
    t.c.setAttribute("id", "zse_shape");
    t.c.style.position = "absolute";
    t.c.style.top = "-" + t.offset + "px";
    t.c.style.left = "-" + t.offset + "px";
    t.c.setAttribute("width", t.el.offsetWidth + t.offset * 2);
    t.c.setAttribute("height", t.el.offsetHeight + t.offset * 2);
    t.el.appendChild(t.c);
  };

  t.spanning = function () {
    let text = t.el.innerText.split(/(\s+)/);
    t.el.innerText = "";

    for (let i = 0; i < text.length; i++) {
      const span = document.createElement("span");
      span.innerHTML = text[i];
      t.el.appendChild(span);
    }
  };

  t.init();
}
