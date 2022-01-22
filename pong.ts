import {fromEvent, from, zip, Subscription } from 'rxjs'
import { Observable } from 'rxjs/Rx' 
import { takeUntil, map, scan, filter, merge, flatMap, take, concat } from 'rxjs/operators'
import { interval } from 'rxjs/observable/interval';
function pong(){
  const startonce :Subscription = Observable.fromEvent(document, 'keypress')
  .subscribe(() =>  pongGame(startonce));
}

function pongGame(startonce :Subscription) :void {
  startonce.unsubscribe();
  const
    svg: HTMLElement = document.getElementById("canvas")!,
    score1area: Element = score1(),
    score2area: Element = score2(),
    bar2 :HTMLElement = document.getElementById("bar2")!,
    playagain :HTMLElement = document.getElementById("playagain");

  var
    signX: number = 1,
    signY: number = 1,
    player1current: number = 0,
    player2current: number = 0,
    pongSpeed :HTMLSelectElement = document.getElementById("speed") as HTMLSelectElement,
    ponguserspeed = Number(pongSpeed.options[pongSpeed.selectedIndex].value);

  type State = Readonly<{
    x: number;
    y: number;
  }>

  //initial state for the human player bar 
  const initialState: State = { x: 500, y: 75 };

  //this function will move the user's bar 
  function move(s: State, move: number): State {

    return {
      ...s,
      y: s.y + move
    }
  }

  //updating the user's bar states 
  function updateView(state: State): void{
    state.y < 550 && state.y > 0 ? bar2.setAttribute('transform', `translate(${state.x},${state.y})`) : null
  
  }

  // this code below will move the user bar with keyup and keydown 
  //reference  https://tgdwyer.github.io/asteroids/
  fromEvent<KeyboardEvent>(document, 'keydown')
    .pipe(
      filter(({ code }) => code === 'ArrowUp' || code === 'ArrowDown'),
      filter(({ repeat }) => !repeat),
      flatMap(d => interval(1).pipe(
        takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
          filter(({ code }) => code === d.code)
        )),
        map(_ => d))
      ),
      map(({ code }) => code === 'ArrowUp' ? -1 : 1),
      scan(move, initialState))
    .subscribe(updateView)


  // get the svg canvas element
  // create the ball
  const pong = document.createElementNS(svg.namespaceURI, 'circle')
  pong.setAttributeNS(null, "cx", "300"); //inital cx position of ball
  pong.setAttributeNS(null, "cy", "300"); //inital cy position of ball 
  pong.setAttributeNS(null, "r", "10");  //radius of the ball 
  pong.setAttributeNS(null, "fill", "red");
  svg.appendChild(pong);


   const pongmove :number = setInterval(function () {
    const
      posX: number = Number(pong.getAttribute('cx')),
      posY: number = Number(pong.getAttribute('cy'));
    pong.setAttribute('cx', String(signY + Number(pong.getAttribute('cx'))));
    pong.setAttribute('cy', String(signY + Number(pong.getAttribute('cy'))));

    /* using ternary operations to restrict the ball to the canvas if reached maximum 
    or minimum the ball will move to the opposite direction 
    */
    posX >= 595 ? signX = -1 : 1
    posY >= 595 ? signY = -1 : 1
    posX <= 3 ? signX = 1 : -1
    posY <= 3 ? signY = 1 : -1
  }, ponguserspeed);


  //this function will create the CPU's bar which will follow the ball 
  const bar1 :Element = document.createElementNS(svg.namespaceURI, 'rect')
  Object.entries({
    x: 75, y: 75,
    width: 10, height: 60,
    fill: '#95B3D7',
  }).forEach(([key, val]) => bar1.setAttribute(key, String(val)))
  svg.appendChild(bar1);

  /*
  the following function will move the cpu bar according to the balls y position according to the specifications 
  */
  const barmove :number = setInterval(function () :void {

    var ballYposition: number = Number(pong.getAttribute("cy"))
    var paddleSize :HTMLSelectElement = document.getElementById("size") as HTMLSelectElement;
    var strUser = paddleSize.options[paddleSize.selectedIndex].value
    bar1.setAttribute('y', String(ballYposition));
    bar1.setAttribute("height",strUser);
    const userBar :HTMLElement = document.getElementById("userbar");
    userBar.setAttribute('height',strUser);
  }, 3);


  //creating score 1 area 
  function score1() :Element {
    const score1area = document.createElementNS(svg.namespaceURI, "text");
    var current = document.createTextNode(String(player2current));
    score1area.setAttribute("x", "475");
    score1area.setAttribute("y", "50");
    score1area.setAttribute("fill", "white");
    score1area.appendChild(current);
    svg.appendChild(score1area)
    return score1area
  }
  //creating score 2 area 
  function score2() :Element{
    const score2area = document.createElementNS(svg.namespaceURI, "text");
    var current = document.createTextNode(String(player1current));
    score2area.setAttribute("x", "105");
    score2area.setAttribute("y", "50");
    score2area.setAttribute("fill", "white");
    score2area.appendChild(current);
    svg.appendChild(score2area)
    return score2area
  }

  /*this function below will check whether the ball touches the boundary of the SVG element and 
  determines which player has received the point if any and the end it calls the ballreset function that resets the
  ball if a score has been made and calls endgame function which checks if any player has score 7 so that the game can be 
  terminated 
  */
  const scores :number = setInterval(function () :void {
    const posX: number = Number(pong.getAttribute("cx"));
    posX <= 2 ? player2current += 1 : player2current + 0
    posX >= 596 ? player1current += 1 : player1current + 0

    score1area.textContent = String(player2current);
    score2area.textContent = String(player1current);
    ballreset();
    endgame();
  }, 1);

  //this function will reset the ball to its initial position in the center 
  function ballreset() :void {
    const posX: number = Number(pong.getAttribute("cx"));
    posX <= 2 || posX >= 596 ? pong.setAttributeNS(null, "cy", "300") : null
    posX <= 2 || posX >= 596 ? pong.setAttributeNS(null, "cx", "300") : null
  }


//the endgame function will check if any player has scored 7 points and will call functions accordingly. 
  function endgame() :void{
    const currentscoreplayer1: number = Number(score1area.textContent)
    const currentscoreplayer2: number = Number(score2area.textContent)

    currentscoreplayer1 == 7 ? player2wins() : null
    currentscoreplayer2 == 7 ? player1wins() : null
  }


//if player one wins the following function will display it's name 
  function player1wins() :void {
    //halting all intervals to stop all gameplay 
    clearInterval(scores);
    clearInterval(barmove);
    clearInterval(pongmove);
    clearInterval(hitpong);
    const winnerarea = document.createElementNS(svg.namespaceURI, "text");
    var winner = document.createTextNode("Player 1 Wins!"); //styles to display winner 
    winnerarea.setAttribute("x", "250");
    winnerarea.setAttribute("y", "300");
    winnerarea.setAttribute("fill", "white");
    winnerarea.setAttribute("font-size", "larger");
    winnerarea.appendChild(winner);
    svg.appendChild(winnerarea); //prints the winners name 
      playagain.style.display = "block" //displays play again button 
      Observable.fromEvent(playagain, 'click') //makes an observable to check if button has been clicked 
  .subscribe(() => window.location.reload()); //game restarts 
  }

//if player two wins the following function will display it's name 
  function player2wins() :void {
        //halting all intervals to stop all gameplay 
    clearInterval(scores);
    clearInterval(barmove);
    clearInterval(pongmove);
    clearInterval(hitpong)
    const winnerarea = document.createElementNS(svg.namespaceURI, "text");
    var winner = document.createTextNode("Player 2 Wins!");
    winnerarea.setAttribute("x", "250");
    winnerarea.setAttribute("y", "300");
    winnerarea.setAttribute("fill", "white");
    winnerarea.setAttribute("font-size", "larger");
    winnerarea.appendChild(winner);
    svg.appendChild(winnerarea);
    playagain.style.display = "block"
    Observable.fromEvent(playagain, 'click')
    .subscribe(() => window.location.reload());

  }
  // the following function checks if any paddle has touched the ball 
  const hitpong :number = setInterval(function () :void {
    var
      posY: number = Number(pong.getAttribute('cy')),
      posX: number = Number(pong.getAttribute('cx')),
      bar1X: number = Number(bar1.getAttribute("x")),
      bar1Y: number = Number(bar1.getAttribute("y"));
      var translatevalues = bar2.getAttribute('transform').split(' ',1);
      var barY = translatevalues[0].split(',')
      var bar = barY[1];
      bar = bar.substring(0, bar.length - 1);
      var bar2Y = Number(bar)
      bar1X == posX && bar1Y == posY ? pong.setAttribute("cx", String(posX+350)) :null
      500 == posX && bar2Y == posY ? pong.setAttribute("cx", String(posX-350)) :null
  }, 3);

}

if (typeof window != 'undefined')
  window.onload = () => {
    pong();
  }

    
