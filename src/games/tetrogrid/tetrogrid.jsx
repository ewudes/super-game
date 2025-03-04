import React, { memo, useEffect, useRef, useState } from "react";
import "./tetrogrid.scss";

const SHAPES = [
  {
    shape: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
    width: 2,
    height: 2,
  },
  {
    shape: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ],
    width: 1,
    height: 4,
  },
  {
    shape: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    width: 2,
    height: 3,
  },
];

const SHAPES_COLOR = ["red", "green", "blue", "yellow"];

function randomShape() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { ...shape, color: SHAPES_COLOR[Math.floor(Math.random() * SHAPES_COLOR.length)] };
}

const ROW_COUNT = 20;
const COLUMN_COUNT = 10;

function copyScene(scene) {
  return scene.map((row) => row.slice());
}

function mergeIntoStage(stage, shape, position) {
  let res = copyScene(stage);
  shape.shape.forEach((point) => {
    const x = point.x + position.x;
    const y = point.y + position.y;

    if (x >= 0 && y >= 0 && x < COLUMN_COUNT && y < ROW_COUNT) {
      res[y][x] = shape.color;
    }
  });

  return res;
}

function createEmptyScene() {
  return Array.from(Array(ROW_COUNT), () => Array(COLUMN_COUNT).fill(0));
}

function useBoard() {
  const [scene, setScene] = useState(createEmptyScene);
  const [shape, setShape] = useState(randomShape);
  const [position, setPosition] = useState({ x: 4, y: 0 });
  const [display, setDisplay] = useState(() => mergeIntoStage(scene, shape, position));
  const [score, setScore] = useState(0);

  useEffect(updateDisplay, [scene, shape, position]);
  useEffect(removeFullLines, [scene]);
  useInterval(tick, 600);

  function updateDisplay() {
    setDisplay(mergeIntoStage(scene, shape, position));
  }

  function tick() {
    if (!movePosition(0, 1)) {
      placeShape();
    }
  }

  function placeShape() {
    setScene((prevScene) => mergeIntoStage(prevScene, shape, position));
    setShape(randomShape());
    setPosition({ x: 4, y: 0 });
  }

  function rotateShape() {
    const tX = Math.floor(shape.width / 2);
    const tY = Math.floor(shape.height / 2);

    const newPoints = shape.shape.map((point) => {
      let { x, y } = point;
      x -= tX;
      y -= tY;

      let rX = -y;
      let rY = x;

      rX += tX;
      rY += tY;

      return { x: rX, y: rY };
    });

    const newShape = { ...shape, shape: newPoints };

    if (validPosition(position, newShape)) {
      setShape(newShape);
    }
  }

  function removeFullLines() {
    const newScene = copyScene(scene);
    let touched = false;

    const removeRow = (rY) => {
      for (let y = rY; y > 0; y--) {
        for (let x = 0; x < COLUMN_COUNT; x++) {
          newScene[y][x] = newScene[y - 1][x];
        }
      }
      for (let x = 0; x < COLUMN_COUNT; x++) {
        newScene[0][x] = 0;
      }
      touched = true;
      setScore((oldVal) => oldVal + 1000);
    };

    for (let y = 0; y < ROW_COUNT; y++) {
      if (newScene[y].every((cell) => cell !== 0)) {
        removeRow(y);
      }
    }

    if (touched) {
      setScene(newScene);
    }
  }

  function onKeyDown(event) {
    switch (event.key) {
      case "ArrowRight":
        movePosition(1, 0);
        break;
      case "ArrowLeft":
        movePosition(-1, 0);
        break;
      case "ArrowDown":
        movePosition(0, 1);
        break;
      case "ArrowUp":
        rotateShape();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function movePosition(x, y) {
    const res = { x: position.x + x, y: position.y + y };
    if (!validPosition(res, shape)) return false;
    setPosition(res);
    return true;
  }

  function validPosition(position, shape) {
    return shape.shape.every((point) => {
      const tX = point.x + position.x;
      const tY = point.y + position.y;
      return tX >= 0 && tX < COLUMN_COUNT && tY >= 0 && tY < ROW_COUNT && scene[tY][tX] === 0;
    });
  }

  function useInterval(callback, delay) {
    const callbackRef = useRef();
    useEffect(() => {
      callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
      const interval = setInterval(() => callbackRef.current(), delay);
      return () => clearInterval(interval);
    }, [delay]);
  }

  return [display, score, onKeyDown];
}

const Tetrogrid = () => {
  const [display, score, onKeyDown] = useBoard();
  const eBoard = useRef();

  useEffect(() => {
    if (eBoard.current) eBoard.current.focus();
  }, []);

  return (
    <div className="tetrogrid-wrap">
      <div className="tetrogrid__aside">
        <div className="tetrogrid__score-wrap">
          <span className="tetrogrid__score-label">{score.toLocaleString()}</span>
          {/* <span></span> */}
        </div>
        <div className="tetrogrid__nextshape-wrap">
          <span className="tetrogrid__nextshape">Next shape</span>
        </div>
      </div>
      <div className="tetrogrid">
        <div ref={eBoard} className="tetrogrid__board" tabIndex={0} onKeyDown={onKeyDown}>
          {display.map((row, index) => (
            <Row key={index} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Row = memo(({ row }) => (
  <div className="tetrogrid__row">
    {row.map((cell, index) => (
      <Cell key={index} cell={cell} />
    ))}
  </div>
));

const Cell = memo(({ cell }) => <span className={`tetrogrid__cell tetrogrid__cell-${cell}`}></span>);

export default memo(Tetrogrid);
