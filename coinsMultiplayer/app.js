//firebase configuration
//authentication is set to anonymoys - credentials are not required
//users will be able to read the database if they are authenticated
//players can write they own data

/**
 * this program has logic for one player (one node in the DB) as well as for all players (all DB nodes)
 * a lot of the methods called in this program are firebase based
 */


// Options for Player Colors... 
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];
//mapping of all the scenario -> player shouldn't be allowed to move if the next move corresponds to any of these X and Y coordinatiotes
const mapData = {
    minX: 1,
    maxX: 14,
    minY: 4,
    maxY: 12,
    blockedSpaces: {
        "7x4": true,
        "1x11": true,
        "12x10": true,
        "4x7": true,
        "5x7": true,
        "6x7": true,
        "8x6": true,
        "9x6": true,
        "10x6": true,
        "7x9": true,
        "8x9": true,
        "9x9": true,
    },
};
const nameInput = createName();

//this function will run when page loads
(function (){

/* 
    'playerId' stores main playerId
    'playerRef' will store reference to the main player node from DB
    'playerElements' helps to manage players on the dom - the object will have playerId as key and the dom as value
    'players' is what will make possible for main player to see the position of the other players
    'coins' will manage the visibility of them on the screen
    'coinsElements' will store each coin id and their element dom as the value
    'timer' will define until the game should run
*/
let playerId;
let playerRef;
let players;
let playerElements = {};
let coins = {};
let coinsElements = {};
let coinsAddedRed = 0;
let coinsAddedYellow = 0;
let allowedToMove = true;
//get dom elements
const gameContainer = document.querySelector(".game-container");
const playerNameInput = document.querySelector("#player-name");
const playerColorButton = document.querySelector("#player-color");

document.getElementById("dismiss-popup-btn").addEventListener("click", function(){
    document.getElementsByClassName("popup")[0].classList.remove("active");
    location.reload();
    return false;
});
// //receives a list of objects
// function listRanking(players){
//     Object.keys(players).forEach((key) => {
//         console.log("im inside object keys");
//         rankingPlayers.push(players[key])
//     });

//     rankingPlayers.sort((a,b)=> {
//         return b.coins - a.coins;
//     });
//     console.log(rankingPlayers);

//     //  //when player clicks on the button it should check if the ranking table has any node
//     //it should delete all the nodes before setting a new one
//     // firebase.database().ref("ranking").then(function(snapshot){
//     //     snapshot.forEach(function(child) {
//     //         child.ref.remove();
//     //         console.log("Removed!");
//     //         rankingElements = '';
//     //       })
//     // });

//     mainRankingDb = firebase.database().ref(`ranking/${playerId}`);
//         /*
//         creating an object
//         For basic write operations, you can use set() to save data to a specified reference
//         replacing any existing data at that path
//         */
//     mainRankingDb.set({
//         id: playerId,
//         listRanking: rankingPlayers
//     })
// }


// function updateTimeCounter() {
//     //get minutes
//     let minutes = Math.floor(timer / 60);
//     let seconds = timer % 60;
//     minutes = minutes < 10 ? '0' + minutes : minutes;
//     seconds = seconds < 10 ? '0' + seconds : seconds;
//     timerCounter.innerHTML = `${minutes}:${seconds}`;
//     console.log(`${minutes}:${seconds}`);
//     //timer--;
//     timer = timer - 30;
//     console.log(`${minutes}:${seconds}`);
// }




//this helper function will keep placing the coin until the brower is on because of the placeCoin() inside of timeout (there is a loop)
function placeCoinYellow() {
    //once the game is on, this coin will be placed to start
    const { x, y } = getRandomSafeSpot();
    const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`);
    coinRef.set({
      x,
      y,
      color: "yellow"
    })

    const coinTimeouts = [2000, 3000, 4000, 5000];
    setTimeout(() => {
      //once the time is up - another coin will be placed
      placeCoinYellow();
      //the randomFromArray(coinTimeouts) will randomly choose 2, 3, 4 or 5 seconds
    }, randomFromArray(coinTimeouts));
}
function placeCoinRed() {
    //once the game is on, this coin will be placed to start
    const { x, y } = getRandomSafeSpot();
    const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`);
    coinRef.set({
      x,
      y,
      color: "red"
    })

    setTimeout(() => {
      //once the time is up - another coin will be placed
      placeCoinRed();
      //the red coin is only placed every 5 seconds
    }, 10000);
}
function attemptGrabCoin(x,y) {
    //this function should be fired off whenever character moves to a new positon
    //it needs to check if the character position colides with a coin position
    //the parameters accept by this function will be x and y of the character
    //the parameters passed are the player moviment
    const key = getKeyString(x, y);
    //does the player XandY matches with any position of the keys?
    if(coins[key]) {
        //remove this coin from database under coins, then uptick player's coin count
        //note: since this is a game for educational purpose there is no problem of having this on the client side
        //because the client could go to the inspector and cheat
        //a backend validation/server would need to be needed to bypass this
        firebase.database().ref(`coins/${key}`).remove();
        playerRef.update({
            coins: players[playerId].coins + 1
        })
        if(coins[key].color == 'red') {
            gameOver();
            allowedToMove = false;
        }
    }

}
//this function helps moving character
//it will be called whenever the presses one of the arrows
function handleArrowPress(xChange=0, yChange=0) {
    //change the position of the object in the players (display characters on the screen)
    //current position + 1 or -1
    const newX = players[playerId].x + xChange;
    const newY = players[playerId].y + yChange;
    //before moving character program needs to check if the next moviment is allowed
    if (!isSolid(newX,newY) && allowedToMove) {
        console.log("inside next move: " + allowedToMove)
        //move to the next space
        //overwrite corresponding object with the right positions
        players[playerId].x = newX;
        players[playerId].y = newY;
        //change the image of the character based on the direction
        if (xChange === 1) {
            players[playerId].direction = "right";
        }
        if (xChange === -1) {
            players[playerId].direction = "left";
        }
        //overwrite the entire reference
        //once the playerRef is set. The database will be changed and the method .on will be fired
        playerRef.set(players[playerId]);
        //attemptGrabCoin(newX,newY);
        attemptGrabCoin(newX,newY);
    }
}

function startGame() {

    new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
    new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
    new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
    new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))

    //grab data from DB
    //this constant will be used to listen to any change so it can help with  maniputation
    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);

    

    //the following method will be used to listen to any modification to the 'players' node
    allPlayersRef.on("value", (dataSnapshot) => {
        //whenever a key is pressed to move the character around, a signal will be sent to firebase to update character in firebase state 
        //and it will notify the program as a change with the help of the 'allPlayersRef.on("value",(dataSnapshot)=> {})' function
        //once the change is received it will be rendered back on the screen
        players = dataSnapshot.val() || {};
        //this will make possible players see each other
        Object.keys(players).forEach((key) => {
            const characterState = players[key];
            let el = playerElements[key];
            // Now update the DOM with changes if there has been any
            el.querySelector(".Character_name").innerText = characterState.name;
            el.querySelector(".Character_coins").innerText = characterState.coins;
            el.setAttribute("data-color", characterState.color);
            el.setAttribute("data-direction", characterState.direction);
            const left = 16 * characterState.x + "px";
            const top = 16 * characterState.y - 4 + "px";
            el.style.transform = `translate3d(${left}, ${top}, 0)`;
        });
        
    });
    //when a new node is added to the players table
    //that could be when a new user joins the game
    allPlayersRef.on("child_added", (dataSnapshot) => {
        const addedPlayer = dataSnapshot.val();
        const characterElement = document.createElement("div");
        characterElement.classList.add("Character", "grid-cell");
        //this class is added to the player
        if (addedPlayer.id === playerId) {
            characterElement.classList.add("you");
        }
        characterElement.innerHTML = (`
            <div class="Character_shadow grid-cell"></div>
            <div class="Character_sprite grid-cell"></div>
            <div class="Character_name-container">
                <span class="Character_name"></span>
                <span class="Character_coins">0</span>
            </div>
            <div class="Character_you-arrow"></div>
        `);
        //show character element on page
        playerElements[addedPlayer.id] = characterElement;

        //populate the HTML elements after innering them
        characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
        characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins;
        //once the custom attribute are added to the HTML element the css will be applied
        characterElement.setAttribute("data-color", addedPlayer.color);
        characterElement.setAttribute("data-direction", addedPlayer.direction);
        const left = 16 * addedPlayer.x + "px";
        const top = 16 * addedPlayer.y -4 +  "px";
        //control movement effect
        //css transition is used with the transform
        //transition effect will start when the specified CSS property (transform) changes value
        characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
        gameContainer.appendChild(characterElement);

        //allows you to add a node to the end of the list of child nodes of a specified parent node.
        
    });

    //Remove character DOM element after they leave
    allPlayersRef.on("child_removed", (dataSnapshot) => {
        console.log("disconect has been called remove dom");
        const removedKey = dataSnapshot.val().id;
        //remove div from dom
        gameContainer.removeChild(playerElements[removedKey]);
        //delete the element from all the players elements
        delete playerElements[removedKey];
    });

    /**
     * coin logic follow the same path as the players
     * once coin is added the program will be informed and will store its X&Y on the 'coins' variable
     * 
     */

    allCoinsRef.on("child_added", (dataSnapshot)=>{

        const coin = dataSnapshot.val();
        const key = getKeyString(coin.x, coin.y);
        //adding to the varible that stores all coins visible on the screen for all players
        coins[key] = {
                        exist :true,
                        color:coin.color
                    };
        

        //we need to add to the dom different css based on the coin property
            // Create the DOM Element
        const coinElement = document.createElement("div");
        coinElement.classList.add("Coin", "grid-cell");
        if(coin.color == 'yellow'){
            coinsAddedYellow = coinsAddedYellow + 1;
            coinElement.innerHTML = `
            <div class="Coin_shadow grid-cell"></div>
            <div class="Coin_sprite_yellow grid-cell"></div>
        `;
        }else {
            coinsAddedRed = coinsAddedRed + 1;
            if(coinsAddedRed <= 20) {
                coinElement.innerHTML = `
                <div class="Coin_shadow grid-cell"></div>
                <div class="Coin_sprite_red grid-cell"></div>
                `;
            };
        }
        // Position the Element
        const left = 16 * coin.x + "px";
        const top = 16 * coin.y - 4 + "px";
        coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

        // Keep a reference for removal later and add to DOM
        coinsElements[key] = coinElement;
        gameContainer.appendChild(coinElement);
    });

    //when a coin leaves/removed the node this method will be listening to it
    allCoinsRef.on("child_removed", (dataSnapshot)=>{
        const {x,y} = dataSnapshot.val();
        const keyToRemove = getKeyString(x,y);
        gameContainer.removeChild(coinsElements[keyToRemove]);
        delete coinsElements[keyToRemove];
    });

    //Updates player name with text input
    //it will be update for only current player
    playerNameInput.addEventListener("change", (e) => {
        const newName = e.target.value || createName();
        playerNameInput.value = newName;
        playerRef.update({
            name: newName
        });
    });

    //Update player color on button click
    playerColorButton.addEventListener("click", () => {
        const mySkinIndex = playerColors.indexOf(players[playerId].color);
        //if there is a next index assign it to be the value otherwise default it to zero
        const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
        //it will be update for only current player
        playerRef.update({
            color: nextColor
        });
    });

    

    placeCoinYellow();
    placeCoinRed();
}

//this method will be fired by the 'signInAnonymously' method
firebase.auth().onAuthStateChanged((user)=>{
    if(user){
        playerId = user.uid;
        const {x, y} = getRandomSafeSpot();
        
        //get a reference to the player in the database
        playerRef = firebase.database().ref(`players/${playerId}`);
        /*
        creating an object
        For basic write operations, you can use set() to save data to a specified reference
        replacing any existing data at that path
        */
        playerRef.set({
            id: playerId,
            name: nameInput,
            direction: "right",
            color: randomFromArray(playerColors),
            x: x,
            y: y,
            coins: 0
        })
        /*
        if browser is closed player should be disconnected
        The onDisconnect class allows you to write or clear data when your client disconnects from the Database server.
        */
        playerRef.onDisconnect().remove();
        //user has been created in the DB and now it is time to start the game
        startGame();
    }else {
        console.log("player has left");
    }
})

//as soon as the game is loaded and login user in anonymously
//if something goes wrong the catch block will be fired
//the method below will trigger an authchanged
firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
    });
})();


/* utilities function */
function gameOver(){
    //pop up
    document.getElementsByClassName("popup")[0].classList.add("active");
    console.log("game is over!!");
    //location.reload();
}
//function accepts an array and return a random alement
function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

//return arguments in a specified format
function getKeyString(x, y) {
    return `${x}x${y}`;
}

//it returns a ${prefix} ${animal} of two given arrays
function createName() {
    const prefix = randomFromArray([
      "COOL",
      "SUPER",
      "HIP",
      "SMUG",
      "COOL",
      "SILKY",
      "GOOD",
      "SAFE",
      "DEAR",
      "DAMP",
      "WARM",
      "RICH",
      "LONG",
      "DARK",
      "SOFT",
      "BUFF",
      "DOPE",
    ]);
    const animal = randomFromArray([
      "BEAR",
      "DOG",
      "CAT",
      "FOX",
      "LAMB",
      "LION",
      "BOAR",
      "GOAT",
      "VOLE",
      "SEAL",
      "PUMA",
      "MULE",
      "BULL",
      "BIRD",
      "BUG",
    ]);
    return `${prefix} ${animal}`;
}

//based on the hardcoded array
//the element returned from it will be the potition on which the player will be placed
function getRandomSafeSpot() {
    //this is a harded coded array with save spots
    //it simplies return only x and y
    return randomFromArray([
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 5 },
      { x: 2, y: 6 },
      { x: 2, y: 8 },
      { x: 2, y: 9 },
      { x: 4, y: 8 },
      { x: 5, y: 5 },
      { x: 5, y: 8 },
      { x: 5, y: 10 },
      { x: 5, y: 11 },
      { x: 11, y: 7 },
      { x: 12, y: 7 },
      { x: 13, y: 7 },
      { x: 13, y: 6 },
      { x: 13, y: 8 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
      { x: 10, y: 8 },
      { x: 8, y: 8 },
      { x: 11, y: 4 },
    ]);
}
//
function isSolid(x,y) {
    //is there anything at the location the avatar is moving too?
    const blockedNextSpace = mapData.blockedSpaces[getKeyString(x,y)];
    return (
        blockedNextSpace ||
        x >= mapData.maxX ||
        x < mapData.minX ||
        y >= mapData.maxY ||
        y < mapData.minY
      )
}

