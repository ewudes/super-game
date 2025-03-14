import React, { memo, useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { SHAPES } from './shapes';
import "./tetrogrid.scss";

const ROW_COUNT = 20;
const COLUMN_COUNT = 10;

function randomShape() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { ...shape };
}

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
  return Array.from(Array(ROW_COUNT), () => Array(COLUMN_COUNT).fill(null));
}

function useBoard() {
  const [scene, setScene] = useState(createEmptyScene);
  const [shape, setShape] = useState(randomShape);
  const [nextShape, setNextShape] = useState(randomShape);
  const [position, setPosition] = useState({ x: 4, y: 0 });
  const [display, setDisplay] = useState(() => mergeIntoStage(scene, shape, position));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [fallSpeed, setFallSpeed] = useState(600);
  const [level, setLevel] = useState('Легкотня!');
  const [paused, setPaused] = useState(false);

  useEffect(updateDisplay, [scene, shape, position]);
  useEffect(removeFullLines, [scene]);

  useInterval(tick, fallSpeed);

  function updateDisplay() {
    setDisplay(mergeIntoStage(scene, shape, position));
  }

  function tick() {
    if (gameOver || paused) return;

    if (!movePosition(0, 1)) {
      placeShape();
    }
  }

  function placeShape() {
    if (gameOver) return;

    setScene((prevScene) => mergeIntoStage(prevScene, shape, position));

    const newShape = nextShape;
    const newPosition = { x: 4, y: 0 };
    const newNextShape = randomShape();

    if (!validPosition(newPosition, newShape)) {
      setGameOver(true);
      return;
    }

    setShape(newShape);
    setNextShape(newNextShape);
    setPosition(newPosition);

    if (score >= 1000) {
      setLevel('Шуточки кончились');
      setFallSpeed(300);
    } else if (score >= 2000) {
      setLevel('Начинает припекать!');
      setFallSpeed(200);
    } else if (score >= 5000) {
      setLevel('Держись крепче, \n будет трясти!');
      setFallSpeed(100);
    } else if (score >= 10000) {
      setLevel('Дьявол звонит, \n пора страдать!!');
      setFallSpeed(600);
    } else {
      setLevel('Легкотня!');
      setFallSpeed(600);
    }
  }

  function restartGame() {
    setScene(createEmptyScene());
    setShape(randomShape());
    setNextShape(randomShape());
    setPosition({ x: 4, y: 0 });
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setFallSpeed(600);
    setLevel('Легкотня!');
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
        newScene[0][x] = null;
      }
      touched = true;
      setScore((oldVal) => oldVal + 100);
    };

    for (let y = 0; y < ROW_COUNT; y++) {
      if (newScene[y].every((cell) => cell !== null)) {
        removeRow(y);
      }
    }

    if (touched) {
      setScene(newScene);
    }
  }

  function onKeyDown(event) {
    if (gameOver) return;

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
      case " ":
        togglePause();
        break;
      default:
        return;
    }

    event.preventDefault();
  }

  function togglePause() {
    setPaused((prev) => !prev);
  }

  function movePosition(x, y) {
    const res = { x: position.x + x, y: position.y + y };

    if (!validPosition(res, shape)) {
      if (y === -1) {
        setGameOver(true); 
      }
      return false;
    }

    setPosition(res);
    return true;
  }

  function validPosition(position, shape) {
    return shape.shape.every(({ x, y }) => {
      const tX = x + position.x;
      const tY = y + position.y;
      return tX >= 0 && tX < COLUMN_COUNT && tY >= 0 && tY < ROW_COUNT && scene[tY][tX] === null;
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

  return [display, score, gameOver, nextShape, level, onKeyDown, paused, restartGame];
}

const Tetrogrid = () => {
  const [display, score, gameOver, nextShape, level, onKeyDown, paused, restartGame] = useBoard();
  const eBoard = useRef();

  useEffect(() => {
    if (eBoard.current) eBoard.current.focus();
  }, []);

  const handleRestart = () => {
    restartGame();
    if (eBoard.current) eBoard.current.focus();
  };

  return (
    <div className="tetrogrid">
      <div className={`tetrogrid__bg-wrap ${gameOver || paused ? 'tetrogrid__bg-stop' : ''}`}>
        <div className="tetrogrid__bg"></div>
        <div className="tetrogrid__bg"></div>
      </div>
      <div className="tetrogrid__aside tetrogrid__aside--left">
        <div className="tetrogrid__score-wrap">
          <span className="tetrogrid__score-label">{score.toLocaleString()}</span>
        </div>
      </div>
      <div className="tetrogrid__wrapper">
        <div className="tetrogrid__stars-wrap">
          <ul className="tetrogrid__stars">
            <li className="tetrogrid__star"></li>
            <li className="tetrogrid__star"></li>
            <li className="tetrogrid__star"></li>
            <li className="tetrogrid__star"></li>
            <li className="tetrogrid__star"></li>
          </ul>
        </div>
        <div ref={eBoard} className="tetrogrid__board" tabIndex={0} onKeyDown={onKeyDown}>
          {display.map((row, index) => (
            <Row key={index} row={row} />
          ))}
        </div>
      </div>
      <div className="tetrogrid__aside tetrogrid__aside--right">
        <div className="tetrogrid__level-wrap">
          <span className="tetrogrid__level-label">{level}</span>
        </div>
        <div className="tetrogrid__nextshape-wrap">
          <NextShapeDisplay shape={nextShape} />
        </div>
      </div>
      {gameOver && (
        <div className="tetrogrid__game-over">
          <h2>Потрачено!</h2>
          <p>Счет: {score}</p>
          <div className="tetrogrid__game-over-btns">
            <button className="tetrogrid__restart-button" onClick={handleRestart}>Играть заново</button>
            <Link to="/" className="tetrogrid__home-button">Home</Link>
          </div>
        </div>
      )}
      {paused && (
        <div className="tetrogrid__paused">
          <h2>Пауза</h2>
        </div>
      )}
    </div>
  );
};

const NextShapeDisplay = ({ shape }) => {
  if (!shape) return null;

  const gridSize = 4;
  const miniGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

  shape.shape.forEach(({ x, y }) => {
    if (x < gridSize && y < gridSize) {
      miniGrid[y][x] = shape.color;
    }
  });

  return (
    <div className="tetrogrid__next-shape-grid">
      {miniGrid.map((row, rowIndex) => (
        <div key={rowIndex} className="tetrogrid__next-shape-row">
          {row.map((cell, cellIndex) => (
            <span key={cellIndex} className={`tetrogrid__next-shape-cell ${cell ? `cell-${cell}` : ''}`}></span>
          ))}
        </div>
      ))}
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

const Cell = memo(({ cell }) => {
  const cellClass = cell ? `tetrogrid__cell tetrogrid__cell-${cell}` : 'tetrogrid__cell';
  return <span className={cellClass}></span>;
});

export default memo(Tetrogrid);
