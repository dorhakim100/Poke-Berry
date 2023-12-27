'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const BALL = 'BALL'
const GAMER = 'GAMER'
const TELEPORT = 'TELEPORT'
const GLUE = 'GLUE'

var GAMER_IMG

var GAMER_IMG_DOWN = '<img src="img/snorlax_down.gif">'
var GAMER_IMG_UP = '<img src="img/snorlax_up.gif">'
var GAMER_IMG_RIGHT = '<img src="img/snorlax_right.gif">'
var GAMER_IMG_LEFT = '<img src="img/snorlax_left.gif">'
const BALL_IMG = '<img src="img/berry.png">'
const GLUE_IMG = '<img src="img/swamp.png">'

// Model:
var gBoard
var gGamerPos
var gBallInterval
var gGlueInterval
var gBallCounter = 0
var isOver = false
var gNeighborsCount = 0
var isGlue = false
var vanishGlue
var isRestart = false

const audio = new Audio('audio/Casino.mp3')
setInterval(audio.play(), 90000)
function initGame() {
  gGamerPos = { i: 2, j: 9 }
  gBoard = buildBoard()
  renderBoard(gBoard)
  gBallInterval = setInterval(addBall, 3000)
  gGlueInterval = setInterval(addGlue, 5000)
  backgroundMusic()
}

function buildBoard() {
  const board = createMat(10, 12)

  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[i].length; j++) {
      if (
        (i === 0 && j !== 5) ||
        (i === board.length - 1 && j !== 5) ||
        (j === 0 && i !== 5) ||
        (j === board[i].length - 1 && i !== 5)
      ) {
        board[i][j] = { type: WALL, gameElement: null }
      } else {
        board[i][j] = { type: FLOOR, gameElement: null }
      }
    }
  }

  board[gGamerPos.i][gGamerPos.j].gameElement = GAMER
  board[6][6].gameElement = BALL
  board[3][3].gameElement = BALL
  board[0][5].gameElement = TELEPORT
  board[9][5].gameElement = TELEPORT
  board[5][11].gameElement = TELEPORT
  board[5][0].gameElement = TELEPORT
  // console.log(board)
  return board
}

// Render the board to an HTML table
function renderBoard(board) {
  GAMER_IMG = GAMER_IMG_DOWN
  const elBoard = document.querySelector('.board')
  var strHTML = ''
  var ballsCollected = document.querySelector('.balls-collected')
  var ballsAround = document.querySelector('.balls-around')
  ballsAround.innerHTML = `<h3 class="balls-around">Berries Around: ${gNeighborsCount}</h3>`
  ballsCollected.innerHTML = `Berries Eaten: ${gBallCounter}`
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>\n'
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j]

      var cellClass = getClassName({ i, j })

      if (currCell.type === FLOOR) {
        cellClass += ' floor'
      } else if (currCell.type === WALL) cellClass += ' wall'
      else if (
        gBoard[0][5] ||
        gBoard[5][0] ||
        gBoard[5][gBoard[i].length - 2] ||
        gBoard[gBoard.length - 2][5]
      )
        cellClass += ' teleport'
      // strHTML += '\t<td class="cell ' + cellClass + '"  onclick="moveTo(' + i + ',' + j + ')" >\n'
      strHTML += `\t<td class="cell ${cellClass}" onclick="moveTo(${i},${j})">`
      if (currCell.gameElement === GAMER) {
        strHTML += GAMER_IMG
      } else if (
        currCell.gameElement === BALL &&
        currCell.gameElement !== TELEPORT &&
        currCell.gameElement !== GLUE
      ) {
        strHTML += BALL_IMG
      }

      strHTML += '</td>\n'
    }
    strHTML += '</tr>\n'
  }
  elBoard.innerHTML = strHTML
}

// Move the player to a specific location
function moveTo(i, j) {
  if (isGlue) return
  if (isOver) return

  const fromCell = gBoard[gGamerPos.i][gGamerPos.j]
  const toCell = gBoard[i][j]
  var ballsCollected = document.querySelector('.balls-collected')
  var ballsAround = document.querySelector('.balls-around')
  if (toCell.gameElement === GLUE) {
    const audio = new Audio('audio/bind.mp3')
    audio.play()
    isGlue = true
    console.log('isGlue:', isGlue)
    setTimeout(() => {
      isGlue = false
    }, 3000)
  }

  if (toCell.type === WALL) return

  if (gGamerPos.i === 0 && gGamerPos.j === 5) {
    fromCell.gameElement = TELEPORT
    renderCell(gGamerPos, '')
    renderCell({ i, j }, GAMER_IMG) // { i: i, j: j }
    gGamerPos = { i, j }
  }
  if (gGamerPos.i === 9 && gGamerPos.j === 5) {
    fromCell.gameElement = TELEPORT
    renderCell(gGamerPos, '')
    renderCell({ i, j }, GAMER_IMG) // { i: i, j: j }
    gGamerPos = { i, j }
  }
  if (gGamerPos.i === 5 && gGamerPos.j === 0) {
    fromCell.gameElement = TELEPORT
    renderCell(gGamerPos, '')
    renderCell({ i, j }, GAMER_IMG) // { i: i, j: j }
    gGamerPos = { i, j }
  }
  if (gGamerPos.i === 5 && gGamerPos.j === 11) {
    fromCell.gameElement = TELEPORT
    renderCell(gGamerPos, '')
    renderCell({ i, j }, GAMER_IMG) // { i: i, j: j }
    gGamerPos = { i, j }
  }

  // Calculate distance to make sure we are moving to a neighbor cell
  const iAbsDiff = Math.abs(i - gGamerPos.i)
  const jAbsDiff = Math.abs(j - gGamerPos.j)

  if (iAbsDiff + jAbsDiff === 1) {
    if (toCell.gameElement === BALL) {
      gBallCounter++
      if (gBallCounter % 2 === 0) {
        const audio = new Audio('audio/correct.mp3')
        audio.play()
      }
      console.log('Collecting!')
      ballsCollected.innerHTML = `<h2 class="balls-collected">Berries Eaten: ${gBallCounter}</h2>
      `
    }

    // TODO: Move the gamer

    // Model - origin
    fromCell.gameElement = null

    // DOM - origin
    renderCell(gGamerPos, '')

    // Model - destination
    toCell.gameElement = GAMER

    // DOM - destination
    renderCell({ i, j }, GAMER_IMG) // { i: i, j: j }

    // Model = gGamerPos
    gGamerPos = { i, j }
    gameOver(gBoard)
    gNeighborsCount = countNeighbors(gGamerPos.i, gGamerPos.j, gBoard)
    ballsAround.innerHTML = `<h3 class="balls-around">Berries Around: ${gNeighborsCount}</h3>`
    if (isOver) victory()
  } else console.log('Bad Move', iAbsDiff, jAbsDiff)
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
  const cellSelector = '.' + getClassName(location)
  const elCell = document.querySelector(cellSelector)
  elCell.innerHTML = value
}

// Move the player by keyboard arrows
function handleKey(event) {
  const i = gGamerPos.i
  const j = gGamerPos.j

  switch (event.key) {
    case 'ArrowLeft':
      GAMER_IMG = GAMER_IMG_LEFT
      if (i === 5 && j === 0) {
        moveTo(5, 11)
        break
      }
      moveTo(i, j - 1)
      break
    case 'ArrowRight':
      GAMER_IMG = GAMER_IMG_RIGHT
      if (i === 5 && j === 11) {
        moveTo(5, 0)
        break
      }
      moveTo(i, j + 1)
      break
    case 'ArrowUp':
      GAMER_IMG = GAMER_IMG_UP
      if (i === 0 && j === 5) {
        moveTo(9, 5)
        break
      }
      moveTo(i - 1, j)
      break
    case 'ArrowDown':
      GAMER_IMG = GAMER_IMG_DOWN
      if (i === 9 && j === 5) {
        moveTo(0, 5)
        break
      }
      moveTo(i + 1, j)
      break
  }
}

// Returns the class name for a specific cell
function getClassName(position) {
  const cellClass = `cell-${position.i}-${position.j}`
  return cellClass
}

function addBall() {
  if (isOver) return
  const cell = getEmptyCell(gBoard)
  if (!cell) return
  gBoard[cell.i][cell.j].gameElement = BALL
  renderCell(cell, BALL_IMG)
}

function addGlue() {
  if (isOver) return
  const cell = getEmptyCell(gBoard)
  if (!cell) return
  gBoard[cell.i][cell.j].gameElement = GLUE
  renderCell(cell, GLUE_IMG)
  setTimeout(() => {
    if (isGlue) return
    gBoard[cell.i][cell.j].gameElement = null
    renderCell(cell, '')
  }, 3000)
}

function getEmptyCell(board) {
  const emptyCells = []
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j]
      if (currCell.type === FLOOR && currCell.gameElement === null) {
        emptyCells.push({ i, j })
      }
    }
  }
  if (!emptyCells.length) return null
  const randomIdx = getRandomIntInclusive(0, emptyCells.length - 1)
  return emptyCells[randomIdx]
}

function gameOver(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j]
      if (currCell.gameElement === BALL) {
        console.log('isOver:', isOver)
        return
      }
    }
  }
  isOver = true
  console.log('isOver:', isOver)
  return
}

function victory() {
  const audio = new Audio('audio/victory.mp3')
  audio.play()
  var ballsCollected = document.querySelector('.balls-collected')
  ballsCollected.innerHTML = `<h2 class="balls-collected">Victory!!</h2>
        `
}

function restartGame() {
  clearInterval(gBallInterval)
  clearInterval(gGlueInterval)
  isRestart = true
  isOver = false
  isGlue = false
  gBallCounter = 0
  initGame()
}

function countNeighbors(rowIdx, colIdx, mat) {
  gNeighborsCount = 0
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= mat.length) continue

    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= mat[i].length) continue
      if (i === rowIdx && j === colIdx) continue

      if (mat[i][j].gameElement === BALL) gNeighborsCount++
    }
  }
  return gNeighborsCount
}

function backgroundMusic() {
  const audio = new Audio('audio/Casino.mp3')
  setInterval(audio.play(), 90000)
}

function choosingCharacter(elBtn) {
  var cry
  var character
  character = elBtn.innerText
  console.log(character)
  switch (character) {
    case 'Snorlax':
      cry = new Audio('audio/Snorlax.mp3')
      cry.play()
      GAMER_IMG_DOWN = '<img src="img/snorlax_down.gif">'
      GAMER_IMG_UP = '<img src="img/snorlax_up.gif">'
      GAMER_IMG_RIGHT = '<img src="img/snorlax_right.gif">'
      GAMER_IMG_LEFT = '<img src="img/snorlax_left.gif">'
      break
    case 'Charizard':
      cry = new Audio('audio/Charizard.mp3')
      cry.play()
      GAMER_IMG_DOWN = '<img src="img/Charizard_down.gif">'
      GAMER_IMG_UP = '<img src="img/Charizard_up.gif">'
      GAMER_IMG_RIGHT = '<img src="img/Charizard_right.gif">'
      GAMER_IMG_LEFT = '<img src="img/Charizard_left.gif">'
      break
  }
  renderCell(gGamerPos, GAMER_IMG_DOWN)
}
