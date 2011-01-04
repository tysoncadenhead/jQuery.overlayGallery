/*global jQuery, setTimeout, window, setInterval */

/*
 * @tag jQuery.overlayGallery
 * 
 * AUTHORS:
 * Development - Tyson Cadenhead /  tysonlloydcadenheadDotCom / tysoncadenheadAtGmailDotCom
 * Conceptual / Prototype - Andy Matthews / amatthewsDotNet
 * 
 * TESTING:
 * JSLint - Passed
 * 
 * JQuery Overlay Gallery
 * @function jQuery.overlayGallery Creates an image gallery
 */
jQuery.fn.overlayGallery = function(config){
	
	var overlayGallery = this;
	var options = {};
	var interval;
	
	// In case we need to access the config later on
	this.config = config;
	
	/*
	 * @function addControls
	 * @description Adds the controls for next, previous, play, pause and toggle thumbs
	 */
	this.addControls = function(){
		
		// The Controller div
		overlayGallery.append('<div/>').find(':last').attr({
			'id': 'og-controls'
		})
		
		// Play and Pause buttons
		.append('<div />').children(':last').attr({
			'id': 'og-playPause',
			'class': 'og-play og-sprites'
		}).bind({
			click: overlayGallery.playPause
		})
		
		// X of Y Listings
		.parent().append('<div />').children(':last').attr({
			'class': 'og-xofy'
		})
		
		// The Previous button
		.parent().append('<div />').children(':last').attr({
			'class': 'og-previous og-sprites'
		}).bind({
			click: function(){
				if (!overlayGallery.getValue('thumbs-are-toggled')){
					overlayGallery.previousSlide(true);
				}
				else {
					overlayGallery.previousPage(true);
				}
			}
		})
		
		// The "Toggle Thumbs" button
		.parent().append('<div />').children(':last').attr({
			'class': 'og-toggle-thumbs og-sprites'
		}).bind({
			click: overlayGallery.toggleThumbs
		})
		
		// The Next button
		.parent().append('<div />').children(':last').attr({
			'class': 'og-next og-sprites'
		}).bind({
			click: function(){
				if (!overlayGallery.getValue('thumbs-are-toggled')){
					overlayGallery.nextSlide(true);
				}
				else {
					overlayGallery.nextPage(true);
				}
			}
		});
		
	};
	
	/*
	 * @function animateTo
	 * @description Animates to the new current slide
	 * @param index The new current slide index
	 * @param transition The transition to animate with
	 */
	this.animateTo = function(index){
				
		// Slide
		if (overlayGallery.getValue('transition-type') == 'slide') {
		
		
			jQuery('#og-slides').css({
				width: ((overlayGallery.getValue('slide-count') + 1) * overlayGallery.width())
			});
			jQuery('#og-slides img').each(function(){
				jQuery(this).css({
					'opacity': 1,
					'position': 'relative',
					'float': 'left'
				});
			});
			jQuery('#og-slides').animate({
				left: -(overlayGallery.getCurrentSlide() * overlayGallery.width())
			}, overlayGallery.getValue('transition-timeout'));
		}
	
		// Fade
		else {
			
			jQuery('.current img').animate({
					'opacity' : 0
				}, overlayGallery.getValue('transition-timeout'));
				jQuery('#slide-medium-' + index + ' img').animate({
					'opacity' : 1
				}, overlayGallery.getValue('transition-timeout'));
		}			
	};
	
	/*
	 * @function animateToPage
	 * @description Does an animation to switch pages
	 */
	this.animateToPage = function(){
		
		// Slide
		jQuery('#og-thumbs').animate({
			left: - (overlayGallery.getValue('current-page')* overlayGallery.width())
		}, overlayGallery.getValue('transition-timeout'));
		
	};
	
	/*
	 * @function createSlides
	 * @description Creates all of the medium sized slides
	 * @param slides An array of the slides to create
	 */
	this.createSlides = function(slides){
		
		// These functions will be used in the loop --- it's bad to create functions inside of a loop!
		var fn = {
			click: function(){
				return overlayGallery.getValue('slide-click')(this, overlayGallery);
			},
			hoverOn: function(el){
				jQuery('#slide-medium-' + overlayGallery.getCurrentSlide()).append('<div class="og-zoom-mask" />');
			},
			hoverOff: function(){
				jQuery('.og-zoom-mask').remove();
			},
			load: function(){
				overlayGallery.doLayout(jQuery(this).height(), jQuery(this).width());
			},
			error: function(){
				jQuery(this).attr('src', overlayGallery.getValue('not-found-image'));
			}
		};
		
		// This is only used for printing purposes
		overlayGallery.append('<img id="og-print-image" src="' + slides[0].medium + '" />');
		
		// Create a holder for the slides
		overlayGallery.append('<div id="og-slides" />');
		
		// Loop through all of the images and add them to the DOM
		for (var i = 0; i < slides.length; i++){
			
			// DOM Manipulation (Appends the slides to the slides container)
			overlayGallery.find('#og-slides')
				.append('<a />').children(':last').attr({
					'href': slides[i].large,
					'title': slides[i].title,
					'id': 'slide-medium-' + i
				}).bind({
					click: fn.click
				}).hover(fn.hoverOn, fn.hoverOff)
				.append('<img />').children(':last').attr({
					'src': slides[i].medium,
					'alt': slides[i].title
				}).bind({
					load: fn.load,
					error: fn.error
				});
				
			if (overlayGallery.getValue('resize-images')){
				jQuery('#slide-medium-' + i + ' img').css({
					width: overlayGallery.width()
				});
			}
		}
		
	};
	
	/*
	 * @function createThumbs
	 * @description Generates the thumbnails
	 * @param slides An array of the slides
	 */
	this.createThumbs = function(slides){
		
		var fn = {
			click: function(){
				overlayGallery.setCurrentSlide(jQuery(this).attr('index'));
				overlayGallery.toggleThumbs();
			},
			error: function(){
				jQuery(this).attr('src', overlayGallery.getValue('not-found-thumb'));
			}
		};
		
		// Add the divs to hold the thumbs and the mask to go behind them
		overlayGallery.prepend('<div class="hidden" id="og-thumbs-overlay" />');
		overlayGallery.prepend('<div class="hidden" id="og-thumbs" />');
		
		// Loop over the slides
		for (var i = 0; i < slides.length; i++){
			
			// If the index is divisible by the number of thumbnails to show per page, make a new container to put them in
			if (i === 0 || (i % overlayGallery.getValue('thumbs-per-page') === 0)){
				overlayGallery.find('#og-thumbs').append('<div class="og-slides-container" />');
			}
			
			// DOM Manipulation (append the thumbnail to the most recently added container)
			jQuery('#og-thumbs').children(':last').append('<img />').children(':last').attr({
				'src': slides[i].small,
				'alt': slides[i].title,
				'index': i,
				'id': 'slide-small-' + i
			}).bind({
				click: fn.click,
				error: fn.error
			});
			
		}
	};
	
	/*
	 * @function doLayout
	 * @description Resets the height and width of the layout
	 * @param height
	 * @param width
	 */
	this.doLayout = function(height, width){
		if (overlayGallery.getValue('slide-count') !== 0){
			height = height + 30;	
		}
		overlayGallery.css({
			'height': height,
			'width': width
		});
		jQuery('#og-slides').css('height', height);
	};
	
	/*
	 * @function ieFixes
	 * @description This resolves some issues cause by IE's slow rendering agent.  My hope is to be able to find a way to take this out at some point, but until then... it is what it is
	 */
	this.ieFixes = function(){
		
		var IE = this;
						
		this.testImage = function(img){
			if (!img.complete) {
				IE.loopThroughImages();
		    }
			else if (typeof img.naturalWidth != 'undefined' && img.naturalWidth === 0) {
		        return false;
		    }
			else {
				return true;
			}
		};
		
		this.loopThroughImages = function(){
			setTimeout(function(){
				jQuery('#og-slides img').each(function(){
					if(!IE.testImage(this)){
						jQuery(this).attr('src', overlayGallery.getValue('not-found-image'));
					}
					overlayGallery.doLayout(jQuery(this).height(), jQuery(this).width());
				});
				jQuery('#og-thumbs img').each(function(){
					if(!IE.testImage(this)){
						jQuery(this).attr('src', overlayGallery.getValue('not-found-thumb'));
					}
				});
			}, 3000);	
		};
		
		IE.loopThroughImages();
		
	};
	
	/*
	 * @function getCurrentPage
	 * @description Returns the current page
	 */
	this.getCurrentPage = function(){
		return parseInt(overlayGallery.getValue('current-page'), 10);
	};
	
	/*
	 * @function getCurrentSlide
	 * @description Returns the current slide
	 */
	this.getCurrentSlide = function(){
		return parseInt(overlayGallery.getValue('current-slide'), 10);
	};
	
	/*
	 * @function getSlidesFromMarkup
	 * @description parses the markup to create the items for the config
	 */
	this.getSlidesFromMarkup = function(){
		
		var i = 0;
		var arr = [];
		
		// Loop over the items inside the overlayGallery div
		overlayGallery.find('a').each(function(){
			arr[i++] = {
				small: jQuery(this).attr('thumb'),
				medium: jQuery(this).find('img').attr('src'),
				large: jQuery(this).attr('href'),
				title: jQuery(this).attr('title'),
				description: jQuery(this).find('img').attr('alt')
			};
		});
		
		// Replace the items with nothing
		overlayGallery.html('');
		
		// Return the newly created object
		return arr;
	};
	
	/*
	 * @function getValue
	 * @description Gets a config value and returns it
	 * @param property The property to return
	 */
	this.getValue = function(property){
		return options[property];
	};
	
	/*
	 * @function nextPage
	 * @description Slide to the next page
	 * @param pressed (bool) If this is true, it was a user event, otherwise, the slideshow is cycling on it's own
	 */
	this.nextPage = function(pressed){
		
		// Of the current page is less than the amount of pages available, increase by an index of 1
		if ((overlayGallery.getCurrentPage() + 1) < overlayGallery.getValue('pages')){
			overlayGallery.setCurrentPage(overlayGallery.getValue('current-page') + 1);
		}
		
		// Otherwise, set the current page to 0
		else {
			overlayGallery.setCurrentPage(0);
		}
		
		// Stop the automatic rotation!
		if (pressed){
			overlayGallery.pause();
		}
		
	};
	
	/*
	 * @function nextSlide
	 * @description Goes to the next slide
	 * @param pressed (bool) If this is true, it was a user event, otherwise, the slideshow is cycling on it's own
	 */
	this.nextSlide = function(pressed){
		
		// If the current slide is equal to the number of slides available, set the current slide to 0
		if (overlayGallery.getCurrentSlide() === overlayGallery.getValue('slide-count')){
			overlayGallery.setCurrentSlide(0);
		}
		
		// Otherwise, increase the index by 1
		else {
			overlayGallery.setCurrentSlide(overlayGallery.getCurrentSlide() + 1);
		}
		
		// Stop the automatic rotation!
		if (pressed){
			overlayGallery.pause();
		}
		
	};
	
	/*
	 * @function pause
	 * @description Pauses the slideshow
	 */
	this.pause = function(){
		overlayGallery.playPause(undefined, undefined, 'pause');
	};
	
	/*
	 * @function playPause
	 * @description Starts or stops the slideshow
	 * @param caller This is an object that is generated by jQuery.  It's fine to leave this as undefined
	 * @param init (bool) If this is true, it means that this function has been called when the slideshow loads
	 * @param evt (string), if this is set to 'pause', a pause is forced
	 */
	this.playPause = function(caller, init, evt){
		
		// Pause
		if (overlayGallery.getValue('slide-count') !== 0) {
			if (jQuery('#og-playPause').hasClass('og-pause') || evt === 'pause') {
			
				// Clear the playing interval (stops the rotation)
				window.clearInterval(interval);
				
				// DOM Manipulation
				jQuery('#og-playPause').addClass('og-play').removeClass('og-pause');
				
			}
			
			// Play
			else {
			
				// If this is not called when the slideshow initializes, kick it to the next page imediately
				if (!init) {
					overlayGallery.nextSlide();
				}
				
				// Start playing the slideshow
				interval = setInterval(function(){
					overlayGallery.nextSlide();
				}, overlayGallery.getValue('slide-timeout'));
				
				// DOM Manipulation
				jQuery('#og-playPause').addClass('og-pause').removeClass('og-play');
				
			}
		}
	};
	
	/*
	 * @function previousPage
	 * @description Slide to the previous page
	 * @param pressed (bool) If this is true, it was a user event, otherwise, the slideshow is cycling on it's own
	 */
	this.previousPage = function(pressed){
		
		// If the current page is the 1'st page, go to the last page
		if (overlayGallery.getValue('current-page') === 0){
			overlayGallery.setCurrentPage(overlayGallery.getValue('pages') - 1);
		}
		
		// Otherwise, go back one
		else {
			overlayGallery.setCurrentPage(overlayGallery.getValue('current-page') - 1);
		}
		
		// Stop the automatic rotation!
		if (pressed){
			overlayGallery.pause();
		}
		
	};
	
	/*
	 * @function previousSlide
	 * @description Goes to the previous slide
	 * @param pressed (bool) If this is true, it was a user event, otherwise, the slideshow is cycling on it's own
	 */
	this.previousSlide = function(pressed){
		
		// If the current slide is the 1'st slide, go to the last slide
		if (overlayGallery.getCurrentSlide() === 0) {
			overlayGallery.setCurrentSlide(overlayGallery.getValue('slide-count'));
		}
		
		// Otherwise, just go back by one index
		else {
			overlayGallery.setCurrentSlide(overlayGallery.getCurrentSlide() - 1);
		}
		
		// Stop the automatic rotation!
		if (pressed){
			overlayGallery.pause();
		}
		
	};
	
	/*
	 * @function setCurrentPage
	 * @description Sets the current page and then goes to it
	 */
	this.setCurrentPage = function(index){
		
		// Update the current-page param
		overlayGallery.setValue('current-page', parseInt(index, 10));
		
		// Do the animation to go to the next page
		overlayGallery.animateToPage();
		
		// Update the X of Y listings
		overlayGallery.xofy();
		
	};
	
	/*
	 * @function setCurrentSlide
	 * @description Sets the current slide and removes former current slide
	 * @param index The index of the slide to make current
	 */
	this.setCurrentSlide = function(index){
		
		// Update the current-slide param
		overlayGallery.setValue('current-slide', parseInt(index, 10));
		
		// Do the animation to go to the new current slide	
		overlayGallery.animateTo(overlayGallery.getCurrentSlide());
		
		// DOM manipulation
		jQuery('.current').removeClass('current');
		jQuery('#slide-medium-' + parseInt(overlayGallery.getCurrentSlide(), 10)).addClass('current');
		jQuery('#slide-small-' + parseInt(overlayGallery.getCurrentSlide(), 10)).addClass('current');
		
		// Go to the next thumbnail page if needed
		if (
			overlayGallery.getCurrentSlide() % overlayGallery.getValue('thumbs-per-page') === 0 && 
			overlayGallery.getCurrentSlide() / overlayGallery.getValue('thumbs-per-page') !== overlayGallery.getValue('current-page')
		){
			overlayGallery.setCurrentPage(overlayGallery.getCurrentSlide() / overlayGallery.getValue('thumbs-per-page'));
		}
				
		// Update the X of Y listings
		overlayGallery.xofy();
		
	};
	
	/*
	 * @function setValue
	 * @description Sets a config value
	 * @param propery The property to get set
	 * @param value The value to add the the property
	 * @param value2 This will override the first value (if it is present)
	 */
	this.setValue = function(property, value, value2){
		
		// If there is a second value provided, it overrides the first one
		if (value2){
			options[property] = value2;
		}
		
		// Otherwise, the first value is used
		else {
			options[property] = value;
		}
	};
	
	/*
	 * @function slideClick
	 * @description Default behavior when a slide is clicked
	 */
	this.slideClick = function(){
		return true;
	};
	
	/*
	 * @function toggleThumbs
	 * @description This is the callback for thumbnails to be toggled
	 */
	this.toggleThumbs = function(){
		
		// Update the thumb container height and width
		jQuery('#og-thumbs').css({
			width: parseInt(overlayGallery.width() * (overlayGallery.getValue('slide-count') / overlayGallery.getValue('thumbs-per-page') + 1), 10),
			height: overlayGallery.height() - 30
		});
		
		// Show thumbs
		if (jQuery('#og-thumbs-overlay').hasClass('hidden')) {
			
			// Update the thumbs-are-toggled param
			overlayGallery.setValue('thumbs-are-toggled', true);
			
			// DOM Manipulation
			jQuery('#og-thumbs-overlay, .og-slides-container').each(function(){
				jQuery(this).css({
					width: overlayGallery.width(),
					height: overlayGallery.height() - 30
				});
			});
			
			jQuery('#og-thumbs-overlay, #og-thumbs, .og-slides-container').each(function(){
				jQuery(this).css({
					top: overlayGallery.height() - 30
				}).removeClass('hidden').animate({
					top: 0
				}, {
					duration: 500
				});
			});
						
		}
		
		// Hide thumbs
		else {
			
			// Update the thumbs-are-toggled param
			overlayGallery.setValue('thumbs-are-toggled', false);
			
			// DOM Manipulation
			jQuery('#og-thumbs-overlay, #og-thumbs, .og-slides-container').each(function(){
				jQuery(this).animate({
					top: overlayGallery.height() - 30
				}, {
					duration: 500,
					complete: function(){
						jQuery(this).addClass('hidden');
					}
				});
			});
			
		}
		
		// Update X of Y
		overlayGallery.xofy();
		
		// Stop the show!
		overlayGallery.pause();
	};
	
	/*
	 * @function xofy
	 * @description Updates the "X of Y" listings for the current slide or for the current page of thumbnails
	 */
	this.xofy = function(){
		
		// If the thumbnails are visible, do page X of Y listings
		if (overlayGallery.getValue('thumbs-are-toggled')){
			jQuery('.og-xofy').html((overlayGallery.getValue('current-page') + 1) + ' of ' + overlayGallery.getValue('pages') + ' pages');
		}
		
		// Otherwise, do slide X of Y listings
		else {
			jQuery('.og-xofy').html((overlayGallery.getValue('current-slide') + 1) + ' of ' + (overlayGallery.getValue('slide-count') + 1) + ' photos');
		}
		
	};

	/*
	 * @function init
	 * @description This is fired when the entire function is first initialized
	 */
	this.init = (function(){
		
		// Add the "og-" class to the primary DOM element
		overlayGallery.addClass('og-');
		
		// If the items are in markup and not in the config object, parse it
		if (!config.items){
			config.items = overlayGallery.getSlidesFromMarkup();
		}
		
		// In the case that there are no user listeners, this keeps the script from breaking
		if (!config.listeners){
			config.listeners = {};
		}
		
		// Set the values for params that will be used all over the script.  This is where we extend options as well.
		overlayGallery.setValue('slide-click', overlayGallery.slideClick, config.listeners.slideClick);
		overlayGallery.setValue('slide-count', (config.items.length - 1));
		overlayGallery.setValue('transition-timeout', 1000, config.transitionTimeout);
		overlayGallery.setValue('slide-timeout', 3000, config.timeout);
		overlayGallery.setValue('thumbs-per-page', 9, config.thumbsPerPage);
		overlayGallery.setValue('pages', Math.ceil(overlayGallery.getValue('slide-count') / overlayGallery.getValue('thumbs-per-page')));
		overlayGallery.setValue('transition-type', 'fade', config.transitionType);
		overlayGallery.setValue('thumb-transition-type', 'slide', config.thumbTransitionType);
		overlayGallery.setValue('thumbs-are-toggled', false);
		overlayGallery.setValue('current-page', 0);
		overlayGallery.setValue('not-found-image', config.notFoundImage);
		overlayGallery.setValue('not-found-thumb', config.notFoundThumb);
		overlayGallery.setValue('resize-images', false, config.resizeImages);
		
		// Generate the slides into the DOM
		overlayGallery.createSlides(config.items);
		
		// Generate the thumbnails into the DOM
		overlayGallery.createThumbs(config.items);
		
		// Generate the paging and playing controls into the DOM
		if (overlayGallery.getValue('slide-count') !== 0) {
			overlayGallery.addControls();
		}
		
		// Set the slide to start on (this also starts the gallery)
		overlayGallery.setCurrentSlide(0);
		
		// I hate that this has to be here... but you know how IE can be sometimes!
		overlayGallery.ieFixes();
		
		// Start the slideshow if autoStart is set to true
		if (config.autoStart){
			overlayGallery.playPause(undefined, true);
		}
		
		///Fire the ready
		if (config.listeners && config.listeners.ready){
			config.listeners.ready(overlayGallery);
		}
		
	})();
	
};