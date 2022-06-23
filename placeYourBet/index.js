//assures function will only run after document is ready
$(document).ready(function () {
  var squares = [
    {
      name: 'square1',
      sqrColor: 'pink',
      margRight: 15,
      margTop: 3,
      sqWidth: 35,
      sqHeight: 15
    },
    {
      name: 'square2',
      sqrColor: 'green',
      margRight: 60,
      margTop: 3,
      sqWidth: 35,
      sqHeight: 15
    },
    {
      name: 'square3',
      sqrColor: 'yellow',
      margRight: 105,
      margTop: 3,
      sqWidth: 35,
      sqHeight: 15
    },
    {
      name: 'square4',
      sqrColor: 'red',
      margRight: 150,
      margTop: 3,
      sqWidth: 35,
      sqHeight: 15
    },
    {
      name: 'square5',
      sqrColor: 'blue',
      margRight: 195,
      margTop: 3,
      sqWidth: 35,
      sqHeight: 15
    },
    {
      name: 'square5',
      sqrColor: 'orange',
      margRight: 240,
      margTop: 3,
      sqWidth: 35,
      sqHeight: 15,
    },
  ];
  var formData;
  var placeYourBetInterval;
  const modal = document.querySelector('.modal');
  const winnersModal = document.querySelector('.winners-modal');
  $(".validation-text").hide();

  modal.showModal();

  let awaitUserInput = new Promise(function(successful,unsuccessful){

    $("#button-submit").click(()=>{
      formData = $('form').serializeArray();
      //formData[0].value != '' || formData[0].value != null || 
      if(formData[0].value){
        console.log("formData[0] " + formData[0].value)
        successful("success");
        modal.close();
      }else{
        $(".validation-text").show();
        unsuccessful("At least one bet should be placed");
      }
    });    
  });

  awaitUserInput.then((sucessfulData)=>{
    console.log(sucessfulData);
    console.log('after submitted');
    console.log(formData);
  }, (error)=>{
    console.log(error);
  })

  var canvas = $('#bordCanvas')[0];
  var context = canvas.getContext('2d');
  


  $.each(squares, function (index, object) {
    context.fillStyle = object.sqrColor;
    context.fillRect(
      object.margRight,
      object.margTop,
      object.sqWidth,
      object.sqHeight
    );
    context.strokeText(index, object.margRight + 7, object.margTop + 9);
  });

  $('#start').click(function () {
    if(!placeYourBetInterval){
      placeYourBetInterval = setInterval(starGame, 300);
    }
  });

  $('.reloadPage').click(function () {
    location.reload();  
  });

  function starGame() {
    clearRace();
    moveSquares();
  }

  function moveSquares() {
    $.each(squares, function (index, object) {
      var randomSpeed = Math.floor(Math.random() * 10);
      squares[index].margTop = squares[index].margTop + randomSpeed;
      context.fillStyle = squares[index].sqrColor;
      context.fillRect(
        squares[index].margRight,
        squares[index].margTop,
        squares[index].sqWidth,
        squares[index].sqHeight);
        context.strokeText(index, squares[index].margRight + 7, squares[index].margTop + 9);
        if (squares[index].margTop > (canvas.height - 20)) {
          gameOver(squares);
          findWinner(index);
        }
    });  
  }

  function clearRace() {
    //clear the entire canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function gameOver(data) {
    console.log(data);
    clearInterval(placeYourBetInterval);
  }
  function findWinner(index){
    //receives square and square position
    let winners = [];
    //find all the users who have places the bet based on the index of the horses
    for(let i= 1; i < formData.length; i+=2){
      if(formData[i].value == index){
        winners.push(
          {
            winnerName: formData[(i - 1)].value,
            winnerBet: formData[i].value
          })
      }
    }
    if(winners.length == 0){
      $('.winners-title').hide();
      $("#losers-title").text("Loser(s)!!");
      $("#losers-title").append('<h1 class="losers-text">TRY AGAIN!</h1>')
      $('#winnersModal').removeClass("winners-modal").addClass("losers-modal");
    }else{ 
      $("#losers-title").hide();
      $('.horse-info').after('<ul id="winnersList"><ul>');
      $.each(winners, (index,winner)=>{
        $('#winnersList').append('<li calss="items-winners">Name:' + winner.winnerName + ';' + 'Bet: ' + winner.winnerBet + '</li>');
      })
      
    }
    $("#horsePosition").text('Position: ' + index);
    $("#horseColor").text('Color: ' + squares[index].sqrColor);
    winnersModal.showModal();
  }
});
