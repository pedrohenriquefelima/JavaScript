$(function () {
  var canvas = $('#canvas')[0];
  var context = canvas.getContext('2d');

  //keys that will be used to control the snack
  const KEY_LEFT = 37;
  const KEY_RIGHT = 39;
  const KEY_UP = 38;
  const KEY_DOWN = 40;

  var keyPressed = KEY_DOWN;

  //the initial position and size of the snack
  //each block has a size of 10px
  var snake = [
    { x: 50, y: 100, oldx: 0, oldy: 0 },
    { x: 50, y: 90, oldx: 0, oldy: 0 },
    { x: 50, y: 80, oldx: 0, oldy: 0 },
  ];
  var squareWidth = 10;
  var squareHeight = 10;
  var blockSize = 10;
  var food = { x: 100, y: 150, eaten: false };
  var score = 0;
  var snakeGame;

  //make the snake move
  snakeGame = setInterval(startGame, 200);

  function startGame() {
    clearSnake();
    drawingFood();
    moveSnake();
    drawingSnack();
  }

  function moveSnake() {
    //the snake is spligt into two parts: head and body
    //according to the keypress, the part from the snake 'leading' is the head
    //the items from the body will move according to the items in front
    $.each(snake, function (index, object) {
      snake[index].oldy = object.y;
      snake[index].oldx = object.x;
      //check if it is the head
      if (index == 0) {
        if (keyPressed == KEY_DOWN) {
          //increase the y positiom
          //increasing the y position with the current value of y + 10
          snake[index].y = object.y + blockSize;
        } else if (keyPressed == KEY_UP) {
          //snack should go up - decrease blockSize
          snake[index].y = object.y - blockSize;
        } else if (keyPressed == KEY_RIGHT) {
          snake[index].x = object.x + blockSize;
        } else if (keyPressed == KEY_LEFT) {
          snake[index].x = object.x - blockSize;
        }
      } else {
        //each item should have the position of their next item
        snake[index].x = snake[index - 1].oldx;
        snake[index].y = snake[index - 1].oldy;
      }
    });
  }

  function drawingSnack() {
    $.each(snake, function (index, object) {
      context.fillStyle = 'red';
      context.fillRect(object.x, object.y, squareWidth, squareHeight);
      context.strokeStyle = 'white';
      //what should be stroked?
      context.strokeRect(object.x, object.y, squareWidth, squareHeight);
      //when drawing the snack we check if the head is on the same position as the food
      if (index == 0) {
        if (eatMyself(object.x, object.y)) {
          gameOverLoser();
        }
        if (hitCanvasMargins(object.x, object.y)) {
          gameOverLoser();
        }
        if (didEatFood(object.x, object.y)) {
          score += 1;
          $('#score').text(score);
          growingSnake();
          food.eaten = true;
        }
      }
    });
  }
  function eatMyself(x, y) {
    //check if x is in the same range as snake body
    //if the head is at the same position as any other X && Y part of the body
    return (
      snake.filter(function (object, index) {
        return index != 0 && object.x == x && object.y == y;
      }).length > 0
    );
  }
  function hitCanvasMargins(x, y) {
    //if the head is greater or less than the width or heigh
    return x > canvas.width || y > canvas.height || x < 0 || y < 0;
  }
  function growingSnake() {
    snake.push({
      x: snake[snake.length - 1].oldx,
      y: snake[snake.length - 1].oldy,
    });
  }
  function didEatFood(x, y) {
    return food.x == x && food.y == y;
  }
  function drawingFood() {
    context.fillStyle = 'green';
    if (food.eaten == true) {
      food = newFoodPosition();
    }
    context.fillRect(food.x, food.y, squareWidth + 1, squareHeight + 1);
  }

  function clearSnake() {
    //clear the entire canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  $(document).keydown(function (event) {
    if ($.inArray(event.which, [KEY_LEFT, KEY_RIGHT, KEY_DOWN, KEY_UP]) != -1) {
      keyPressed = checkKeyIsAllowed(event.which);
    }
  });

  function checkKeyIsAllowed(tempkey) {
    let key;
    if (tempkey == KEY_DOWN) {
      //if the previous key was not up allow to go down otherwise, keep going down
      key = keyPressed != KEY_UP ? tempkey : keyPressed;
    } else if (tempkey == KEY_UP) {
      key = keyPressed != KEY_DOWN ? tempkey : keyPressed;
    } else if (tempkey == KEY_LEFT) {
      key = keyPressed != KEY_RIGHT ? tempkey : keyPressed;
    } else if (tempkey == KEY_RIGHT) {
      key = keyPressed != KEY_LEFT ? tempkey : keyPressed;
    }
    return key;
  }
  function gameOverLoser() {
    clearInterval(snakeGame);
  }

  function newFoodPosition() {
    //all Xs and Ys need to be stored somewhere so we came sure the new food is not places over the snake
    let arrayX = [];
    let arrayY = [];
    let xy;
    $.each(snake, function (index, value) {
      //keep unique values in the arrays
      if ($.inArray(value.x, arrayX) == -1) {
        arrayX.push(value.x);
      }
      if ($.inArray(value.y, arrayY) == -1) {
        arrayY.push(value.y);
      }
    });
    xy = getXandY(arrayX, arrayY);
    console.log(xy);
    return xy;
  }
  function getXandY(arX, arY) {
    let newX, newY;
    // newX = getRamdomNumber(canvas.width - 10, 10);
    // newY = getRamdomNumber(canvas.height - 10, 10);
    newX = getRamdomNumber(canvas.width - 10, 10);
    newY = getRamdomNumber(canvas.height - 10, 10);
    console.log(newX);
    console.log(newY);
    ///check if both of X and Y are not in arX and arY
    if ($.inArray(newX, arX) == -1 && $.inArray(newY, arY) == -1) {
      return { x: newX, y: newY, eaten: false };
    } else {
      getXandY(arX, arY);
    }
  }
  function getRamdomNumber(maxNumber, multipleOf) {
    let result = Math.floor(Math.random() * maxNumber);
    result = result % 10 == 0 ? result : result + (multipleOf - (result % 10));
    return result;
  }
});
