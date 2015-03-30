!function e(t,i,s){function n(o,a){if(!i[o]){if(!t[o]){var r="function"==typeof require&&require;if(!a&&r)return r(o,!0);if(l)return l(o,!0);var c=new Error("Cannot find module '"+o+"'");throw c.code="MODULE_NOT_FOUND",c}var h=i[o]={exports:{}};t[o][0].call(h.exports,function(e){var i=t[o][1][e];return n(i?i:e)},h,h.exports,e,t,i,s)}return i[o].exports}for(var l="function"==typeof require&&require,o=0;o<s.length;o++)n(s[o]);return n}({1:[function(e){var t=e("./state.js"),i=e("./util.js");i.isMobile||i.addClass(document.body,"no-touch");var s=document.getElementById("game"),n=new t;s.appendChild(n.element),n.runMainMenu()},{"./state.js":21,"./util.js":22}],2:[function(e,t){function i(e,t,i){this._targets=[],s.call(this,e,t,i)}var s=e("./hammer.js"),n=e("../util.js");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,i.prototype._addTarget=function(e,t){var i=this.field.getBlock(e,t);i&&(this._targets.push(i),n.addClass(i.element,"_targetAbility"))},i.prototype._removeTargets=function(){this._targets.forEach(function(e){n.removeClass(e.element,"_targetAbility")}),this._targets=[]},i.prototype._beforeRun=function(){var e=this._block,t=e.x,i=e.y;this._addTarget(t,i),this._addTarget(t,i+1),this._addTarget(t,i-1),this._addTarget(t-1,i),this._addTarget(t+1,i)},i.prototype._run=function(){this._targets.forEach(function(e){this.field.blockRemove(e.id)},this),this.field.checkPositions()},i.prototype._afterRun=function(){this._block&&this._removeTargets()},t.exports=i},{"../util.js":22,"./hammer.js":3}],3:[function(e,t){function i(e,t,i){this.name=e,this.abilities=i,this.field=i.game.field,this.count=t.count||0,this.element=null,this._block=null,this.isActive=!1,this._isMouseDown=!1,this._createElement(),this._bindEvents(),this.updateCount()}var s=e("../analytics.js"),n=e("../util.js");i.prototype._createElement=function(){var e=document.createElement("div");e.className="ability__"+this.name,e.innerHTML='<div class="ability__border"></div><div class="ability__count"></div>',this.countElement=e.getElementsByClassName("ability__count")[0],this.element=e},i.prototype._bindEvents=function(){var e=n.isMobile?"touchend":"click";n.on(this.element,e,this._onClickHandler.bind(this))},i.prototype._onClickHandler=function(){0!=this.count&&(this.isActive?this.abilities.stopAbility(this.name):this.abilities.runAbility(this.name))},i.prototype.updateCount=function(){this.countElement.innerHTML=this.count,0==this.count?n.addClass(this.element,"_no-count"):n.removeClass(this.element,"_no-count")},i.prototype.activate=function(){n.addClass(this.element,"_active");var e=n.isMobile?"touchstart":"mousedown",t=n.isMobile?"touchend":"mouseup",i=n.isMobile?"touchmove":"mousemove";this._fieldClickHandlerBind=this._fieldClickHandler.bind(this),this._fieldMouseDownHandlerBind=this._fieldMouseDownHandler.bind(this),this._bodyEndClickBind=this._bodyEndClick.bind(this),this._fieldMouseMoveHandlerBind=this._fieldMouseMoveHandler.bind(this),n.on(this.field.element,t,this._fieldClickHandlerBind),n.on(this.field.element,e,this._fieldMouseDownHandlerBind),n.on(document.body,t,this._bodyEndClickBind),n.on(this.field.element,i,this._fieldMouseMoveHandlerBind),this.isActive=!0},i.prototype.deactivate=function(){n.removeClass(this.element,"_active");var e=n.isMobile?"touchstart":"mousedown",t=n.isMobile?"touchend":"mouseup",i=n.isMobile?"touchmove":"mousemove";n.off(this.field.element,t,this._fieldClickHandlerBind),n.off(this.field.element,e,this._fieldMouseDownHandlerBind),n.off(document.body,t,this._bodyEndClickBind),n.off(this.field.element,i,this._fieldMouseMoveHandlerBind),this.isActive=!1},i.prototype._fieldMouseDownHandler=function(e){if(this._isMouseDown=!0,e.target&&"block__active"===e.target.className){var t=e.target.parentNode.getAttribute("data-id"),i=this.field.blocks[t];i&&(this._block=i,this._beforeRun())}},i.prototype._fieldClickHandler=function(){this._block&&(this._isMouseDown=!1,s.abilityUsed(this.name,this._block.value),this._run(),this.count--,this.updateCount(),this.abilities.game.saveState(),this.abilities.stopAbility(this.name))},i.prototype._bodyEndClick=function(){this._isMouseDown=!1,this._afterRun()},i.prototype._fieldMouseMoveHandler=function(e){var t,i,s,l;if(this._isMouseDown){if(n.isMobile){for(t=0;t<e.changedTouches.length;t++)if(s=e.changedTouches[t],i=document.elementFromPoint(s.clientX,s.clientY),i&&"block__active"===i.className){l=i.parentNode.getAttribute("data-id");break}}else{if(i=document.elementFromPoint(e.clientX,e.clientY),!i||"block__active"!==i.className)return;l=i.parentNode.getAttribute("data-id")}if(!l)return this._afterRun(),void(this._block=null);var o=this.field.blocks[l];o&&(this._afterRun(),this._block=o,this._beforeRun())}},i.prototype._beforeRun=function(){n.addClass(this._block.element,"_targetAbility")},i.prototype._run=function(){this.field.blockRemove(this._block.id),this.field.checkPositions()},i.prototype._afterRun=function(){this._block&&n.removeClass(this._block.element,"_targetAbility")},t.exports=i},{"../analytics.js":6,"../util.js":22}],4:[function(e,t){function i(e,t,i){this._targets=[],s.call(this,e,t,i)}var s=e("./hammer.js"),n=e("../util.js");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,i.prototype._beforeRun=function(){var e=this._block.value;n.forEach(this.field.blocks,function(t){t.value===e&&(this._targets.push(t),n.addClass(t.element,"_targetAbility"))},this)},i.prototype._run=function(){this._targets.forEach(function(e){this.field.blockRemove(e.id)},this),this.field.checkPositions()},i.prototype._afterRun=function(){this._block&&(this._targets.forEach(function(e){n.removeClass(e.element,"_targetAbility")}),this._targets=[])},t.exports=i},{"../util.js":22,"./hammer.js":3}],5:[function(e,t){t.exports={hammer:e("./abilities/hammer.js"),bomb:e("./abilities/bomb.js"),lightning:e("./abilities/lightning.js")}},{"./abilities/bomb.js":2,"./abilities/hammer.js":3,"./abilities/lightning.js":4}],6:[function(e,t){t.exports={goalAchived:function(e){ga("send","event","game","goal achived",String(e))},abilityUsed:function(e,t){ga("send","event","game","ability used",String(e),t)},levelStarted:function(e){ga("send","event","game","level started",String(e))},levelResumed:function(e){ga("send","event","game","level resume",String(e))},levelRestart:function(e){ga("send","event","game","level restart",String(e))}}},{}],7:[function(e,t){function i(e,t){t=t||{},this.game=e,this.config=e.store,this.element=null,this.isEnable=!1,this._lastUpAbilityScore=0,this._abilities={},this.currentAbility=null,this._initElements(),this._restoreData(t)}var s=e("../abilityModules.js"),n=e("../util.js");i.prototype._initElements=function(){var e=document.createElement("div");e.className="abilities",this.config.ability&&(n.forEach(this.config.ability,function(t,i){var n=new s[i](i,t,this);this._abilities[i]=n,e.appendChild(n.element)},this),this.isEnable=!0),this.element=e},i.prototype._restoreData=function(e){e&&(e.list&&n.forEach(e.list,function(e,t){this._abilities[t].count=e.count||0,this._abilities[t].updateCount()},this),this._lastUpAbilityScore=e.lastUpAbilityScore||0)},i.prototype.checkUp=function(){if(this.isEnable&&!(this.game.score-this._lastUpAbilityScore<this.config.abilityPerScore)){var e,t,i=Math.floor((this.game.score-this._lastUpAbilityScore)/this.config.abilityPerScore),s=[];n.forEach(this.config.ability,function(e,t){s.push([t,e.ratio||1])});for(var l=0;i>l;l++)e=n.random(s),e&&(t=this._abilities[e],t.count++,t.updateCount());this._lastUpAbilityScore=this.game.score,this.game.saveState()}},i.prototype.runAbility=function(e){this.currentAbility&&this._abilities[this.currentAbility].deactivate(),this._abilities[e].activate(),this.currentAbility=e},i.prototype.stopAbility=function(e){this.currentAbility==e&&(this._abilities[e].deactivate(),this.currentAbility=null)},i.prototype.getState=function(){var e={};return e.list={},n.forEach(this._abilities,function(t,i){e.list[i]={count:t.count}}),e.lastUpAbilityScore=this._lastUpAbilityScore,e},t.exports=i},{"../abilityModules.js":5,"../util.js":22}],8:[function(e,t){function i(e,t,i){this.id=++a,this.field=i,this.config=i.config,this.game=i.game,this.x=e,this.y=t,this.value=null,this.element=null,this.fieldHeight=s.field.height,this.width=s.field.width/this.config.field.size[0],this.height=s.field.height/this.config.field.size[1],this.widthText=null,this._setRandomValue(),this._createElement(),this._bindEvents()}var s=e("../gameConfig.js"),n=e("./colors.js"),l=e("../util.js"),o=[1,2,3,5,7,11,13],a=0,r={};i.prototype._createElement=function(){var e=document.createElement("div");e.className="block",e.style.transform="translate3d("+Math.floor(this.x*this.width)+"px,"+Math.floor(this.fieldHeight-(this.y+1)*this.height)+"px,0)",e.setAttribute("data-id",this.id);var t=document.createElement("div");t.className="block__inner",e.appendChild(t);var i=document.createElement("div");i.className="block__innerBorder",t.appendChild(i);var s=document.createElement("div");s.className="block__innerText",s.innerHTML=this.value,t.appendChild(s);var n=document.createElement("div");n.className="block__active",e.appendChild(n),this.innerElement=t,this.textElement=s,this.activeElement=n,this.element=e,this._updateColors()},i.prototype._setRandomValue=function(){this.value=l.random(this.config.numbers.possibleValues)},i.prototype._bindEvents=function(){l.isMobile?l.on(this.element,"touchstart",this._mouseDownHandler.bind(this)):(l.on(this.element,"mousedown",this._mouseDownHandler.bind(this)),l.on(this.activeElement,"mouseover",this._mouseOverHandler.bind(this)))},i.prototype._mouseDownHandler=function(e){e.preventDefault(),this.game.abilities.currentAbility||this.field.blockMouseDown(this.id)},i.prototype._mouseOverHandler=function(){this.field.blockMouseOver(this.id)},i.prototype._mouseOutHandler=function(){this.field.blockMouseOut(this.id)},i.prototype.changePosition=function(e,t){this.x=e,this.y=t,this.element.style.transform="translate3d("+Math.floor(this.x*this.width)+"px,"+Math.floor(this.fieldHeight-(this.y+1)*this.height)+"px,0)"},i.prototype._updateColors=function(){if(!r[this.value]){var e,t=[];for(e=o.length-1;e>0;e--)this.value%o[e]===0&&t.push({value:o[e],rgb:n[e].rgb,ratio:this.value/o[e]});var i;i=t.length?l.rgbSum(t):n[0].rgb,r[this.value]="rgb("+i.join(",")+")"}this.innerElement.style.backgroundColor=r[this.value]},i.prototype.changeValue=function(e){this.value=e,this.textElement.innerHTML=e;var t=this.value.toString().length;t>=5&&10>=t&&this.widthText!==t&&(this.widthText&&l.removeClass(this.element,"_len_"+t),l.addClass(this.element,"_len_"+t)),this._updateColors()},i.prototype.select=function(){l.addClass(this.element,"_selected")},i.prototype.unselect=function(){l.removeClass(this.element,"_selected")},i.prototype.animateCreate=function(){var e=this;l.addClass(this.element,"_blink"),setTimeout(function(){l.removeClass(e.element,"_blink")},15)},t.exports=i},{"../gameConfig.js":12,"../util.js":22,"./colors.js":9}],9:[function(e,t){t.exports=[{web:"#99b433",rgb:[154,180,51]},{web:"#DA532C",rgb:[218,83,44]},{web:"#1e7145",rgb:[30,113,69]},{web:"#2C89A0",rgb:[44,137,160]},{web:"#00AA88",rgb:[0,170,136]},{web:"#00d455",rgb:[0,212,85]},{web:"#ff2a2a",rgb:[255,42,42]},{web:"#CB5000",rgb:[203,80,0]}]},{}],10:[function(e,t){function i(e,t){t=t||{},this.game=e,this.config=e.store,this.blocks={},this._blocksXY={},this.size=this.config.field.size,this.selectedBlocks=[],this.selectedMode=!1,this.element=null,this._init(),this._createElement(),this._bindEvents(),this._restoreData(t)}var s=e("./block.js"),n=e("../util"),l=e("../gameConfig");i.prototype._init=function(){for(var e=0;e<this.size[0];e++){this._blocksXY[e]={};for(var t=0;t<this.size[1];t++)this.createBlock(e,t,!0)}},i.prototype._restoreData=function(e){if(e.blocks)for(var t=0;t<this.size[0];t++)for(var i=0;i<this.size[1];i++)this.blocks[this._blocksXY[t][i]].changeValue(e.blocks[t][i].value)},i.prototype.createBlock=function(e,t,i){var n=new s(e,t,this);this.blocks[n.id]=n,this._blocksXY[e][t]=n.id,i||(this.element.appendChild(n.element),n.animateCreate())},i.prototype._createElement=function(){var e=document.createDocumentFragment();this.canvas=document.createElement("canvas"),this.canvas.className="field__canvas",this.ctx=this.canvas.getContext("2d"),this.canvas.width=l.field.width,this.canvas.height=l.field.height,e.appendChild(this.canvas),n.forEach(this.blocks,function(t){e.appendChild(t.element)}),this.element=document.createElement("div"),this.element.className="field _width_"+this.size[0]+" _height_"+this.size[1],this.element.appendChild(e)},i.prototype._bindEvents=function(){n.isMobile?(n.on(document.body,"touchend",this._mouseUpHandler.bind(this)),n.on(document.body,"touchmove",this._touchMoveHandler.bind(this))):n.on(document.body,"mouseup",this._mouseUpHandler.bind(this))},i.prototype._touchMoveHandler=function(e){var t,i,s,n,l,o,a,r=this.blocks;for(o=0;o<e.changedTouches.length;o++)if(n=e.changedTouches[o],l=document.elementFromPoint(n.clientX,n.clientY),l&&-1!=l.className.indexOf("block__active")){for(s=Object.keys(r),a=0;a<s.length;a++)if(i=r[s[a]],i.activeElement===l){this.blockMouseOver(i.id),t=!0;break}if(t)break}},i.prototype._mouseUpHandler=function(){this.selectedMode&&(this.selectedMode=!1,this._runSelected(),n.forEach(this.blocks,function(e){e.unselect()}),this.game.updateChainSum(),this._clearPath())},i.prototype.blockMouseDown=function(e){this.selectedMode=!0,this.selectedBlocks=[e],this.blocks[e].select(),this.game.updateChainSum()},i.prototype._checkWithLast=function(e){var t=this.blocks[this.selectedBlocks[this.selectedBlocks.length-1]],i=this.blocks[e];return t.value==i.value&&Math.abs(t.x-i.x)<=1&&Math.abs(t.y-i.y)<=1},i.prototype.blockMouseOver=function(e){if(this.selectedMode){var t=this.selectedBlocks;if(-1==t.indexOf(e))this._checkWithLast(e)&&(t.push(e),this.blocks[e].select(),this.game.updateChainSum(),this._updatePath());else if(t[t.length-2]==e){var i=t.pop();this.blocks[i].unselect(),this.game.updateChainSum(),this._updatePath()}}},i.prototype._updatePath=function(){var e=this.ctx,t=l.field.height;this._clearPath(),e.beginPath(),e.strokeStyle=l.path.color,e.lineWidth=l.path.width,this.selectedBlocks.forEach(function(i,s){var n=this.blocks[i],l=(n.x+.5)*n.width,o=t-(n.y+.5)*n.height;0===s?e.moveTo(l,o):e.lineTo(l,o)},this),e.stroke()},i.prototype._clearPath=function(){this.ctx.clearRect(0,0,l.field.width,l.field.height)},i.prototype.blockMouseOut=function(){},i.prototype.blockRemove=function(e){var t=this.blocks[e];this.element.removeChild(t.element),this._blocksXY[t.x][t.y]=null,delete this.blocks[e]},i.prototype._runSelected=function(){if(!(this.selectedBlocks.length<this.config.chain.minLength)){this.game.updateScore();var e=this.selectedBlocks.pop(),t=this.blocks[e],i=t.value*(this.selectedBlocks.length+1);t.changeValue(i),this.selectedBlocks.forEach(this.blockRemove,this),this.checkPositions(),this.game.saveState()}},i.prototype.checkPositions=function(){var e=this,t=this._blocksXY,i=this.blocks;n.forEach(t,function(t){var s=[];n.forEach(t,function(e){e&&s.push(e)}),s.length!=e.size[1]&&s&&(s.sort(function(e,t){return i[e].y>i[t].y}),s.forEach(function(e,s){var n=i[e];n.y!=s&&(t[n.y]=null,n.changePosition(n.x,s),t[s]=e)}))}),this._addNewBlocks()},i.prototype._addNewBlocks=function(){for(var e=this._blocksXY,t=0;t<this.size[0];t++)for(var i=0;i<this.size[1];i++)e[t][i]||this.createBlock(t,i)},i.prototype.getState=function(){for(var e={blocks:{}},t=0;t<this.size[0];t++){e.blocks[t]={};for(var i=0;i<this.size[1];i++)e.blocks[t][i]={value:this.blocks[this._blocksXY[t][i]].value}}return e},i.prototype.getBlock=function(e,t){var i=this._blocksXY[e];if(!i)return null;var s=i[t];return s?this.blocks[s]:null},t.exports=i},{"../gameConfig":12,"../util":22,"./block.js":8}],11:[function(e,t){function i(e,t,i){i=i||{},this.name=e,this.state=t,this.store=s.get(e),this.score=i.score||0,this.field=new o(this,i.field),this.abilities=new n(this,i.abilities),this._createElement(),this._bindEvents()}var s=e("../levelStore.js"),n=e("./abilities.js"),l=e("../analytics.js"),o=e("./field.js"),a=e("../util");i.prototype._createElement=function(){var e=document.createElement("div");e.className="game";var t='<div class="game__header"><div class="game__levelName">Level: {{name}}</div><div class="game__score">{{score}}</div><div class="game__chainSum"></div><div class="game__maxScore">Max score: {{maxScore}}</div><div class="game__goal">{{goal}}</div></div><div class="game__body"><div class="game__win"><div class="game__winInner"><div class="game__winText">Congratulations!<br />You achived first goal of this level. Return and get more scores or start the&nbsp;next level?</div><div class="game__winButtons"><div class="game__winReturn">Return</div><div class="game__winNext">Next</div></div></div></div><div class="game__field"></div></div><div class="game__footer"><div class="game__abilities"></div><div class="game__buttons"><div class="game__backButton">Menu</div><div class="game__restartButton">Restart</div><div class="game__nextButton">Next</div></div></div>';e.innerHTML=t.replace("{{score}}",this.score).replace("{{goal}}",this._getGoalText()).replace("{{name}}",this.name).replace("{{maxScore}}",this.store.maxScore),this.store.currentGoal>0&&a.addClass(e,"_win"),this.backButton=e.getElementsByClassName("game__backButton")[0],this.restartButton=e.getElementsByClassName("game__restartButton")[0],this.nextButton=e.getElementsByClassName("game__nextButton")[0],this.abilitiesElement=e.getElementsByClassName("game__abilities")[0],this.abilitiesElement.appendChild(this.abilities.element),this.goalElement=e.getElementsByClassName("game__goal")[0],this.scoreElement=e.getElementsByClassName("game__score")[0],this.chainSumElement=e.getElementsByClassName("game__chainSum")[0],this.maxScoreElement=e.getElementsByClassName("game__maxScore")[0],this.winReturnButton=e.getElementsByClassName("game__winReturn")[0],this.winNextButton=e.getElementsByClassName("game__winNext")[0],this.fieldElement=e.getElementsByClassName("game__field")[0],this.fieldElement.appendChild(this.field.element),this.element=e},i.prototype._bindEvents=function(){a.on(this.restartButton,"click",this.restart.bind(this)),a.on(this.backButton,"click",this._backToMenu.bind(this)),a.on(this.nextButton,"click",this._nextLevel.bind(this)),a.on(this.winReturnButton,"click",this._hideWinField.bind(this)),a.on(this.winNextButton,"click",this._nextLevel.bind(this))},i.prototype._getGoalText=function(){return this.store.currentGoal<=3?this.store.goals[this.store.currentGoal]:""},i.prototype._nextLevel=function(){this.state.runLevelMenu(),this._hideWinField()},i.prototype.restart=function(){this.score=0,this.scoreElement.innerHTML=0;var e=new o(this);this.fieldElement.replaceChild(e.element,this.field.element),this.field=e;var t=new n(this);this.abilitiesElement.replaceChild(t.element,this.abilities.element),this.abilities=t,this.saveState(),l.levelRestart(this.name)},i.prototype._backToMenu=function(){this.state.backFromLevel()},i.prototype.updateChainSum=function(){if(!this.field.selectedMode)return void a.removeClass(this.chainSumElement,"_showed");var e=this.field,t=e.blocks[e.selectedBlocks[0]].value||0;this.chainSumElement.innerHTML=t*e.selectedBlocks.length,a.addClass(this.chainSumElement,"_showed")},i.prototype.updateScore=function(){var e=this.field,t=e.blocks[e.selectedBlocks[0]].value||0,i=1+.2*(e.selectedBlocks.length-3);this.score+=Math.round(t*e.selectedBlocks.length*i),this.scoreElement.innerHTML=this.score,this.store.maxScore<this.score&&(this.store.maxScore=this.score,this.maxScoreElement.innerHTML="Max score: "+this.score),this._checkGoal(),this.abilities.checkUp(),s.saveLevels()},i.prototype._checkGoal=function(){if(3!=this.store.currentGoal){var e=this.store;this.score>=e.winConditions[e.currentGoal]&&(e.currentGoal=Math.min(e.currentGoal+1,3),1==e.currentGoal&&this._win(),this.goalElement.innerHTML=this._getGoalText(),l.goalAchived(e.currentGoal))}},i.prototype._win=function(){a.addClass(this.element,"_win"),s.checkOpenLevels(),this._showWinField()},i.prototype.getState=function(){return{field:this.field.getState(),abilities:this.abilities.getState(),name:this.name,score:this.score}},i.prototype.saveState=function(){this.state.saveActiveLevel()},i.prototype._showWinField=function(){a.addClass(this.element,"_showWinField")},i.prototype._hideWinField=function(){a.removeClass(this.element,"_showWinField")},t.exports=i},{"../analytics.js":6,"../levelStore.js":16,"../util":22,"./abilities.js":7,"./field.js":10}],12:[function(e,t){t.exports={field:{width:500,height:500},path:{color:"rgba(255, 255, 255, 0.25)",width:10},progressBar:{width:490},levels:[1,2,3,4,5,6],minOpenLevels:5}},{}],13:[function(e,t){t.exports={1:{field:{size:[4,4]},numbers:{possibleValues:[[1,1],[2,1]]},chain:{minLength:3},winConditions:[1e3,3e3,6e3],goals:["Goal: 1000","Next goal: 3000","Last goal: 6000","Achieved!"],ability:{hammer:{count:1}},abilityPerScore:1e3},2:{field:{size:[5,5]},numbers:{possibleValues:[[1,1],[2,1],[3,1]]},chain:{minLength:3},winConditions:[1e4,25e3,5e4],goals:["Goal: 10000","Next goal: 25000","Last goal: 50000","Achieved!"],ability:{hammer:{count:1}},abilityPerScore:5e3},3:{field:{size:[4,4]},numbers:{possibleValues:[[3,1],[5,1],[7,1]]},chain:{minLength:3},winConditions:[500,1250,2500],goals:["Goal: 500","Next goal: 1250","Last goal: 2500","Achieved!"],ability:{hammer:{count:1}},abilityPerScore:250},4:{field:{size:[5,5]},numbers:{possibleValues:[[1,32],[3,32],[5,32],[135,4]]},chain:{minLength:3},winConditions:[8e3,32e3,15e4],goals:["Goal: 80000","Next goal: 32000","Last goal: 150000","Achieved!"],ability:{hammer:{count:1}},abilityPerScore:1e3},5:{field:{size:[5,5]},numbers:{possibleValues:[[1,1],[2,1],[3,1],[5,1]]},chain:{minLength:3},winConditions:[50,100,150],goals:["Goal: 50","Next goal: 100","Last goal: 150","Achieved!"],ability:{hammer:{count:2,ratio:5},bomb:{count:1,ratio:1},lightning:{count:1,ratio:1}},abilityPerScore:20},6:{field:{size:[4,4]},numbers:{possibleValues:[[3,1],[5,1],[7,1],[105,1],[135,1]]},chain:{minLength:3},winConditions:[50,100,150],goals:["Goal: 50","Next goal: 100","Last goal: 150","Achieved!"],ability:{hammer:{count:3,ratio:5},bomb:{count:1,ratio:3},lightning:{count:1,ratio:3}},abilityPerScore:200}}},{}],14:[function(e,t){function i(e,t,i){this.levelMenu=e,this.name=t,this.store=l.get(this.name),this.element=document.createElement("div"),this.element.className="levelMenu__levelBlock _level_"+i%2;var s='<div class="levelMenu__levelBlockGoalState"></div><div class="levelMenu__levelBlockText">{{name}}</div>';this.element.innerHTML=s.replace("{{name}}",t),this.goal=null,this.isOpen=!1,o.on(this.element,"click",this._onClick.bind(this))}function s(e){this.state=e,this.levels={},this._createElement(),this._bindEvents(),this._updateProgress()}var n=e("../gameConfig.js"),l=e("../levelStore.js"),o=e("../util.js");i.prototype._onClick=function(){this.levelMenu.runLevel(this.name)},i.prototype.update=function(){var e=this.store.currentGoal;this.goal!==e&&(o.removeClass(this.element,"_goal_"+this.goal),o.addClass(this.element,"_goal_"+e),this.goal=e);var t=this.store.isOpen;this.isOpen!==t&&o.addClass(this.element,"_open")},s.prototype._createElement=function(){var e=document.createElement("div");e.className="levelMenu",e.innerHTML='<div class="levelMenu__header"><div class="levelMenu__headerLevels">Levels:</div></div><div class="levelMenu__body"><div class="levelMenu__progress"><div class="levelMenu__progressBar"></div><div class="levelMenu__progressText"></div></div><div class="levelMenu__levelList"></div></div><div class="levelMenu__footer"><div class="levelMenu__backButton">Back</div></div>';var t=e.getElementsByClassName("levelMenu__levelList")[0],s=document.createDocumentFragment();n.levels.forEach(function(e,t){var n=new i(this,e,t);this.levels[e]=n,s.appendChild(n.element)},this),t.appendChild(s),this.backButton=e.getElementsByClassName("levelMenu__backButton")[0],this.progressBarElement=e.getElementsByClassName("levelMenu__progressBar")[0],this.progressTextElement=e.getElementsByClassName("levelMenu__progressText")[0],this.element=e},s.prototype._bindEvents=function(){o.on(this.backButton,"click",function(){this.state.runMainMenu()}.bind(this))},s.prototype.update=function(){o.forEach(this.levels,function(e){e.update()},this),this._updateProgress()},s.prototype.runLevel=function(e){l.get(e).isOpen&&this.state.runLevel(e)},s.prototype._updateProgress=function(){var e=Object.keys(this.levels).length,t=3,i=0;o.forEach(this.levels,function(e){i+=e.store.currentGoal});var s=i/(e*t);this.progressBarElement.style.width=Math.floor(s*n.progressBar.width)+"px",this.progressTextElement.innerHTML=Math.floor(100*s)+"%"},t.exports=s},{"../gameConfig.js":12,"../levelStore.js":16,"../util.js":22}],15:[function(e,t){t.exports={1:e("./levels/1"),2:e("./levels/2"),3:e("./levels/2"),4:e("./levels/2"),5:e("./levels/2"),6:e("./levels/2")}},{"./levels/1":17,"./levels/2":18}],16:[function(e,t){function i(){var e=l.getLevels();n.levels.forEach(function(t){var i=s[t];i.name=t,e[t]=e[t]||{},i.currentGoal=e[t].currentGoal||0,i.maxScore=e[t].maxScore||0,r[t]=i}),a.checkOpenLevels()}var s=e("./levelConfig.js"),n=e("./gameConfig.js"),l=e("./saves.js"),o=e("./util.js"),a={},r={};a.get=function(e){return r[e]},a.checkOpenLevels=function(){var e=0;n.levels.forEach(function(t,i){var s=r[t];s.currentGoal>0&&e++,s.isOpen=i<e+n.minOpenLevels})},a.saveLevels=function(){var e={};o.forEach(r,function(t,i){e[i]={maxScore:t.maxScore,currentGoal:t.currentGoal}}),l.setLevels(e)},i(),t.exports=a},{"./gameConfig.js":12,"./levelConfig.js":13,"./saves.js":20,"./util.js":22}],17:[function(e,t){function i(e,t,i){s.call(this,e,t,i)}var s=e("../game/game.js");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,t.exports=i},{"../game/game.js":11}],18:[function(e,t){var i=e("../game/game.js");t.exports=i},{"../game/game.js":11}],19:[function(e,t){function i(e){this.state=e,this._isResumeActive=!1,this._createElement(),this._bindEvents()}var s=e("../util.js");i.prototype._createElement=function(){var e=document.createElement("div");e.className="mainMenu",e.innerHTML='<div class="mainMenu__header"><div class="mainMenu__title">Chainumber</div></div><div class="mainMenu__body"><div class="mainMenu__newGame">New game</div><div class="mainMenu__resumeGame">Resume game</div></div><div class="mainMenu__footer"><div class="mainMenu__version">v0.0.1</div></div>',this.element=e,this.newGameButton=e.getElementsByClassName("mainMenu__newGame")[0],this.resumeGameButton=e.getElementsByClassName("mainMenu__resumeGame")[0]},i.prototype._bindEvents=function(){s.on(this.newGameButton,"click",function(){this.state.runLevelMenu()}.bind(this)),s.on(this.resumeGameButton,"click",function(){this.state.resumeLevel()}.bind(this))},i.prototype.resumeLevelActive=function(){this._isResumeActive||(this._isResumeActive=!0,s.addClass(this.element,"_activeLevel"))},t.exports=i},{"../util.js":22}],20:[function(e,t){function i(e){var t,i=localStorage.getItem(e);if(i)try{t=JSON.parse(i)}catch(s){t={}}else t={};return t}function s(e,t){localStorage.setItem(e,JSON.stringify(t))}var n={};n.getLevels=function(){return i("levels")},n.setLevels=function(e){s("levels",e)},n.setActiveLevel=function(e){s("activeLevel",e)},n.getActiveLevel=function(){return i("activeLevel")},n.setAbilities=function(e){s("abilities",e)},n.getAbilities=function(){return i("abilities")},t.exports=n},{}],21:[function(e,t){function i(){this._activeElement=null,this._activeLevel=null,this.levelMenu=new s(this),this.mainMenu=new n(this),this._createElement(),this._checkActiveLevel()}var s=e("./levelMenu/levelMenu"),n=e("./mainMenu/mainMenu"),l=e("./levelModules"),o=e("./analytics.js"),a=e("./saves"),r=e("./util");i.prototype._checkActiveLevel=function(){var e=a.getActiveLevel();Object.keys(e).length&&(this._activeLevel=new l[e.name](e.name,this,e),this.activeLevelElement.appendChild(this._activeLevel.element),this.mainMenu.resumeLevelActive())},i.prototype._createElement=function(){this.element=document.createElement("div"),this.element.className="state",this.element.innerHTML='<div class="state__mainMenu"></div><div class="state__levelMenu"></div><div class="state__activeLevel"></div>',this.mainMenuElement=this.element.getElementsByClassName("state__mainMenu")[0],this.mainMenuElement.appendChild(this.mainMenu.element),this.levelMenuElement=this.element.getElementsByClassName("state__levelMenu")[0],this.levelMenuElement.appendChild(this.levelMenu.element),this.activeLevelElement=this.element.getElementsByClassName("state__activeLevel")[0]},i.prototype.saveActiveLevel=function(){this._activeLevel&&a.setActiveLevel(this._activeLevel.getState())},i.prototype._activate=function(e){this._activeElement!==e&&(this._activeElement&&r.removeClass(this._activeElement,"_showed"),r.addClass(e,"_showed"),this._activeElement=e)},i.prototype.runLevelMenu=function(){this.levelMenu.update(),this._activate(this.levelMenuElement)},i.prototype.runMainMenu=function(){this._activate(this.mainMenuElement)},i.prototype.runLevel=function(e){if(this._activeLevel&&this._activeLevel.name==e)return this.resumeLevel();this.mainMenu.resumeLevelActive();var t=new l[e](e,this);this._activeLevel?this.activeLevelElement.replaceChild(t.element,this._activeLevel.element):this.activeLevelElement.appendChild(t.element),this._activeLevel=t,this._activate(this.activeLevelElement),o.levelStarted(this._activeLevel.name)},i.prototype.backFromLevel=function(){this.runMainMenu()},i.prototype.resumeLevel=function(){this._activeLevel&&(this._activate(this.activeLevelElement),o.levelResumed(this._activeLevel.name))},t.exports=i},{"./analytics.js":6,"./levelMenu/levelMenu":14,"./levelModules":15,"./mainMenu/mainMenu":19,"./saves":20,"./util":22}],22:[function(e,t){var i={};i.addClass=function(e,t){var i=e.className.split(" "),s=i.indexOf(t);return-1===s&&(i.push(t),e.className=i.join(" ")),e},i.removeClass=function(e,t){var i=e.className.split(" "),s=i.indexOf(t);return-1!==s&&(i.splice(s,1),e.className=i.join(" ")),e},i.hasClass=function(e,t){var i=e.className.split(" ");return-1!=i.indexOf(t)},i.forEach=function(e,t,i){e.length?e.forEach(t,i):Object.keys(e).forEach(function(s){t.call(i,e[s],s)})},i.on=function(e,t,i,s){e.addEventListener(t,i,s)},i.off=function(e,t,i,s){e.removeEventListener(t,i,s)};var s="DeviceOrientationEvent"in window||"orientation"in window;/Windows NT|Macintosh|Mac OS X|Linux/i.test(navigator.userAgent)&&(s=!1),/Mobile/i.test(navigator.userAgent)&&(s=!0),i.isMobile=s,i.rgbSum=function(e){var t,i,s,n=[0,0,0],l=0;for(i=0;i<e.length;i++){for(t=e[i],s=0;3>s;s++)n[s]+=t.rgb[s]*t.ratio;l+=t.ratio}for(s=0;3>s;s++)n[s]=Math.floor(n[s]/l);return n},i.nullFn=function(){},i.random=function(e){var t=0;e.forEach(function(e){t+=e[1]});for(var i=0,s=e.map(function(e){var s=e[1]/t+i;return i=s,s}),n=Math.random(),l=0,o=0;o<s.length;o++)if(n<=s[o]){l=e[o][0];break}return l},t.exports=i},{}]},{},[1]);