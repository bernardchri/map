'use strict';

/*
Utilisation de GSAP et des plugins GSAP : 
draggable : gratuit (drag and drop)
throwPropsPLugin : payant (effet de décélaration)
*/

// console.log('chargement - CB script');

const map = {
	content: '#map__content',
	container: '#map',

	init: function() {
		Draggable.create('#map__content', {
			type: 'x,y',
			edgeResistance: 0.2,
			dragResistance: 0.2,
			bounds: this.container,
			throwProps: true,
			onPress: map.onPress,
			onRelease: map.onRelease
		});
	},

	onPress: function(e) {
		//console.log("endX: " + this.endX + " - endY : "+ this.endY);
		let tl = new TimelineLite();
		let transOri;

		//endX et endY /position transform/ sont définis à la fin du drag
		if (this.endX === undefined || this.endY === undefined || this.endX > 0 || this.endX > 0) {
			transOri = Math.round(e.pageX) + 'px ' + Math.round(e.pageY) + 'px ';
		} else {
			transOri = Math.round(-this.endX + e.pageX) + 'px ' + Math.round(-this.endY + e.pageY) + 'px ';
		}
		tl.to(this.target, 0.25, { ease: Power1.easeOut, transformOrigin: transOri, scale: 0.8 });
	},

	onRelease: function(e) {
		let tl = new TimelineLite();
		tl.to(this.target, 0.3, { scale: 1 });
	}
};

map.init();
