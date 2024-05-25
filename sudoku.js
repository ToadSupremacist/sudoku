(function (window, $, undefined) {
	'use strict';
    $.fn.sudoku = function(opts) {
		opts = opts || {};
		let boardFinished = false,
			invalidCandidates = [],
			board = [],
			boardSize,
			boardNumbers,

			squares = [
				//rows
				[],
				//columns
				[],
				//boxes
				[]
			];

		/*selectors*/
		let $board = $(this),
			$boardInputs;

		let contains = function(a, obj) {
			for (let i = 0; i < a.length; i++) {
				if (a[i] === obj) {
					return true;
				}
			}
			return false;
		};

		let isBoardFinished = function(){
			for (let i=0; i < boardSize*boardSize; i++){
				if($boardInputs[i].value === "")
					return false;
			}
			return true;
		};

		let generateSquareIndexList = function(){
        	squares = [
				//rows
				[],
				//columns
				[],
				//boxes
				[]
			]
			let boxSideSize = Math.sqrt(boardSize);

			for(let i=0; i < boardSize; i++){
				let row = [];
				let col = [];
				let box = [];
				for(let j=0; j < boardSize; j++){
					row.push(boardSize*i + j);
					col.push(boardSize*j + i);

					if(j < boxSideSize){
						for(let k=0; k < boxSideSize; k++){
							let a = Math.floor(i/boxSideSize) * boardSize * boxSideSize;
							
							let b = (i%boxSideSize) * boxSideSize;
							let boxStartIndex = a + b;

							box.push(boxStartIndex + boardSize*j + k);
						}
					}
				}
				squares[0].push(row);
				squares[1].push(col);
				squares[2].push(box);
			}
		};

		let initBoard = function(opts){
			let alreadyEnhanced = (board[0] !== null && typeof board[0] === "object");
			let nullCandidateList = [];
      		boardNumbers = [];
			boardSize = (!board.length && opts.boardSize) || Math.sqrt(board.length) || 9;
			$board.attr("data-board-size", boardSize);
			for (let i=0; i < boardSize; i++){
				boardNumbers.push(i+1);
				nullCandidateList.push(null);
			}
			generateSquareIndexList();

			if(!alreadyEnhanced){
				for(let j=0; j < boardSize*boardSize ; j++){
					let cellVal = (typeof board[j] === "undefined") ? null : board[j];
					let candidates = cellVal === null ? boardNumbers.slice() : nullCandidateList.slice();
					board[j] = {
						val: cellVal,
						candidates: candidates
					};
				}
			}
		};

		let renderBoard = function(){
			let htmlString = "";
			for(let i=0; i < boardSize*boardSize; i++){
				htmlString += renderBoardCell(board[i], i);

				if((i+1) % boardSize === 0) {
					htmlString += "<br>";
				}
			}
			$board.append(htmlString);

			$boardInputs = $board.find("input");
		};

		let renderBoardCell = function(boardCell, id){
			let val = (boardCell.val === null) ? "" : boardCell.val;
			return "<div class='sudoku-board-cell'>" +
						"<input type='text' pattern='\\d*' novalidate id='input-"+id+"' value='"+val+"'"+"maxlength=1"+">" +
					"</div>";
		};

		let buildCandidatesString = function(candidatesList){
			let s="";
			for(let i=1; i<boardSize+1; i++){
				if(contains(candidatesList,i))
					s+= "<div>"+i+"</div> ";
				else
					s+= "<div>&nbsp;</div> ";
			}
			return s;
		};

		let updateUIBoard = function(paintNew){
			$boardInputs
				.removeClass("highlight-val")
				.each(function(i,v){
					let $input = $(this);
					let newVal = board[i].val;
						$input.val(newVal);
						if(paintNew)
							$input.addClass("highlight-val");
				});
		};

		let updateUIBoardCell = function(cellIndex, opts){
			opts = opts || {};
				let newVal = board[cellIndex].val;

				$("#input-"+cellIndex)
					.val(newVal)
					.addClass("highlight-val");
		};

		let removeCandidatesFromCell = function(cell, candidates){
			let boardCell = board[cell];
			let c = boardCell.candidates;
			let cellUpdated = false;
			for(let i=0; i < candidates.length; i++){
				if(c[candidates[i]-1] !== null) {
					c[candidates[i]-1] = null;
					cellUpdated = true;
				}
			}
			if(cellUpdated)
				updateUIBoardCell(cell, {mode: "only-candidates"});
		};

		let clearBoard = function(){
			boardFinished = false;
			let cands = boardNumbers.slice(0);
			for(let i=0; i <boardSize*boardSize;i++){
				board[i] = {
					val: null,
					candidates: cands.slice()
				};
			}

			$boardInputs
				.removeClass("highlight-val")
				.val("");

			updateUIBoard(false);
		};

		let getNullCandidatesList = function() {
			let l = [];
			for (let i=0; i < boardSize; i++){
				l.push(null);
			}
			return l;
		};

		let resetCandidates = function(updateUI){
			let resetCandidatesList = boardNumbers.slice(0);
			for(let i=0; i <boardSize*boardSize;i++){
				if(board[i].val === null){
					board[i].candidates = resetCandidatesList.slice();
					if(updateUI !== false)
						$("#input-"+i+"-candidates").html(buildCandidatesString(resetCandidatesList));
				} else if(updateUI !== false) {
						$("#input-"+i+"-candidates").html("");
				}
			}
		};

		let setBoardCell = function(cellIndex, val){
			let boardCell = board[cellIndex];
			boardCell.val = val;
			if(val !== null)
				boardCell.candidates = getNullCandidatesList();
		};

		let indexInsquare = function(digit,square){
			for(let i=0; i < boardSize; i++){
				if(board[square[i]].val===digit)
					return i;
			}
			
			return false;
		};

		let squaresWithCell = function(cellIndex){
			let boxSideSize = Math.sqrt(boardSize);
			let squares = [];

			let row = Math.floor(cellIndex/boardSize);
			squares.push(row);

			let col = Math.floor(cellIndex%boardSize);
			squares.push(col);
			
			let box = (Math.floor(row/boxSideSize)*boxSideSize) + Math.floor(col/boxSideSize);
			squares.push(box);

			return squares;
		};

		let numbersTaken = function(square){
			let numbers = [];
			for(let i=0; i < square.length; i++){
				let n = board[square[i]].val;
				if(n !== null)
					numbers.push(n);
			}
			return numbers;
		};

		function checkDuplicates(){
			let hlength = squares.length;
			for(let i=0; i < hlength; i++){
				for(let j=0; j < boardSize; j++){
					let square = squares[i][j];
					let candidatesToRemove = numbersTaken(square);
					
					for (let k=0; k < boardSize; k++){
						let cell = square[k];
						
						removeCandidatesFromCell(cell, candidatesToRemove);
					}
				}
			}
			return false;
		}

		let displayMessage = function(){
			let x = document.querySelector(".win-message");
			let y = document.querySelector(".win-inner-box");
			x.style.display = "flex";
			$boardInputs.prop("disabled", true);
		}

		let keyboardMoveBoardFocus = function(currentId, keyCode){
			let newId = currentId;
			//right
			if(keyCode ===39)
				newId++;
			//left
			else if(keyCode === 37)
				newId--;
			//down
			else if(keyCode ===40)
				newId = newId + boardSize;
			//up
			else if(keyCode ===38)
				newId = newId - boardSize;

			//out of bounds
			if(newId < 0 || newId > (boardSize*boardSize))
				return;

			//focus input
			$("#input-"+newId).focus();
		};

		let keyboardNumberInput = function(input, id){
			let val = parseInt(input.val());

			let candidates = getNullCandidatesList();
			$("#input-"+id).addClass("highlight-val");
			if (val > 0) { 
				let temp = squaresWithCell(id);
				for(let i=0; i < squares.length; i++){
					if(indexInsquare(val, squares[i][temp[i]])){
						let alreadyExistingCellInsquareWithDigit = squares[i][temp[i]][indexInsquare(val, squares[i][temp[i]])];
						if(alreadyExistingCellInsquareWithDigit === id)
							continue;
							$("#input-"+id).removeClass("highlight-val");
							$("#input-"+id).addClass("board-cell--error");
						
						return;
					}
				}

				input.siblings(".candidates").html(buildCandidatesString(candidates));
				board[id].candidates = candidates;
				board[id].val = val;

				if(isBoardFinished()){
					boardFinished = true;
					console.log("user finished board!");
			
					if(typeof opts.boardFinishedFn === "function"){
						opts.boardFinishedFn({
						});
					}
					displayMessage();
				}
			} else {
				val = null;
				candidates = boardNumbers.slice();

				board[id].val = val;
				checkDuplicates();
			}
			if($("#input-"+id).hasClass("board-cell--error"))
				$boardInputs.removeClass("board-cell--error");

			if(typeof opts.boardUpdatedFn === "function")
				opts.boardUpdatedFn({cause: "user input", cellsUpdated: [id]});

		};

		let setBoardCellWithRandomCandidate = function(cellIndex, forceUIUpdate){
			checkDuplicates();
			let invalids = invalidCandidates && invalidCandidates[cellIndex];
			
			let candidates = board[cellIndex].candidates.filter(function(candidate){
				if(!candidate || (invalids && contains(invalids, candidate)))
					return false;
				return candidate;
			});
			
			if(candidates.length === 0) {
				return false;
			}
			let randIndex = Math.round ( Math.random() * (candidates.length - 1));
			let randomCandidate = candidates[randIndex];
			
			setBoardCell(cellIndex, randomCandidate);
			return true;
		};

		let generateBoardAnswer = function(cellIndex){
			if((cellIndex+1) > (boardSize*boardSize)){
				invalidCandidates = [];
				return true;
			}
			if(setBoardCellWithRandomCandidate(cellIndex)){
				generateBoardAnswer(cellIndex + 1);
			} else {
				if(cellIndex <= 0)
					return false;
				let lastIndex = cellIndex - 1;
				invalidCandidates[lastIndex] = invalidCandidates[lastIndex] || [];
				invalidCandidates[lastIndex].push(board[lastIndex].val);
				
				setBoardCell(lastIndex, null);
				
				resetCandidates(false);
				
				invalidCandidates[cellIndex] = [];
				
				generateBoardAnswer(lastIndex);
				return false;
			}
		};

		let generateBoard = function(){
			if($boardInputs)
				clearBoard();

			generateBoardAnswer(0);

			if($boardInputs)
				updateUIBoard();

			checkDuplicates();
		};

		function hideRandomNumbers(count) {
			let hiddenIndexes = [];
			while (hiddenIndexes.length < count) {
				let randomIndex = Math.floor(Math.random() * 81);
				if (!hiddenIndexes.includes(randomIndex)) {
					hiddenIndexes.push(randomIndex);
				}
			}
		
			hiddenIndexes.forEach(index => {
				$boardInputs[index].setAttribute("value", "");
			});
		}

		function showNumbers(count) {
			let shown = 0;
			for (let i = 0; i < 81; i++){
				if ($boardInputs[i].value == "" && shown < count){
					$boardInputs[i].setAttribute("value", board[i].val);
					shown++;
				}
			}
		}

		document.querySelector(".play-again").addEventListener("click", ()=>
			{
				location.reload();
			});

		/*init/API/events*/
		if(!opts.board) {
			initBoard(opts);
			generateBoard(opts);
			renderBoard();
			hideRandomNumbers(32);
		} else {
			board = opts.board;
			initBoard();
			renderBoard();
			checkDuplicates();
			hideRandomNumbers(32);
		}

		$boardInputs.on("keyup", function(e){
			let $this = $(this);
			let id = parseInt($this.attr("id").replace("input-",""));
			
			if(e.keyCode >=37 && e.keyCode <= 40){// || e.keyCode ===48){
				keyboardMoveBoardFocus(id, e.keyCode);
			}
		});
		
		$boardInputs.on("change", function(){
			let $this = $(this);
			let id = parseInt($this.attr("id").replace("input-",""));
			keyboardNumberInput($this, id);
		});

		let getBoard = function(){
			return board;
		};
		let setBoard = function(newBoard){
      		clearBoard();
			board = newBoard;
			initBoard();
			checkDuplicates();
			updateUIBoard(false);
		};

		return {
			clearBoard : clearBoard,
			getBoard : getBoard,
			setBoard : setBoard,
			generateBoard : generateBoard,
			hideRandomNumbers : hideRandomNumbers,
			showNumbers: showNumbers
		};
	};
})(window, jQuery);