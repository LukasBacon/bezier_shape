function Bezier_shape(options) {
  const t = this;

  // offset of the canvas element
  t.offset = 20;

  t.el = document.getElementById(options.selector);

  // point cloud
  t.points = [];

  t.init = function () {
    // rozdel text na spany
    t.spanning();

    // nastav stylovanie a vytvor canvas
    t.stylize();

    // zisti body
    t.setup_points();

    // nakresli krivku
    //t.draw_shape();
  };

  t.draw_shape = function () {
    const context = t.c.getContext("2d");
    context.beginPath();
    context.moveTo(t.points[0][0], t.points[0][1]);

    const multiplier = 3;

    for (let i = 1; i < t.points.length - 1; i++) {
      const ep = t.points[i];
      const dx1 = ep[0] - Math.abs(t.points[i - 1][0] - ep[0]) / multiplier;
      const dy1 = ep[1];

      const dx2 = ep[0];
      const dy2 = ep[1] + Math.abs(t.points[i + 1][1] - ep[1]) / multiplier;
      console.log(dx1, dy1, dx2, dy2);
      // context.bezierCurveTo( ep[ 0 ], ep[ 1 ], ep[ 0 ], ep[ 1 ], ep[ 0 ], ep[ 1 ] );
      context.bezierCurveTo(ep[0], ep[1], ep[0], ep[1], dx1, dy1);
      context.bezierCurveTo(ep[0], ep[1], ep[0], ep[1], dx2, dy2);
    }

    context.bezierCurveTo(
      t.points[0][0],
      t.points[0][1],
      t.points[0][0],
      t.points[0][1],
      t.points[0][0],
      t.points[0][1]
    );

    context.lineWidth = 3;
    context.strokeStyle = "#000000";
    context.stroke();
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
      t.debug_points([prew],'#e69c09')
      t.debug_points([akt],'#02fff2')
      t.debug_points([next],'#11cf47')
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
            prew[1] - next[1] < 0 && prew[1] - next[1] < 0 ? +offset : -offset
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
    t.c.style.zIndex = 101;
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
