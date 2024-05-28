// create basic blocks of the board
function square(x, y, w, h, landType) {
    this.w = w;
    this.h = h;
    this.left = x;
    this.right = x + w;
    this.top = y;
    this.bottom = y + h;

    // land type
    this.landType = landType;

    // track the highlight
    this.highlight = null;

    // track the number of selected squares
    this.numSelected = 0;
    this.owner = null;

    // need to know select or not
    this.sideBottom = { owner: null, selected: false };
    this.sideTop = { owner: null, selected: false };
    this.sideLeft = { owner: null, selected: false };
    this.sideRight = { owner: null, selected: false };


    this.contains = function (x, y) {
        // ensure it is in the square
        return x >= this.left && x < this.right && y >= this.top && y < this.bottom;
    }

    this.drawFill = function () {

        // fill nothing if not in turn
        if (this.owner == null) {
            return;
        }

        if (this.landType === 'regular') {
            // console.log("Regular land -- Player color");
            context.fillStyle = getColor(this.owner, true);
        } else if (this.landType === 'copper') {
            // console.log("Copper land -- Copper color");
            context.fillStyle = bonusColor;
        }
        
        // fill the square with light color
        // context.fillStyle = getColor(this.owner, true);
        context.fillRect(this.left + stroke, this.top + stroke, this.w - stroke * 2, this.h - stroke * 2);

        // player name shows in the square
        displayText(
            getText(this.owner, true),
            this.left + this.w / 2,
            this.top + this.h / 2,
            getColor(this.owner, false),
            nameSize
        );
    }

    this.drawSide = function (side, color) {
        switch (side) {
            case fence.bottom:
                drawLine(this.left, this.bottom, this.right, this.bottom, color); // the line is from left bottom to right bottom
                break;
            case fence.left:
                drawLine(this.left, this.top, this.left, this.bottom, color);
                break;
            case fence.right:
                drawLine(this.right, this.top, this.right, this.bottom, color);
                break;
            case fence.top:
                drawLine(this.left, this.top, this.right, this.top, color);
                break;
        }
    }

    // cooper land first so that it can be covered by highlight
    this.drawLand = function () {
        this.drawFill();
        if (this.landType === 'copper') {
            context.strokeStyle = cooperSide;
            context.strokeRect(this.left, this.top, this.w, this.h);
        }
    }

    this.drawSides = function () {

        // before selecting a side, just highlight using highlight color
        if (this.highlight != null) {
            this.drawSide(this.highlight, getColor(playerId, true));
        }

        if (this.sideBottom.selected) {
            this.drawSide(fence.bottom, getColor(this.sideBottom.owner, false));
        }
        if (this.sideTop.selected) {
            this.drawSide(fence.top, getColor(this.sideTop.owner, false));
        }
        if (this.sideLeft.selected) {
            this.drawSide(fence.left, getColor(this.sideLeft.owner, false));
        }
        if (this.sideRight.selected) {
            this.drawSide(fence.right, getColor(this.sideRight.owner, false));
        }
    }

    this.highlightSide = function (x, y) {
        // calculate the distances to each side
        // vertical distance
        let dBottom = this.bottom - y;
        let dTop = y - this.top;
        // horizontal distance
        let dLeft = x - this.left;
        let dRight = this.right - x;

        // determine closest value
        let dClosest = Math.min(dBottom, dLeft, dRight, dTop);

        // highlight the closest if not already selected
        if (dClosest == dBottom & !this.sideBottom.selected) {
            this.highlight = fence.bottom
        } else if (dClosest == dLeft & !this.sideLeft.selected) {
            this.highlight = fence.left;
        } else if (dClosest == dRight & !this.sideRight.selected) {
            this.highlight = fence.right;
        } else if (dClosest == dTop & !this.sideTop.selected) {
            this.highlight = fence.top;
        }

        // return the highlighted side
        return this.highlight;
    }

    this.selectSide = function () {

        // check if it is highlight or not
        // no highlight means nothing to select
        if (this.highlight == null) {
            return;
        }

        // select the highlighted side
        switch (this.highlight) {
            case fence.bottom:
                this.sideBottom.owner = playerId;
                this.sideBottom.selected = true;
                break;
            case fence.left:
                this.sideLeft.owner = playerId;
                this.sideLeft.selected = true;
                break;
            case fence.right:
                this.sideRight.owner = playerId;
                this.sideRight.selected = true;
                break;
            case fence.top:
                this.sideTop.owner = playerId;
                this.sideTop.selected = true;
                break;
        }

        // after selecting a side we dont need highlight anymore
        this.highlight = null;

        // increase the number of selected squares
        // this.numSelected++;

        // // when the number of selected is 4, it means the square is filled
        // if (this.numSelected == 4) {
        //     // the player keeps going
        //     this.owner = playerId;

        //     // increase score
        //     if (turn) {
        //         scoreP1++;
        //     } else {
        //         scoreP2++;
        //     }

        //     // filled
        //     return true;
        // }

        // not filled
        return false;
    }

}